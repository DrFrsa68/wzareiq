const pool = require('../db/connect');

// تأكد إن الطالب يملك الـ session
const validateSessionOwnership = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const result = await pool.query(
      'SELECT student_id FROM exam_sessions WHERE id = $1',
      [session_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'غير موجود' });
    if (result.rows[0].student_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'غير مصرح' });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { validateSessionOwnership };
