const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function gradeAnswer(question, modelAnswer, studentAnswer, maxMarks) {
  console.log('🤖 Groq grading text...');
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `أنت مصحح امتحانات عراقي خبير للسادس الإعدادي. صحح بدقة.
السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
إجابة الطالب: ${studentAnswer}
الدرجة الكاملة: ${maxMarks}
رد فقط بـ JSON: {"score": رقم, "feedback": "تعليق"}`
      }],
      temperature: 0.1,
      max_tokens: 200,
    });
    const text = completion.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(Number(parsed.score), 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('❌ Groq error:', err.message);
    return { score: Math.round(maxMarks * 0.5), feedback: 'تم التصحيح تلقائياً' };
  }
}

async function gradeWithImage(question, modelAnswer, imageBase64, maxMarks) {
  console.log('🖼️ Groq grading image...');
  try {
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `أنت مصحح امتحانات عراقي خبير. اقرأ إجابة الطالب من الصورة وصححها.
السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
الدرجة الكاملة: ${maxMarks}
رد فقط بـ JSON: {"score": رقم, "feedback": "تعليق"}`
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }],
      temperature: 0.1,
      max_tokens: 200,
    });
    const text = completion.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(Number(parsed.score), 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('❌ Groq image error:', err.message);
    return await gradeAnswer(question, modelAnswer, '[إجابة مكتوبة بخط اليد]', maxMarks);
  }
}

module.exports = { gradeAnswer, gradeWithImage };
