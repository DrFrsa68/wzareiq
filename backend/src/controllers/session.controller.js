const prisma = require('../services/prisma');
const { gradeAnswer } = require('../services/ai.service');
const { sendToUser } = require('../services/notification.service');

const VALID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.start = async (req, res) => {
  try {
    const { examId } = req.body;

    if (!examId || !VALID_UUID.test(examId))
      return res.status(400).json({ error: 'معرف الامتحان غير صالح' });

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { number: 'asc' } } }
    });
    if (!exam) return res.status(404).json({ error: 'الامتحان غير موجود' });
    if (exam.questions.length === 0)
      return res.status(400).json({ error: 'الامتحان لا يحتوي على أسئلة' });

    const openSession = await prisma.examSession.findFirst({
      where: { userId: req.user.id, examId, submittedAt: null }
    });
    if (openSession) {
      await prisma.answer.deleteMany({ where: { sessionId: openSession.id } });
      await prisma.examSession.delete({ where: { id: openSession.id } });
    }

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
    console.error('Start error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

    const { questionId, studentAnswer } = req.body;

    if (!questionId || !VALID_UUID.test(questionId))
      return res.status(400).json({ error: 'معرف السؤال غير صالح' });
    if (studentAnswer && typeof studentAnswer !== 'string')
      return res.status(400).json({ error: 'الإجابة غير صالحة' });
    if (studentAnswer && studentAnswer.length > 5000)
      return res.status(400).json({ error: 'الإجابة طويلة جداً' });

    const session = await prisma.examSession.findFirst({
      where: { id: req.params.id, userId: req.user.id, submittedAt: null }
    });
    if (!session) return res.status(403).json({ error: 'غير مصرح أو الجلسة منتهية' });

    const answer = await prisma.answer.updateMany({
      where: { sessionId: req.params.id, questionId },
      data: { studentAnswer: studentAnswer?.trim() || null }
    });
    res.json(answer);
  } catch (err) {
    console.error('SaveAnswer error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.submit = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

    const session = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        answers: {
          include: {
            question: { include: { answer: true } }
          },
          orderBy: {
            question: { number: 'asc' }
          }
        }
      }
    });

    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'غير مصرح' });
    if (session.submittedAt) return res.status(400).json({ error: 'تم تسليم هذا الامتحان مسبقاً' });

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
          },
          orderBy: {
            question: { number: 'asc' }
          }
        }
      }
    });

    // إرسال إشعار للطالب
    const totalMarks = updated.answers.reduce((s, a) => s + a.question.marks, 0);
    await sendToUser(
      req.user.id,
      'نتيجة امتحانك جاهزة! 🎉',
      `حصلت على ${Math.round(totalScore)} من ${totalMarks} درجة`,
      { sessionId: req.params.id }
    );

    res.json(updated);
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const sessions = await prisma.examSession.findMany({
      where: { userId: req.user.id, submittedAt: { not: null } },
      include: { exam: { include: { subject: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 50
    });
    res.json(sessions);
  } catch (err) {
    console.error('GetHistory error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};

exports.getResult = async (req, res) => {
  try {
    if (!VALID_UUID.test(req.params.id))
      return res.status(400).json({ error: 'معرف غير صالح' });

    const session = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        exam: { include: { subject: true } },
        answers: {
          include: {
            question: { include: { answer: true } }
          },
          orderBy: {
            question: { number: 'asc' }
          }
        }
      }
    });
    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'غير مصرح' });

    res.json(session);
  } catch (err) {
    console.error('GetResult error:', err);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
};