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

router.put('/students/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'STUDENT'].includes(role))
      return res.status(400).json({ error: 'صلاحية غير صالحة' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'لا تقدر تحذف حسابك' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

module.exports = router;
