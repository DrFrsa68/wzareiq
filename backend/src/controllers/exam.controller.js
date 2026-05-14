const prisma = require('../services/prisma');

const VALID_TYPES = ['COMPREHENSIVE', 'BY_CHAPTER'];
const VALID_ROUNDS = ['FIRST', 'SECOND', 'THIRD', 'PRELIMINARY'];
const VALID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.search = async (req, res) => {
  try {
    const { subjectId, type, year, round } = req.query;

    if (!subjectId || !VALID_UUID.test(subjectId))
      return res.status(400).json({ error: 'معرف المادة غير صالح' });
    if (type && !VALID_TYPES.includes(type))
      return res.status(400).json({ error: 'نوع الامتحان غير صالح' });
    if (round && !VALID_ROUNDS.includes(round))
      return res.status(400).json({ error: 'الدور غير صالح' });
    if (year) {
      const y = parseInt(year);
      if (isNaN(y) || y < 2000 || y > 2030)
        return res.status(400).json({ error: 'السنة غير صالحة' });
    }

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
    console.error('Search error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getAvailableYears = async (req, res) => {
  try {
    const { subjectId, type } = req.query;

    if (!subjectId || !VALID_UUID.test(subjectId))
      return res.status(400).json({ error: 'معرف المادة غير صالح' });
    if (type && !VALID_TYPES.includes(type))
      return res.status(400).json({ error: 'نوع الامتحان غير صالح' });

    const years = await prisma.exam.findMany({
      where: { subjectId, ...(type && { type }) },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    });
    res.json(years.map(e => e.year));
  } catch (err) {
    console.error('GetYears error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getAvailableRounds = async (req, res) => {
  try {
    const { subjectId, type, year } = req.query;

    if (!subjectId || !VALID_UUID.test(subjectId))
      return res.status(400).json({ error: 'معرف المادة غير صالح' });
    if (type && !VALID_TYPES.includes(type))
      return res.status(400).json({ error: 'نوع الامتحان غير صالح' });
    if (year) {
      const y = parseInt(year);
      if (isNaN(y) || y < 2000 || y > 2030)
        return res.status(400).json({ error: 'السنة غير صالحة' });
    }

    const rounds = await prisma.exam.findMany({
      where: { subjectId, ...(type && { type }), ...(year && { year: parseInt(year) }) },
      select: { round: true },
      distinct: ['round']
    });
    res.json(rounds.map(e => e.round));
  } catch (err) {
    console.error('GetRounds error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getById = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

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
    console.error('GetById error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.create = async (req, res) => {
  try {
    const { subjectId, year, round, type, duration } = req.body;

    if (!subjectId || !VALID_UUID.test(subjectId))
      return res.status(400).json({ error: 'معرف المادة غير صالح' });
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ error: 'نوع الامتحان غير صالح' });
    if (!VALID_ROUNDS.includes(round))
      return res.status(400).json({ error: 'الدور غير صالح' });
    if (!year || year < 2000 || year > 2030)
      return res.status(400).json({ error: 'السنة غير صالحة' });
    if (!duration || duration < 10 || duration > 300)
      return res.status(400).json({ error: 'مدة الامتحان يجب أن تكون بين 10-300 دقيقة' });

    const exam = await prisma.exam.create({
      data: { subjectId, year, round, type, duration }
    });
    res.status(201).json(exam);
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

    const { number, text, marks, chapter } = req.body;

    if (!number || !text || !marks)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (typeof text !== 'string' || text.trim().length < 5 || text.length > 2000)
      return res.status(400).json({ error: 'نص السؤال يجب أن يكون بين 5-2000 حرف' });
    if (isNaN(number) || number < 1 || number > 50)
      return res.status(400).json({ error: 'رقم السؤال غير صالح' });
    if (isNaN(marks) || marks < 1 || marks > 100)
      return res.status(400).json({ error: 'الدرجة يجب أن تكون بين 1-100' });

    const question = await prisma.question.create({
      data: {
        examId: req.params.id,
        number: parseInt(number),
        text: text.trim(),
        marks: parseInt(marks),
        ...(chapter && { chapter: parseInt(chapter) })
      }
    });
    res.status(201).json(question);
  } catch (err) {
    console.error('AddQuestion error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.addModelAnswer = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.questionId))
      return res.status(400).json({ error: 'معرف غير صالح' });

    const { text, imageUrl } = req.body;

    if (!text && !imageUrl)
      return res.status(400).json({ error: 'الإجابة النموذجية مطلوبة' });
    if (text && (typeof text !== 'string' || text.length > 5000))
      return res.status(400).json({ error: 'نص الإجابة طويل جداً' });
    if (imageUrl && typeof imageUrl !== 'string')
      return res.status(400).json({ error: 'رابط الصورة غير صالح' });

    const answer = await prisma.modelAnswer.create({
      data: {
        questionId: req.params.questionId,
        ...(text && { text: text.trim() }),
        ...(imageUrl && { imageUrl })
      }
    });
    res.status(201).json(answer);
  } catch (err) {
    console.error('AddModelAnswer error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};