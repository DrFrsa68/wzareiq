const express = require('express');
const router = express.Router();
const pool = require('../db/connect');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { gradeAnswer, gradeWithImage } = require('../services/ai');
const { upload } = require('../services/cloudinary');
const axios = require('axios');

router.post('/start', auth, async (req, res) => {
  try {
    const { exam_id } = req.body;
    const exam = await pool.query('SELECT * FROM exams WHERE id = $1', [exam_id]);
    if (exam.rows.length === 0) return res.status(404).json({ error: 'الامتحان غير موجود' });
    const existing = await pool.query(
      'SELECT id FROM exam_sessions WHERE student_id = $1 AND exam_id = $2 AND status = $3',
      [req.user.id, exam_id, 'in_progress']
    );
    if (existing.rows.length > 0) return res.json({ session_id: existing.rows[0].id, resumed: true });
    const sessionId = uuidv4();
    await pool.query(
      'INSERT INTO exam_sessions (id, student_id, exam_id, max_score) VALUES ($1, $2, $3, $4)',
      [sessionId, req.user.id, exam_id, exam.rows[0].total_marks]
    );
    res.json({ session_id: sessionId, resumed: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:session_id/answer', auth, async (req, res) => {
  try {
    const { question_id, answer_text } = req.body;
    const exists = await pool.query(
      'SELECT id FROM student_answers WHERE session_id = $1 AND question_id = $2',
      [req.params.session_id, question_id]
    );
    if (exists.rows.length > 0) {
      await pool.query('UPDATE student_answers SET answer_text = $1 WHERE session_id = $2 AND question_id = $3',
        [answer_text, req.params.session_id, question_id]);
    } else {
      await pool.query('INSERT INTO student_answers (id, session_id, question_id, answer_text) VALUES ($1, $2, $3, $4)',
        [uuidv4(), req.params.session_id, question_id, answer_text]);
    }
    res.json({ message: 'تم الحفظ' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:session_id/answer-image', auth, upload.single('image'), async (req, res) => {
  try {
    const { question_id } = req.body;
    const imageUrl = req.file.path;
    const exists = await pool.query(
      'SELECT id FROM student_answers WHERE session_id = $1 AND question_id = $2',
      [req.params.session_id, question_id]
    );
    if (exists.rows.length > 0) {
      await pool.query('UPDATE student_answers SET answer_image_url = $1, answer_text = $2 WHERE session_id = $3 AND question_id = $4',
        [imageUrl, '[صورة مرفقة]', req.params.session_id, question_id]);
    } else {
      await pool.query('INSERT INTO student_answers (id, session_id, question_id, answer_text, answer_image_url) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), req.params.session_id, question_id, '[صورة مرفقة]', imageUrl]);
    }
    res.json({ message: 'تم رفع الصورة', image_url: imageUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// تسليم فوري بدون انتظار AI
router.post('/:session_id/submit', auth, async (req, res) => {
  try {
    const session = await pool.query(
      'SELECT es.*, e.title FROM exam_sessions es JOIN exams e ON es.exam_id = e.id WHERE es.id = $1 AND es.student_id = $2',
      [req.params.session_id, req.user.id]
    );
    if (session.rows.length === 0) return res.status(404).json({ error: 'الجلسة غير موجودة' });

    const answers = await pool.query(
      `SELECT sa.*, q.question_text, q.marks, q.model_answer
       FROM student_answers sa JOIN questions q ON sa.question_id = q.id
       WHERE sa.session_id = $1`,
      [req.params.session_id]
    );

    // نحسب درجة أولية فورية (50% من كل سؤال)
    const initialScore = answers.rows.reduce((sum, a) => sum + Math.round(a.marks * 0.5), 0);

    // نحفظ الجلسة كمكتملة فوراً
    await pool.query(
      'UPDATE exam_sessions SET status = $1, total_score = $2, submitted_at = NOW() WHERE id = $3',
      ['grading', initialScore, req.params.session_id]
    );

    // نرجع النتيجة فوراً للطالب
    const response = {
      session_id: req.params.session_id,
      total_score: initialScore,
      max_score: session.rows[0].max_score,
      title: session.rows[0].title,
      grading: true,
      answers: answers.rows.map(a => ({
        question_text: a.question_text,
        student_answer: a.answer_text,
        model_answer: a.model_answer,
        marks: a.marks,
        score: Math.round(a.marks * 0.5),
        feedback: 'جاري التصحيح...'
      }))
    };

    res.json(response);

    // التصحيح بالـ AI يصير في الخلفية
    gradeInBackground(req.params.session_id, answers.rows, session.rows[0].max_score);

  } catch (err) { res.status(500).json({ error: err.message }); }
});

// تصحيح في الخلفية
async function gradeInBackground(sessionId, answers, maxScore) {
  try {
    let totalScore = 0;
    for (const answer of answers) {
      let result;
      if (answer.answer_image_url) {
        try {
          const imgRes = await axios.get(answer.answer_image_url, { responseType: 'arraybuffer', timeout: 10000 });
          const base64 = Buffer.from(imgRes.data).toString('base64');
          result = await gradeWithImage(answer.question_text, answer.model_answer, base64, answer.marks);
        } catch {
          result = await gradeAnswer(answer.question_text, answer.model_answer, answer.answer_text || '', answer.marks);
        }
      } else {
        result = await gradeAnswer(answer.question_text, answer.model_answer, answer.answer_text || '', answer.marks);
      }
      await pool.query('UPDATE student_answers SET ai_score = $1, ai_feedback = $2 WHERE id = $3',
        [result.score, result.feedback, answer.id]);
      totalScore += result.score;
    }
    await pool.query('UPDATE exam_sessions SET status = $1, total_score = $2 WHERE id = $3',
      ['completed', totalScore, sessionId]);
    console.log('✅ Background grading done:', sessionId, totalScore);
  } catch (err) {
    console.error('❌ Background grading error:', err.message);
    await pool.query("UPDATE exam_sessions SET status = 'completed' WHERE id = $1", [sessionId]);
  }
}

router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT es.*, e.title, e.year, e.round, s.name as subject_name, s.color, s.icon
       FROM exam_sessions es JOIN exams e ON es.exam_id = e.id JOIN subjects s ON e.subject_id = s.id
       WHERE es.student_id = $1 AND es.status IN ('completed', 'grading')
       ORDER BY es.submitted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:session_id', auth, async (req, res) => {
  try {
    const session = await pool.query(
      `SELECT es.*, e.title, e.year, e.round, e.duration, s.name as subject_name
       FROM exam_sessions es JOIN exams e ON es.exam_id = e.id JOIN subjects s ON e.subject_id = s.id
       WHERE es.id = $1 AND es.student_id = $2`,
      [req.params.session_id, req.user.id]
    );
    if (session.rows.length === 0) return res.status(404).json({ error: 'غير موجود' });
    const answers = await pool.query(
      `SELECT sa.*, q.question_text, q.marks, q.model_answer, q.question_number
       FROM student_answers sa JOIN questions q ON sa.question_id = q.id
       WHERE sa.session_id = $1 ORDER BY q.question_number`,
      [req.params.session_id]
    );
    res.json({ ...session.rows[0], answers: answers.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
