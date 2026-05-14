const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

exports.gradeAnswer = async (question, modelAnswer, studentAnswer) => {
  if (!studentAnswer || studentAnswer.trim() === '') {
    return { score: 0, feedback: 'لم يتم الإجابة على السؤال' };
  }

  const prompt = `
أنت مصحح امتحانات عراقي متخصص.

السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
إجابة الطالب: ${studentAnswer}
الدرجة الكاملة: ${10}

قيّم إجابة الطالب مقارنة بالإجابة النموذجية وأعط درجة من 10.
أجب فقط بصيغة JSON هكذا:
{"score": 8, "feedback": "إجابة جيدة لكن ناقصة كذا"}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('AI Error:', err);
    return { score: 0, feedback: 'خطأ بالتصحيح التلقائي' };
  }
};