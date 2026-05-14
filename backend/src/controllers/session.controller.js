const prisma = require('../services/prisma');
const { gradeAnswer } = require('../services/ai.service');

exports.start = async (req, res) => {
  try {
    const { examId } = req.body;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { number: 'asc' } } }
    });
    if (!exam) return res.status(404).json({ error: 'الامتحان غير موجود' });

    const session = await prisma.examSession.create({
      data: {
        userId: req.user.id,
        examId,
        answers: {
          create: exam.questions.map(q => ({ questionId: q.id }))
        }
      },
      include: {
        exam: {
          include: {
            questions: { orderBy: { number: 'asc' } }
          }
        }
      }
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    const { questionId, studentAnswer } = req.body;

    const answer = await prisma.answer.updateMany({
      where: { sessionId: req.params.id, questionId },
      data: { studentAnswer }
    });
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.submit = async (req, res) => {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        answers: {
          include: {
            question: { include: { answer: true } }
          }
        }
      }
    });

    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });

    let totalScore = 0;
    for (const answer of session.answers) {
      if (answer.question.answer && answer.studentAnswer) {
        const result = await gradeAnswer(
          answer.question.text,
          answer.question.answer.text,
          answer.studentAnswer
        );
        const aiScore = (result.score / 10) * answer.question.marks;
        totalScore += aiScore;
        await prisma.answer.update({
          where: { id: answer.id },
          data: { aiScore, aiFeedback: result.feedback }
        });
      }
    }

    const updated = await prisma.examSession.update({
      where: { id: req.params.id },
      data: { submittedAt: new Date(), totalScore },
      include: {
        answers: {
          include: {
            question: { include: { answer: true } }
          }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const sessions = await prisma.examSession.findMany({
      where: { userId: req.user.id, submittedAt: { not: null } },
      include: { exam: { include: { subject: true } } },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getResult = async (req, res) => {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        exam: { include: { subject: true } },
        answers: {
          include: {
            question: { include: { answer: true } }
          }
        }
      }
    });
    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'غير مصرح' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};