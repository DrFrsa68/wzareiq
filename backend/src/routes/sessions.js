const express = require('express');
const router = express.Router();
const pool = require('../db/connect');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { gradeAnswer, gradeWithImage } = require('../services/ai');
const { upload, cloudinary } = require('../services/cloudinary');
const axios = require('axios');

// بدء امتحان جديد
router.post('/start', auth, async (req, res) => {
  try {
    const { exam_id } = req.body;
    const exam = await pool.query('SELECT * FROM exams WHERE id = $1', [exam_id]);
    if (exam.rows.length === 0)
      return res.status(404).json({ error: 'الامتحان غير موجود' });

    const existing = await pool.query(
      'SELECT id FROM exam_sessions WHERE student_id = $1 AND exam_id = $2 AND status = $3',
      [req.user.id, exam_id, 'in_progress']
    );
    if (existing.rows.length > 0)
      return res.json({ session_id: existing.rows[0].id, resumed: true });

    const sessionId = uuidv4();
    await pool.query(
      'INSERT INTO exam_sessions (id, student_id, exam_id, max_score) VALUES ($1, $2, $3, $4)',
      [sessionId, req.user.id, exam_id, exam.rows[0].total_marks]
    );
    res.json({ session_id: sessionId, resumed: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حفظ إجابة نصية
router.post('/:session_id/answer', auth, async (req, res) => {
  try {
    const { question_id, answer_text } = req.body;
    const session = await pool.query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND student_id = $2',
      [req.params.session_id, req.user.id]
    );
    if (session.rows.length === 0)
      return res.status(404).json({ error: 'الجلسة غير موجودة' });

    const exists = await pool.query(
      'SELECT id FROM student_answers WHERE session_id = $1 AND question_id = $2',
      [req.params.session_id, question_id]
    );
    if (exists.rows.length > 0) {
      await pool.query(
        'UPDATE student_answers SET answer_text = $1 WHERE session_id = $2 AND question_id = $3',
        [answer_text, req.params.session_id, question_id]
      );
    } else {
      await pool.query(
        'INSERT INTO student_answers (id, session_id, question_id, answer_text) VALUES ($1, $2, $3, $4)',
        [uuidv4(), req.params.session_id, question_id, answer_text]
      );
    }
    res.json({ message: 'تم الحفظ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// رفع صورة الجواب
router.post('/:session_id/answer-image', auth, upload.single('image'), async (req, res) => {
  try {
    const { question_id } = req.body;
    const session = await pool.query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND student_id = $2',
      [req.params.session_id, req.user.id]
    );
    if (session.rows.length === 0)
      return res.status(404).json({ error: 'الجلسة غير موجودة' });

    const imageUrl = req.file.path;
    const exists = await pool.query(
      'SELECT id FROM student_answers WHERE session_id = $1 AND question_id = $2',
      [req.params.session_id, question_id]
    );
    if (exists.rows.length > 0) {
      await pool.query(
        'UPDATE student_answers SET answer_image_url = $1, answer_text = $2 WHERE session_id = $3 AND question_id = $4',
        [imageUrl, '[صورة مرفقة]', req.params.session_id, question_id]
      );
    } else {
      await pool.query(
        'INSERT INTO student_answers (id, session_id, question_id, answer_text, answer_image_url) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), req.params.session_id, question_id, '[صورة مرفقة]', imageUrl]
      );
    }
    res.json({ message: 'تم رفع الصورة', image_url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تسليم الامتحان والتصحيح بـ Gemini
router.post('/:session_id/submit', auth, async (req, res) => {
  try {
    const session = await pool.query(
      'SELECT es.*, e.title FROM exam_sessions es JOIN exams e ON es.exam_id = e.id WHERE es.id = $1 AND es.student_id = $2',
      [req.params.session_id, req.user.id]
    );
    if (session.rows.length === 0)
      return res.status(404).json({ error: 'الجلسة غير موجودة' });

    const answers = await pool.query(
      `SELECT sa.*, q.question_text, q.marks, q.model_answer
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.session_id = $1`,
      [req.params.session_id]
    );

    let totalScore = 0;
    const corrected = [];

    for (const answer of answers.rows) {
      let aiResult;
      if (answer.answer_image_url) {
        try {
          const imgRes = await axios.get(answer.answer_image_url, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(imgRes.data).toString('base64');
          aiResult = await gradeWithImage(answer.question_text, answer.model_answer, base64, answer.marks);
        } catch {
          aiResult = await gradeAnswer(answer.question_text, answer.model_answer, '[صورة غير قابلة للقراءة]', answer.marks);
        }
      } else {
        aiResult = await gradeAnswer(answer.question_text, answer.model_answer, answer.answer_text || '', answer.marks);
      }

      await pool.query(
        'UPDATE student_answers SET ai_score = $1, ai_feedback = $2 WHERE id = $3',
        [aiResult.score, aiResult.feedback, answer.id]
      );

      totalScore += aiResult.score;
      corrected.push({
        question_text: answer.question_text,
        student_answer: answer.answer_text,
        answer_image_url: answer.answer_image_url,
        model_answer: answer.model_answer,
        marks: answer.marks,
        score: aiResult.score,
        feedback: aiResult.feedback
      });
    }

    await pool.query(
      'UPDATE exam_sessions SET status = $1, total_score = $2, submitted_at = NOW() WHERE id = $3',
      ['completed', totalScore, req.params.session_id]
    );

    res.json({
      session_id: req.params.session_id,
      total_score: totalScore,
      max_score: session.rows[0].max_score,
      title: session.rows[0].title,
      answers: corrected
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// سجل الامتحانات
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT es.*, e.title, e.year, e.round, s.name as subject_name, s.color, s.icon
       FROM exam_sessions es
       JOIN exams e ON es.exam_id = e.id
       JOIN subjects s ON e.subject_id = s.id
       WHERE es.student_id = $1 AND es.status = 'completed'
       ORDER BY es.submitted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تفاصيل جلسة
router.get('/:session_id', auth, async (req, res) => {
  try {
    const session = await pool.query(
      `SELECT es.*, e.title, e.year, e.round, e.duration, s.name as subject_name
       FROM exam_sessions es
       JOIN exams e ON es.exam_id = e.id
       JOIN subjects s ON e.subject_id = s.id
       WHERE es.id = $1 AND es.student_id = $2`,
      [req.params.session_id, req.user.id]
    );
    if (session.rows.length === 0)
      return res.status(404).json({ error: 'غير موجود' });

    const answers = await pool.query(
      `SELECT sa.*, q.question_text, q.marks, q.model_answer, q.question_number
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.session_id = $1
       ORDER BY q.question_number`,
      [req.params.session_id]
    );
    res.json({ ...session.rows[0], answers: answers.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
