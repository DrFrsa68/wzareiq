const express = require('express');
const router = express.Router();
const pool = require('../db/connect');
const auth = require('../middleware/auth');

// جلب جميع المواد
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة مادة (أدمن فقط)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'غير مصرح' });

    const { name, icon, color } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const result = await pool.query(
      'INSERT INTO subjects (id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), name, icon, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مادة (أدمن فقط)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'غير مصرح' });

    await pool.query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
