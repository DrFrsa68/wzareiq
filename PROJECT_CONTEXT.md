# مشروع وزاري (Wzareiq) — السياق الكامل

## ما هو المشروع؟
منصة امتحانات وزارية للسادس الإعدادي العراقي.
الطالب يختار المادة، السنة، الدور، ويجاوب الأسئلة، والذكاء الاصطناعي يصحح إجاباته.

---

## الـ Stack التقني

### Backend
- Node.js + Express
- PostgreSQL (على Railway)
- Cloudinary (رفع صور الإجابات)
- Groq API (تصحيح النصوص) — نموذج: llama-3.3-70b-versatile
- Gemini API (تصحيح الصور) — نموذج: gemini-2.0-flash
- JWT للمصادقة
- bcryptjs لتشفير كلمات المرور

### Frontend
- React Native + Expo (JavaScript — مو TypeScript)
- React Navigation (Stack + Bottom Tabs)
- Axios للـ API calls
- AsyncStorage لحفظ التوكن
- expo-image-picker لرفع الصور

### Hosting
- Backend: Railway → https://modest-trust-production-c992.up.railway.app
- Database: PostgreSQL على Railway
- Frontend: Expo Web (يشتغل على Codespaces)
- Repository: https://github.com/DrFrsa68/wzareiq

---

## هيكل المشروع
wzareiq/
├── backend/
│   ├── src/
│   │   ├── index.js              # السيرفر الرئيسي
│   │   ├── db/
│   │   │   ├── connect.js        # اتصال PostgreSQL
│   │   │   └── schema.sql        # جداول قاعدة البيانات
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js           # تسجيل دخول/تسجيل
│   │   │   ├── subjects.js       # المواد الدراسية
│   │   │   ├── exams.js          # الامتحانات والأسئلة
│   │   │   ├── sessions.js       # جلسات الامتحان + تصحيح AI
│   │   │   └── admin.js          # لوحة الإدارة
│   │   └── services/
│   │       ├── ai.js             # Groq + Gemini
│   │       └── cloudinary.js     # رفع الصور
│   └── package.json
└── frontend/
├── App.js
└── src/
├── context/
│   └── AuthContext.js    # إدارة المصادقة
├── navigation/
│   └── AppNavigator.js   # Stack + Tab navigation
├── services/
│   ├── api.js            # Axios instance + كل الـ API calls
│   └── examService.js    # submit exam
├── components/
│   ├── Toast.js          # رسائل تنبيه
│   └── ImageUploader.js  # رفع الصور (web compatible)
└── screens/
├── Auth/
│   ├── LoginScreen.js
│   └── RegisterScreen.js
├── Home/
│   └── HomeScreen.js
├── Subjects/
│   ├── SubjectsScreen.js
│   └── ExamSearchScreen.js
├── Exam/
│   └── ExamScreen.js
├── Results/
│   └── ResultsScreen.js
├── History/
│   └── HistoryScreen.js
├── Profile/
│   └── ProfileScreen.js
└── Admin/
├── AdminScreen.js
└── AdminAddExamScreen.js
---

## قاعدة البيانات — الجداول

