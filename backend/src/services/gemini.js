const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function gradeAnswer(question, modelAnswer, studentAnswer, maxMarks) {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `أنت مصحح امتحانات عراقي خبير للسادس الإعدادي. صحح إجابة الطالب بدقة وموضوعية.

السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
إجابة الطالب: ${studentAnswer}
الدرجة الكاملة: ${maxMarks}

رد فقط بـ JSON بدون أي نص إضافي أو backticks:
{"score": رقم من 0 إلى ${maxMarks}, "feedback": "تعليق مختصر بالعربي"}`
          }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(parsed.score, 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('Gemini error:', err);
    return { score: 0, feedback: 'تعذر التصحيح التلقائي' };
  }
}

async function gradeWithImage(question, modelAnswer, imageBase64, maxMarks) {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `أنت مصحح امتحانات عراقي خبير. السؤال: ${question}\nالإجابة النموذجية: ${modelAnswer}\nالدرجة الكاملة: ${maxMarks}\nاقرأ إجابة الطالب من الصورة وصححها.\nرد فقط بـ JSON: {"score": رقم, "feedback": "تعليق"}` },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(parsed.score, 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    return { score: 0, feedback: 'تعذر تحليل الصورة' };
  }
}

module.exports = { gradeAnswer, gradeWithImage };
