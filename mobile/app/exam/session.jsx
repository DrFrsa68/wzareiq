import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';

export default function ExamSession() {
  const { examId } = useLocalSearchParams();
  const user = useAuthStore(s => s.user);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startSession();
    return () => clearInterval(timerRef.current);
  }, []);

  const startSession = async () => {
    try {
      const { data } = await api.post('/sessions/start', { examId });
      setSession(data);
      setQuestions(data.exam.questions);
      setSeconds(data.exam.duration * 60);
      setLoading(false);
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current); handleSubmitDirect(); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      window.alert('فشل بدء الامتحان');
      router.back();
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const saveAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    await api.put(`/sessions/${session.id}/answer`, { questionId, studentAnswer: text });
  };

  const handleSubmitDirect = async () => {
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await api.put(`/sessions/${session.id}/submit`);
      router.replace({ pathname: '/exam/result', params: { sessionId: session.id } });
    } catch (err) {
      window.alert('فشل التسليم، حاول مرة ثانية');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const confirm = window.confirm('هل تريد تسليم الامتحان؟');
    if (!confirm) return;
    handleSubmitDirect();
  };

  if (loading) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>جاري تحميل الامتحان...</Text>
    </View>
  );

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>{formatTime(seconds)}</Text>
        <Text style={styles.examTitle}>{session.exam.subject?.name}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.questionHeader}>
          <Text style={styles.marks}>{q.marks} درجة</Text>
          <Text style={styles.questionNum}>السؤال {current + 1} / {questions.length}</Text>
        </View>

        <Text style={styles.questionText}>{q.text}</Text>

        <TextInput
          style={styles.answerInput}
          multiline
          placeholder="اكتب إجابتك هنا..."
          textAlign="right"
          value={answers[q.id] || ''}
          onChangeText={text => saveAnswer(q.id, text)}
        />
      </ScrollView>

      <View style={styles.nav}>
        {current > 0 && (
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(c => c - 1)}>
            <Text style={styles.navBtnText}>السابق</Text>
          </TouchableOpacity>
        )}
        {current < questions.length - 1 ? (
          <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={() => setCurrent(c => c + 1)}>
            <Text style={styles.nextBtnText}>التالي</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtn, styles.submitBtn]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.nextBtnText}>{submitting ? 'جاري التسليم...' : 'تسليم الامتحان'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666' },
  header: { backgroundColor: '#1D52D8', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  examTitle: { fontSize: 16, color: '#a8bef5' },
  progressBar: { height: 4, backgroundColor: '#e0e0e0' },
  progressFill: { height: 4, backgroundColor: '#1D52D8' },
  body: { flex: 1, padding: 20 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  questionNum: { fontSize: 14, color: '#666' },
  marks: { fontSize: 14, color: '#1D52D8', fontWeight: 'bold' },
  questionText: { fontSize: 18, color: '#1a1a2e', textAlign: 'right', lineHeight: 28, marginBottom: 24 },
  answerInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 150, borderWidth: 1, borderColor: '#e0e0e0', textAlignVertical: 'top' },
  nav: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  navBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center' },
  nextBtn: { backgroundColor: '#1D52D8' },
  submitBtn: { backgroundColor: '#10B981' },
  navBtnText: { color: '#333', fontWeight: 'bold' },
  nextBtnText: { color: '#fff', fontWeight: 'bold' }
});