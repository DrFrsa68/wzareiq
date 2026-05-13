const prisma = require('../services/prisma');

exports.search = async (req, res) => {
  try {
    const { subjectId, type, year, round } = req.query;

    const exams = await prisma.exam.findMany({
      where: {
        subjectId,
        ...(type && { type }),
        ...(year && { year: parseInt(year) }),
        ...(round && { round })
      },
      include: {
        subject: true,
        _count: { select: { questions: true } }
      }
    });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getAvailableYears = async (req, res) => {
  try {
    const { subjectId, type } = req.query;
    const years = await prisma.exam.findMany({
      where: { subjectId, ...(type && { type }) },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    });
    res.json(years.map(e => e.year));
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getAvailableRounds = async (req, res) => {
  try {
    const { subjectId, type, year } = req.query;
    const rounds = await prisma.exam.findMany({
      where: { subjectId, ...(type && { type }), ...(year && { year: parseInt(year) }) },
      select: { round: true },
      distinct: ['round']
    });
    res.json(rounds.map(e => e.round));
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getById = async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        questions: {
          include: { answer: true },
          orderBy: { number: 'asc' }
        }
      }
    });
    if (!exam) return res.status(404).json({ error: 'الامتحان غير موجود' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.create = async (req, res) => {
  try {
    const exam = await prisma.exam.create({ data: req.body });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};
