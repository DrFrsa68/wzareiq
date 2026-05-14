const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../services/prisma');

const generateToken = (user) => jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

exports.register = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Validation
    if (!name || !username || !password)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    if (name.trim().length < 2 || name.trim().length > 50)
      return res.status(400).json({ error: 'الاسم يجب أن يكون بين 2-50 حرف' });
    if (username.trim().length < 3 || username.trim().length > 30)
      return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون بين 3-30 حرف' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ error: 'اسم المستخدم يحتوي على أحرف غير مسموحة' });
    if (password.length < 6 || password.length > 100)
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون بين 6-100 حرف' });

    const exists = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
    if (exists) return res.status(400).json({ error: 'اسم المستخدم مستخدم' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: hashed
      }
    });

    res.status(201).json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (typeof username !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    if (username.length > 30 || password.length > 100)
      return res.status(400).json({ error: 'بيانات غير صالحة' });

    const user = await prisma.user.findUnique({ 
      where: { username: username.trim().toLowerCase() } 
    });

    // نفس الرسالة للأمان (ما نكشف إذا المستخدم موجود أو لا)
    if (!user) {
      await bcrypt.compare(password, '$2a$12$dummyhashfordummycomparison123456');
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غلط' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غلط' });

    res.json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, 
        name: true, 
        username: true, 
        role: true, 
        avatar: true, 
        createdAt: true 
      }
    });

    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};