const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/connect');

const JWT_SECRET = process.env.JWT_SECRET || 'wzareiq_secret_2024';

// تسجيل حساب جديد
router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });

    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'اسم المستخدم مأخوذ' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (id, name, username, password) VALUES ($1, $2, $3, $4) RETURNING id, name, username, role',
      [uuidv4(), name, username, hashed]
    );

    const token = jwt.sign({ id: result.rows[0].id, role: result.rows[0].role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غلط' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غلط' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
