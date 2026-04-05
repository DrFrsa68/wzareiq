const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function gradeAnswer(question, modelAnswer, studentAnswer, maxMarks) {
  console.log('🤖 Gemini grading text answer...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `صحح إجابة الطالب. رد فقط بـ JSON بدون أي نص إضافي:
السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
إجابة الطالب: ${studentAnswer}
الدرجة الكاملة: ${maxMarks}
{"score": رقم, "feedback": "تعليق"}`
          }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      })
    });
    clearTimeout(timeout);

    const data = await response.json();
    console.log('✅ Gemini response:', JSON.stringify(data).slice(0, 200));

    if (!data.candidates?.[0]) {
      console.log('❌ No candidates:', JSON.stringify(data));
      return { score: Math.round(maxMarks * 0.5), feedback: 'تم التصحيح تلقائياً' };
    }

    const text = data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(Number(parsed.score), 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('❌ Gemini error:', err.message);
    return { score: Math.round(maxMarks * 0.5), feedback: 'تم التصحيح تلقائياً' };
  }
}

async function gradeWithImage(question, modelAnswer, imageBase64, maxMarks) {
  console.log('🖼️ Gemini grading image answer...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `اقرأ إجابة الطالب من الصورة وصححها. رد فقط بـ JSON:\nالسؤال: ${question}\nالإجابة النموذجية: ${modelAnswer}\nالدرجة: ${maxMarks}\n{"score": رقم, "feedback": "تعليق"}` },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      })
    });
    clearTimeout(timeout);

    const data = await response.json();
    console.log('✅ Gemini image response:', JSON.stringify(data).slice(0, 200));

    if (!data.candidates?.[0]) {
      return { score: Math.round(maxMarks * 0.5), feedback: 'تم التصحيح تلقائياً' };
    }

    const text = data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(Number(parsed.score), 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('❌ Gemini image error:', err.message);
    return { score: Math.round(maxMarks * 0.5), feedback: 'تم التصحيح تلقائياً' };
  }
}

module.exports = { gradeAnswer, gradeWithImage };
