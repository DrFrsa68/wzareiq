const router = require('express').Router();
const prisma = require('../services/prisma');

router.get('/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

module.exports = router;
