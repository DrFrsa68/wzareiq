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

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(400).json({ error: 'اسم المستخدم مستخدم' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, username, password: hashed }
    });

    res.status(201).json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'المستخدم غير موجود' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'كلمة المرور غلط' });

    res.json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, username: true, role: true, avatar: true, createdAt: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};
