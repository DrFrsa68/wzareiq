const rateLimit = require('express-rate-limit');

// حد تسجيل الدخول — 5 محاولات كل 15 دقيقة
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'محاولات كثيرة، انتظر 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

// حد التسجيل — 3 حسابات كل ساعة
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'تجاوزت الحد المسموح لإنشاء الحسابات' },
});

// حد عام للـ API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'طلبات كثيرة جداً' },
});

// حد تسليم الامتحانات
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'لا يمكن تسليم أكثر من 5 امتحانات في الدقيقة' },
});

module.exports = { loginLimiter, registerLimiter, apiLimiter, submitLimiter };
