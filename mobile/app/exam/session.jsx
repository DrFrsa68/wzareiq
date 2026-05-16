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
        'هل أنت متأكد من تسليم الامتحان؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسليم', style: 'destructive', onPress: handleSubmitDirect }
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
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (seconds <= 300) return '#EF4444';
    if (seconds <= 600) return '#F59E0B';
    return colors.white;
  };

  const saveAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    await api.put(`/sessions/${session.id}/answer`, { questionId, studentAnswer: text });
  };

  if (loading) return (
    <View style={styles.loading}>
      <View style={styles.loadingInner}>
        <Text style={styles.loadingTitle}>صواب</Text>
        <Text style={styles.loadingText}>جاري تحميل الامتحان...</Text>
      </View>
    </View>
  );

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.timer, { color: getTimerColor(), fontSize: isTablet ? 24 : 18 }]}>
          {formatTime(seconds)}
        </Text>
        <View style={styles.headerCenter}>
          <Text style={styles.examTitle}>{session.exam.subject?.name}</Text>
          <Text style={styles.examSubtitle}>{answeredCount}/{questions.length} إجابة</Text>
        </View>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>{current + 1}/{questions.length}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Question dots */}
      <View style={styles.dotsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dots}>
          {questions.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrent(i)}>
              <View style={[
                styles.dot,
                i === current && styles.dotActive,
                answers[questions[i].id]?.trim() && styles.dotAnswered
              ]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Question */}
      <ScrollView style={styles.body} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={[styles.questionContainer, { maxWidth, width: '100%' }]}>
          <View style={styles.questionHeader}>
            <View style={styles.marksBadge}>
              <Text style={styles.marksText}>{q.marks} درجة</Text>
            </View>
            <Text style={styles.questionNum}>السؤال {current + 1}</Text>
          </View>

          <View style={styles.questionCard}>
            <Text style={[styles.questionText, { fontSize: isTablet ? 20 : 17 }]}>{q.text}</Text>
          </View>

          <Text style={styles.answerLabel}>إجابتك:</Text>
          <TextInput
            style={[styles.answerInput, { minHeight: isTablet ? 200 : 140, fontSize: isTablet ? 17 : 15 }]}
            multiline
            placeholder="اكتب إجابتك هنا..."
            textAlign="right"
            value={answers[q.id] || ''}
            onChangeText={text => saveAnswer(q.id, text)}
            placeholderTextColor={colors.textMuted}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.nav, { paddingHorizontal: isTablet ? 48 : 16 }]}>
        <View style={[styles.navInner, { maxWidth, width: '100%', alignSelf: 'center' }]}>
          {current > 0 ? (
            <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(c => c - 1)}>
              <Text style={styles.navBtnText}>→ السابق</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}

          {current < questions.length - 1 ? (
            <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={() => setCurrent(c => c + 1)}>
              <Text style={styles.nextBtnText}>التالي ←</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navBtn, styles.submitBtn]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.nextBtnText}>{submitting ? 'جاري التسليم...' : '✓ تسليم الامتحان'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  loadingInner: { alignItems: 'center' },
  loadingTitle: { fontSize: 36, fontFamily: fonts.bold, color: colors.white, marginBottom: 12 },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timer: { fontFamily: fonts.bold, minWidth: 70 },
  headerCenter: { flex: 1, alignItems: 'center' },
  examTitle: { fontSize: 15, color: colors.white, fontFamily: fonts.bold },
  examSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.regular, marginTop: 2 },
  questionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, minWidth: 70, alignItems: 'center' },
  questionBadgeText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', backgroundColor: colors.border },
  progressFill: { height: 3, backgroundColor: colors.primary },
  dotsContainer: { backgroundColor: colors.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  dots: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24, borderRadius: 5 },
  dotAnswered: { backgroundColor: colors.success },
  body: { flex: 1 },
  questionContainer: { padding: 16, alignSelf: 'center' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  questionNum: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular },
  marksBadge: { backgroundColor: colors.primary + '15', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  marksText: { fontSize: 13, color: colors.primary, fontFamily: fonts.bold },
  questionCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  questionText: { color: colors.text, textAlign: 'right', lineHeight: 30, fontFamily: fonts.regular },
  answerLabel: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, textAlign: 'right', marginBottom: 8 },
  answerInput: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, fontFamily: fonts.regular },
  nav: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, padding: 12, paddingBottom: 24 },
  navInner: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center' },
  nextBtn: { backgroundColor: colors.primary },
  submitBtn: { backgroundColor: colors.success },
  navBtnText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  nextBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 }
});