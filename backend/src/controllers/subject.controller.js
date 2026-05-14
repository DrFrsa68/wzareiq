const prisma = require('../services/prisma');

const VALID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_COLORS = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const VALID_ICONS = ['calculator', 'zap', 'flask', 'leaf', 'book', 'globe', 'star'];

exports.getAll = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { _count: { select: { exams: true } } }
    });
    res.json(subjects);
  } catch (err) {
    console.error('GetAll error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    if (!name || !icon || !color)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50)
      return res.status(400).json({ error: 'اسم المادة يجب أن يكون بين 2-50 حرف' });
    if (!VALID_ICONS.includes(icon))
      return res.status(400).json({ error: 'الأيقونة غير صالحة' });
    if (!VALID_COLORS.test(color))
      return res.status(400).json({ error: 'اللون غير صالح' });

    const exists = await prisma.subject.findFirst({ where: { name: name.trim() } });
    if (exists) return res.status(400).json({ error: 'المادة موجودة مسبقاً' });

    const subject = await prisma.subject.create({
      data: { name: name.trim(), icon, color }
    });
    res.status(201).json(subject);
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.update = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

    const { name, icon, color } = req.body;
    const data = {};

    if (name) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50)
        return res.status(400).json({ error: 'اسم المادة يجب أن يكون بين 2-50 حرف' });
      data.name = name.trim();
    }
    if (icon) {
      if (!VALID_ICONS.includes(icon))
        return res.status(400).json({ error: 'الأيقونة غير صالحة' });
      data.icon = icon;
    }
    if (color) {
      if (!VALID_COLORS.test(color))
        return res.status(400).json({ error: 'اللون غير صالح' });
      data.color = color;
    }

    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data
    });
    res.json(subject);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    console.error('Remove error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};