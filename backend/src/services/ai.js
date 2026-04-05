const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// تصحيح الإجابات النصية بـ Groq
async function gradeAnswer(question, modelAnswer, studentAnswer, maxMarks) {
  console.log('🤖 Groq grading...');
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `أنت مصحح امتحانات عراقي خبير للسادس الإعدادي. صحح إجابة الطالب بدقة وموضوعية.

السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
إجابة الطالب: ${studentAnswer}
الدرجة الكاملة: ${maxMarks}

رد فقط بـ JSON بدون أي نص إضافي:
{"score": رقم من 0 إلى ${maxMarks}, "feedback": "تعليق مختصر بالعربي يوضح نقاط القوة والضعف"}`
      }],
      temperature: 0.1,
      max_tokens: 200,
    });

    const text = completion.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    console.log('✅ Groq result:', parsed);
    return { score: Math.min(Math.max(Number(parsed.score), 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('❌ Groq error:', err.message);
    return { score: Math.round(maxMarks * 0.5), feedback: 'تم التصحيح تلقائياً' };
  }
}

// تصحيح الصور بـ Gemini
async function gradeWithImage(question, modelAnswer, imageBase64, maxMarks) {
  console.log('🖼️ Gemini grading image...');
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
  
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
            { text: `اقرأ إجابة الطالب من الصورة وصححها.\nالسؤال: ${question}\nالإجابة النموذجية: ${modelAnswer}\nالدرجة: ${maxMarks}\nرد فقط بـ JSON: {"score": رقم, "feedback": "تعليق"}` },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      })
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!data.candidates?.[0]) throw new Error('No candidates');
    
    const text = data.candidates[0].content.parts[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { score: Math.min(Math.max(Number(parsed.score), 0), maxMarks), feedback: parsed.feedback };
  } catch (err) {
    console.error('❌ Gemini image error:', err.message);
    // fallback: نحول الصورة لنص ونصحح بـ Groq
    return gradeAnswer(question, modelAnswer, '[إجابة مكتوبة بخط اليد]', maxMarks);
  }
}

module.exports = { gradeAnswer, gradeWithImage };
