-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المواد الدراسية
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الامتحانات
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  round VARCHAR(20) NOT NULL,
  exam_type VARCHAR(20) NOT NULL,
  chapter INTEGER,
  duration INTEGER DEFAULT 60,
  total_marks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الأسئلة
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL,
  model_answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول جلسات الامتحانات
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_progress',
  total_score DECIMAL(5,2) DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP
);

-- جدول إجابات الطلاب
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  ai_score DECIMAL(5,2) DEFAULT 0,
  ai_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