```sql
users (id UUID, name, username, password, avatar, role, created_at)
subjects (id UUID, name, icon, color, created_at)
exams (id UUID, subject_id, title, year, round, exam_type, chapter, duration, total_marks, created_at)
questions (id UUID, exam_id, question_number, question_text, marks, model_answer, created_at)
exam_sessions (id UUID, student_id, exam_id, status, total_score, max_score, started_at, submitted_at)
student_answers (id UUID, session_id, question_id, answer_text, answer_image_url, ai_score, ai_feedback, created_at)
المتغيرات البيئية على Railway
DATABASE_URL=postgresql://postgres:...@junction.proxy.rlwy.net:44729/railway
JWT_SECRET=wzareiq_super_secret_key_2024_!@#
PORT=3000
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
CLOUDINARY_CLOUD_NAME=dnjfw1mzp
CLOUDINARY_API_KEY=647685546819365
CLOUDINARY_API_SECRET=ZWG_...
الـ API Endpoints
Auth
POST /api/auth/register
POST /api/auth/login
Subjects
GET /api/subjects
POST /api/subjects (admin)
DELETE /api/subjects/:id (admin)
Exams
GET /api/exams/years?subject_id=&exam_type=
GET /api/exams/rounds?subject_id=&exam_type=&year=
GET /api/exams/search?subject_id=&exam_type=&year=&round=
GET /api/exams/:id/questions
POST /api/exams (admin)
DELETE /api/exams/:id (admin)
Sessions
POST /api/sessions/start
POST /api/sessions/:id/answer
POST /api/sessions/:id/answer-image
POST /api/sessions/:id/submit
GET /api/sessions/history
GET /api/sessions/:id
Admin
GET /api/admin/stats
GET /api/admin/students
DELETE /api/admin/students/:id
GET /api/admin/exams
PATCH /api/admin/students/:id/make-admin
نظام التصحيح بالذكاء الاصطناعي
الطالب يسلم الامتحان → POST /api/sessions/:id/submit
لكل سؤال:
إجابة نصية → Groq (llama-3.3-70b-versatile)
إجابة صورة → تحميل الصورة من Cloudinary → Groq Vision (meta-llama/llama-4-scout-17b-16e-instruct)
الدرجة والـ feedback يحفظون في student_answers
total_score يتحدث في exam_sessions
النتيجة ترجع فوراً للطالب
المواد الدراسية (7 مواد)
المادة
اللون
الأيقونة
الرياضيات
#4F46E5
calculator
الفيزياء
#0EA5E9
planet
الكيمياء
#10B981
flask
الأحياء
#22C55E
leaf
اللغة العربية
#F59E0B
language
اللغة الإنجليزية
#EF4444
globe
الإسلامية
#8B5CF6
moon
أنواع الامتحانات
comprehensive = وزاري شامل (كل الفصول)
chapter = حسب الفصول
الأدوار
first = الدور الأول
second = الدور الثاني
third = الدور الثالث
preliminary = التمهيدي
الألوان الرئيسية (Design System)
Primary: #4F46E5 (بنفسجي)
Success: #10B981 (أخضر)
Warning: #F59E0B (برتقالي)
Danger: #EF4444 (أحمر)
Background: #F5F6FA
Card: #ffffff
Text Primary: #1E1B4B
Text Secondary: #9CA3AF
الصفحات المنجزة والحالة
الصفحة
الحالة
ملاحظات
Login
✅ مكتمل
تصميم جديد + animations
Register
✅ مكتمل
password strength indicator
Home
✅ مكتمل
header بنفسجي + إحصائيات
Subjects
✅ مكتمل
grid بألوان المواد
ExamSearch
✅ مكتمل
3 خطوات + نتائج
Exam
✅ مكتمل
نص + صور + مؤقت
Results
✅ مكتمل
درجات + AI feedback
History
✅ مكتمل
قائمة الامتحانات السابقة
Profile
✅ مكتمل
تسجيل خروج
Admin
✅ مكتمل
إضافة امتحانات
أوامر مهمة
# تشغيل Frontend
cd /workspaces/wzareiq/frontend && npx expo start --web --clear

# تشغيل Backend محلياً
cd /workspaces/wzareiq/backend && npm run dev

# رفع على GitHub
cd /workspaces/wzareiq && git add . && git commit -m "..." && git push

# اختبار Groq
cd /workspaces/wzareiq/backend && node -e "
require('dotenv').config();
const { gradeAnswer } = require('./src/services/ai');
gradeAnswer('سؤال', 'جواب نموذجي', 'جواب الطالب', 10)
  .then(r => console.log(r));
"

# إضافة مادة
cd /workspaces/wzareiq/backend && node -e "
require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// أضف الكود هنا
"
مشاكل معروفة وحلولها
المشكلة
الحل
Gemini يستنفذ الحصة المجانية
صنع API Key جديد من مشروع Google جديد
GitHub يمنع push بسبب secrets
اضغط "Allow" من رابط الـ security alert
Alert لا يظهر على الويب
استخدم window.confirm() بدلاً منه
الـ .env لا يُرفع على GitHub
هذا مقصود للأمان — أضف الـ variables على Railway
ما تبقى للعمل
تحسين صفحة النتائج (Results)
تحسين صفحة السجل (History)
تحسين الملف الشخصي (Profile)
تطوير لوحة الإدارة (Admin)
رفع الأسئلة الوزارية الحقيقية
بناء APK للـ Android
معلومات المطور
الاسم: سجاد
GitHub: DrFrsa68
البيئة: GitHub Codespaces + Android tablet
الجمهور المستهدف: طلاب السادس الإعدادي العراقي
