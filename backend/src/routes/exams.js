const express = require('express');
const router = express.Router();
const pool = require('../db/connect');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// جلب جميع الامتحانات
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, s.name as subject_name, s.color, s.icon
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// البحث عن الامتحانات
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

// جلب السنوات المتاحة
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

// جلب الأدوار المتاحة
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

// حذف امتحان
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
