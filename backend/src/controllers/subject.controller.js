const prisma = require('../services/prisma');

exports.getAll = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { _count: { select: { exams: true } } }
    });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const subject = await prisma.subject.create({
      data: { name, icon, color }
    });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.update = async (req, res) => {
  try {
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};
