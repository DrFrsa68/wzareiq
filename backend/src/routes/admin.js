const express = require('express');
const router = express.Router();
const pool = require('../db/connect');
const auth = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'غير مصرح' });
  next();
};

// إحصائيات عامة
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [exams, students, sessions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM exams'),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*) FROM exam_sessions WHERE status = 'completed'"),
    ]);
    res.json({
      exams: parseInt(exams.rows[0].count),
      students: parseInt(students.rows[0].count),
      sessions: parseInt(sessions.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// جلب جميع الطلاب
router.get('/students', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, username, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// حذف طالب
router.delete('/students/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم الحذف' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// جلب جميع الامتحانات
router.get('/exams', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, s.name as subject_name FROM exams e
       JOIN subjects s ON e.subject_id = s.id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// تعيين أدمن
router.patch('/students/:id/make-admin', auth, adminOnly, async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [req.params.id]);
    res.json({ message: 'تم التعيين' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// تحديث امتحان
router.put('/exams/:id', auth, adminOnly, async (req, res) => {
  const { title, subject_id, year, round, exam_type, duration, total_marks } = req.body;
  try {
    await pool.query(
      `UPDATE exams 
       SET title = $1, subject_id = $2, year = $3, round = $4, 
           exam_type = $5, duration = $6, total_marks = $7
       WHERE id = $8`,
      [title, subject_id, year, round, exam_type, duration, total_marks, req.params.id]
    );
    res.json({ message: 'Exam updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
