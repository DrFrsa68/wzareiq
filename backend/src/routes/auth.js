const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/connect');
const { loginLimiter, registerLimiter } = require('../middleware/security');

const JWT_SECRET = process.env.JWT_SECRET;

const sanitize = (str) => str?.trim().replace(/[<>'"]/g, '') || '';

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const name = sanitize(req.body.name);
    const username = sanitize(req.body.username)?.toLowerCase();
    const { password } = req.body;

    if (!name || !username || !password)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (name.length < 2 || name.length > 50)
      return res.status(400).json({ error: 'الاسم يجب أن يكون بين 2 و50 حرف' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return res.status(400).json({ error: 'اسم المستخدم: أحرف إنجليزية وأرقام فقط (3-20 حرف)' });
    if (password.length < 6)
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'اسم المستخدم مأخوذ' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (id, name, username, password) VALUES ($1, $2, $3, $4) RETURNING id, name, username, role',
      [uuidv4(), name, username, hashed]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const username = sanitize(req.body.username)?.toLowerCase();
    const { password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'أدخل اسم المستخدم وكلمة المرور' });

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    // نفس الرسالة لمنع تخمين الحسابات الموجودة
    if (result.rows.length === 0) {
      await bcrypt.compare(password, '$2b$12$invalidhashfortimingatk');
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غلط' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غلط' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
  }
});

module.exports = router;
