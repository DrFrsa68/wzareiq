const express = require('express');
const router = express.Router();
const pool = require('../db/connect');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// البحث عن امتحانات
router.get('/search', async (req, res) => {
  try {
    const { subject_id, exam_type, year, round } = req.query;
    let query = `
      SELECT e.*, s.name as subject_name, s.color, s.icon
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.subject_id = $1 AND e.exam_type = $2
    `;
    const params = [subject_id, exam_type];

    if (year) { query += ` AND e.year = $${params.length + 1}`; params.push(year); }
    if (round) { query += ` AND e.round = $${params.length + 1}`; params.push(round); }

    query += ' ORDER BY e.year DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// السنوات المتوفرة لمادة ونوع امتحان
router.get('/years', async (req, res) => {
  try {
    const { subject_id, exam_type } = req.query;
    const result = await pool.query(
      'SELECT DISTINCT year FROM exams WHERE subject_id = $1 AND exam_type = $2 ORDER BY year DESC',
      [subject_id, exam_type]
    );
    res.json(result.rows.map(r => r.year));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// الأدوار المتوفرة لسنة معينة
router.get('/rounds', async (req, res) => {
  try {
    const { subject_id, exam_type, year } = req.query;
    const result = await pool.query(
      'SELECT DISTINCT round FROM exams WHERE subject_id = $1 AND exam_type = $2 AND year = $3',
      [subject_id, exam_type, year]
    );
    res.json(result.rows.map(r => r.round));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب أسئلة امتحان معين
router.get('/:id/questions', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions WHERE exam_id = $1 ORDER BY question_number',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة امتحان (أدمن)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'غير مصرح' });

    const { subject_id, title, year, round, exam_type, chapter, duration, questions } = req.body;
    const examId = uuidv4();

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    await pool.query(
      'INSERT INTO exams (id, subject_id, title, year, round, exam_type, chapter, duration, total_marks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [examId, subject_id, title, year, round, exam_type, chapter, duration, totalMarks]
    );

    for (const q of questions) {
      await pool.query(
        'INSERT INTO questions (id, exam_id, question_number, question_text, marks, model_answer) VALUES ($1,$2,$3,$4,$5,$6)',
        [uuidv4(), examId, q.question_number, q.question_text, q.marks, q.model_answer]
      );
    }

    res.json({ message: 'تم إضافة الامتحان', exam_id: examId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف امتحان (أدمن)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'غير مصرح' });

    await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
