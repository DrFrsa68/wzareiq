import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function ExamSession() {
  const { examId } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const maxWidth = isTablet ? 700 : '100%';

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const sessionRef = useRef(null);

  const handleSubmitDirect = useCallback(async () => {
    if (!sessionRef.current) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await api.put(`/sessions/${sessionRef.current.id}/submit`);
      router.replace({ pathname: '/exam/result', params: { sessionId: sessionRef.current.id } });
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('فشل التسليم، حاول مرة ثانية');
      } else {
        Alert.alert('خطأ', 'فشل التسليم، حاول مرة ثانية');
      }
      setSubmitting(false);
    }
  }, []);

  const handleSubmit = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('هل تريد تسليم الامتحان؟');
      if (!confirm) return;
      handleSubmitDirect();
    } else {
      Alert.alert(
        'تسليم الامتحان',
        'هل أنت متأكد؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسليم', onPress: handleSubmitDirect }
        ]
      );
    }
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        const { data } = await api.post('/sessions/start', { examId });
        sessionRef.current = data;
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
        if (Platform.OS === 'web') {
          window.alert('فشل بدء الامتحان');
        } else {
          Alert.alert('خطأ', 'فشل بدء الامتحان');
        }
        router.back();
      }
    };

    startSession();
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const saveAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    await api.put(`/sessions/${session.id}/answer`, { questionId, studentAnswer: text });
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
        <Text style={[styles.timer, { fontSize: isTablet ? 26 : 20 }]}>{formatTime(seconds)}</Text>
        <Text style={styles.examTitle}>{session.exam.subject?.name}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={[styles.questionContainer, { maxWidth, width: '100%' }]}>
          <View style={styles.questionHeader}>
            <Text style={styles.marks}>{q.marks} درجة</Text>
            <Text style={styles.questionNum}>السؤال {current + 1} / {questions.length}</Text>
          </View>

          <Text style={[styles.questionText, { fontSize: isTablet ? 22 : 18 }]}>{q.text}</Text>

          <TextInput
            style={[styles.answerInput, { minHeight: isTablet ? 200 : 150, fontSize: isTablet ? 18 : 16 }]}
            multiline
            placeholder="اكتب إجابتك هنا..."
            textAlign="right"
            value={answers[q.id] || ''}
            onChangeText={text => saveAnswer(q.id, text)}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </ScrollView>

      <View style={[styles.nav, { paddingHorizontal: isTablet ? 48 : 16 }]}>
        <View style={[styles.navInner, { maxWidth, width: '100%', alignSelf: 'center' }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { fontSize: 18, color: colors.textSecondary, fontFamily: fonts.regular },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { fontFamily: fonts.bold, color: colors.white },
  examTitle: { fontSize: 16, color: colors.primaryLight, fontFamily: fonts.regular },
  progressBar: { height: 4, backgroundColor: colors.border },
  progressFill: { height: 4, backgroundColor: colors.primary },
  body: { flex: 1 },
  questionContainer: { padding: 20, alignSelf: 'center' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  questionNum: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.regular },
  marks: { fontSize: 14, color: colors.primary, fontFamily: fonts.bold },
  questionText: { color: colors.text, textAlign: 'right', lineHeight: 32, marginBottom: 24, fontFamily: fonts.regular },
  answerInput: { backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top', fontFamily: fonts.regular },
  nav: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, padding: 16 },
  navInner: { flexDirection: 'row', gap: 12 },
  navBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center' },
  nextBtn: { backgroundColor: colors.primary },
  submitBtn: { backgroundColor: colors.success },
  navBtnText: { color: colors.text, fontFamily: fonts.bold },
  nextBtnText: { color: colors.white, fontFamily: fonts.bold }
});


