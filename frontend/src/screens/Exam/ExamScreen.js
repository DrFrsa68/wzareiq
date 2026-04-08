import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { examsAPI, sessionsAPI } from '../../services/api';
import ImageUploader from '../../components/ImageUploader';
import Toast from '../../components/Toast';

const API_URL = 'https://modest-trust-production-c992.up.railway.app/api';

const SUBJECT_COLORS = {
  'الرياضيات': '#4F46E5', 'الفيزياء': '#0EA5E9', 'الكيمياء': '#10B981',
  'الأحياء': '#22C55E', 'اللغة العربية': '#F59E0B',
  'اللغة الإنجليزية': '#EF4444', 'الإسلامية': '#8B5CF6',
};

export default function ExamScreen({ route, navigation }) {
  const { exam } = route.params;
  const accentColor = SUBJECT_COLORS[exam.subject_name] || '#4F46E5';

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [images, setImages] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [answerMode, setAnswerMode] = useState({});
  const [toast, setToast] = useState(null);
  const sessionIdRef = useRef(null);
  const timerRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message, type = 'info') => setToast({ message, type, key: Date.now() });

  useEffect(() => { initExam(); return () => clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (!loading && !examResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); doSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const animateSlide = () => {
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
  };

  const initExam = async () => {
    try {
      const [sessionRes, questionsRes] = await Promise.all([
        sessionsAPI.start(exam.id),
        examsAPI.getQuestions(exam.id)
      ]);
      sessionIdRef.current = sessionRes.data.session_id;
      setQuestions(questionsRes.data);
    } catch (err) {
      showToast('تعذر بدء الامتحان', 'error');
      navigation.goBack();
    } finally { setLoading(false); }
  };

  const saveAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    if (sessionIdRef.current) {
      try { await sessionsAPI.saveAnswer(sessionIdRef.current, { question_id: questionId, answer_text: text }); }
      catch (err) { console.log(err); }
    }
  };

  const uploadImage = async (questionId, asset) => {
    if (!sessionIdRef.current) return showToast('الجلسة غير جاهزة', 'error');
    setUploadingImage(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      if (Platform.OS === 'web' && asset.file) {
        formData.append('image', asset.file);
      } else {
        formData.append('image', { uri: asset.uri, type: 'image/jpeg', name: 'answer.jpg' });
      }
      formData.append('question_id', questionId);
      const res = await fetch(`${API_URL}/sessions/${sessionIdRef.current}/answer-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (data.image_url) {
        setImages(prev => ({ ...prev, [questionId]: asset.uri }));
        setAnswers(prev => ({ ...prev, [questionId]: '[صورة مرفقة]' }));
        showToast('تم رفع الصورة ✅', 'success');
      }
    } catch (err) { showToast('تعذر رفع الصورة', 'error'); }
    finally { setUploadingImage(false); }
  };

  const removeImage = (questionId) => {
    setImages(prev => { const n = {...prev}; delete n[questionId]; return n; });
    setAnswers(prev => { const n = {...prev}; delete n[questionId]; return n; });
  };

  const doSubmit = async () => {
    const sid = sessionIdRef.current;
    if (!sid) return showToast('الجلسة غير موجودة', 'error');
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/sessions/${sid}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExamResult(data);
      setSubmitting(false);
    } catch (err) {
      showToast('تعذر تسليم الامتحان: ' + err.message, 'error');
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('هل أنت متأكد من تسليم الامتحان؟')) doSubmit();
    } else {
      doSubmit();
    }
  };

  const goNext = () => {
    setCurrent(c => c + 1);
    animateSlide();
  };

  const goPrev = () => {
    setCurrent(c => c - 1);
    animateSlide();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = questions.length > 0 ? (current + 1) / questions.length : 0;
  const answeredCount = Object.values(answers).filter(a => a?.trim()).length;
  const isLast = current === questions.length - 1;
  const q = questions[current];
  const mode = answerMode[q?.id] || 'text';
  const isWarning = timeLeft < 300;

  // Loading
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={accentColor} />
      <Text style={[styles.loadingText, { color: accentColor }]}>جاري تحميل الامتحان...</Text>
    </View>
  );

  // Submitting
  if (submitting) return (
    <View style={styles.center}>
      <View style={[styles.submitingIcon, { backgroundColor: accentColor + '15' }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
      <Text style={[styles.loadingText, { color: accentColor }]}>جاري التصحيح بالذكاء الاصطناعي...</Text>
      <Text style={styles.loadingSub}>قد يستغرق دقيقة</Text>
    </View>
  );

  // Results
  if (examResult) {
    const pct = Math.round((examResult.total_score / examResult.max_score) * 100);
    const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
    const label = pct >= 80 ? 'ممتاز 🎉' : pct >= 60 ? 'جيد 👍' : 'يحتاج مراجعة 📚';
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F6FA' }} showsVerticalScrollIndicator={false}>
        {/* Result Header */}
        <View style={[styles.resultHeader, { backgroundColor: color }]}>
          <View style={styles.resultCircle}>
            <Text style={styles.resultPct}>{pct}%</Text>
            <Text style={styles.resultLabel}>{label}</Text>
          </View>
          <Text style={styles.resultTitle}>{examResult.title}</Text>
          <Text style={styles.resultScore}>{examResult.total_score} / {examResult.max_score} درجة</Text>
        </View>

        {/* Actions */}
        <View style={styles.resultActions}>
          <TouchableOpacity style={[styles.resultBtn, { borderColor: accentColor }]}
            onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={18} color={accentColor} />
            <Text style={[styles.resultBtnText, { color: accentColor }]}>الرئيسية</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resultBtn, styles.resultBtnFill, { backgroundColor: accentColor }]}
            onPress={() => navigation.navigate('SubjectsList')}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={[styles.resultBtnText, { color: '#fff' }]}>امتحان جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Answers Review */}
        <Text style={styles.reviewTitle}>مراجعة الإجابات</Text>
        {(examResult.answers || []).map((ans, i) => {
          const s = ans.ai_score ?? ans.score ?? 0;
          const c = s/ans.marks >= 0.8 ? '#10B981' : s/ans.marks >= 0.6 ? '#F59E0B' : '#EF4444';
          return (
            <View key={i} style={styles.answerCard}>
              <View style={styles.answerCardHeader}>
                <View style={[styles.scoreTag, { backgroundColor: c + '20' }]}>
                  <Text style={[styles.scoreTagText, { color: c }]}>{s}/{ans.marks}</Text>
                </View>
                <Text style={styles.questionNum}>السؤال {i + 1}</Text>
              </View>
              <Text style={styles.questionTextReview}>{ans.question_text}</Text>
              <View style={styles.answerBox}>
                <Text style={styles.answerBoxLabel}>إجابتك</Text>
                <Text style={styles.answerBoxText}>{ans.student_answer || 'لم تجب'}</Text>
              </View>
              <View style={[styles.answerBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.answerBoxLabel, { color: '#10B981' }]}>الإجابة النموذجية</Text>
                <Text style={styles.answerBoxText}>{ans.model_answer}</Text>
              </View>
              {(ans.ai_feedback || ans.feedback) && (
                <View style={[styles.answerBox, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.answerBoxLabel, { color: accentColor }]}>تحليل الذكاء الاصطناعي</Text>
                  <Text style={styles.answerBoxText}>{ans.ai_feedback || ans.feedback}</Text>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      {/* Header */}
      <View style={[styles.header, { backgroundColor: accentColor }]}>
        <View style={styles.headerTop}>
          <View style={[styles.timerBadge, isWarning && styles.timerBadgeWarning]}>
            <Ionicons name="time-outline" size={14} color={isWarning ? '#EF4444' : '#fff'} />
            <Text style={[styles.timerText, isWarning && styles.timerTextWarning]}>{formatTime(timeLeft)}</Text>
          </View>
          <Text style={styles.examTitleHeader} numberOfLines={1}>{exam.title}</Text>
          <Text style={styles.examProgress}>{answeredCount}/{questions.length}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: 'rgba(255,255,255,0.9)' }]} />
        </View>

        {/* Question Dots */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dotsScroll}>
          <View style={styles.dots}>
            {questions.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => { setCurrent(i); animateSlide(); }}>
                <View style={[
                  styles.dot,
                  i === current && styles.dotActive,
                  answers[questions[i]?.id] && styles.dotAnswered,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={styles.questionMeta}>
            <Text style={[styles.questionMarks, { color: accentColor }]}>{q?.marks} درجة</Text>
            <View style={[styles.questionNumBadge, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.questionNumText, { color: accentColor }]}>سؤال {current + 1} من {questions.length}</Text>
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{q?.question_text}</Text>
          </View>

          {/* Answer Mode Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'text' && { backgroundColor: accentColor }]}
              onPress={() => setAnswerMode(prev => ({ ...prev, [q?.id]: 'text' }))}>
              <Ionicons name="create-outline" size={16} color={mode === 'text' ? '#fff' : '#888'} />
              <Text style={[styles.modeTabText, mode === 'text' && { color: '#fff' }]}>كتابة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'image' && { backgroundColor: accentColor }]}
              onPress={() => setAnswerMode(prev => ({ ...prev, [q?.id]: 'image' }))}>
              <Ionicons name="camera-outline" size={16} color={mode === 'image' ? '#fff' : '#888'} />
              <Text style={[styles.modeTabText, mode === 'image' && { color: '#fff' }]}>صورة</Text>
            </TouchableOpacity>
          </View>

          {mode === 'image' ? (
            <View>
              <ImageUploader imageUri={images[q?.id]}
                onImageSelected={(asset) => uploadImage(q?.id, asset)}
                onRemove={() => removeImage(q?.id)} />
              {uploadingImage && (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator size="small" color={accentColor} />
                  <Text style={[styles.uploadingText, { color: accentColor }]}>جاري رفع الصورة...</Text>
                </View>
              )}
            </View>
          ) : (
            <TextInput
              style={[styles.answerInput, { borderColor: accentColor + '40' }]}
              placeholder="اكتب إجابتك هنا..."
              placeholderTextColor="#bbb"
              multiline
              textAlign="right"
              value={answers[q?.id] || ''}
              onChangeText={(text) => saveAnswer(q?.id, text)}
            />
          )}
        </Animated.View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Navigation */}
      <View style={styles.nav}>
        {current > 0 ? (
          <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
            {/* تغيير من chevron-forward إلى chevron-back للRTL */}
            <Ionicons name="chevron-back" size={20} color="#555" />
            <Text style={styles.navBtnText}>السابق</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 90 }} />}

        {isLast ? (
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: accentColor }]} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>تسليم</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtnNext, { backgroundColor: accentColor }]} onPress={goNext}>
            <Text style={styles.navBtnNextText}>التالي</Text>
            {/* تغيير من chevron-back إلى chevron-forward للRTL */}
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#F5F6FA' },
  submitingIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  loadingText: { fontSize: 16, fontWeight: '700' },
  loadingSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  timerBadgeWarning: { backgroundColor: '#FEE2E2' },
  timerText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  timerTextWarning: { color: '#EF4444' },
  examTitleHeader: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center', marginHorizontal: 8 },
  examProgress: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 12 },
  progressFill: { height: 4, borderRadius: 2 },
  dotsScroll: { maxHeight: 28 },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff', width: 20 },
  dotAnswered: { backgroundColor: 'rgba(255,255,255,0.7)' },
  content: { flex: 1, padding: 16 },
  questionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionNumBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  questionNumText: { fontSize: 13, fontWeight: '700' },
  questionMarks: { fontSize: 13, fontWeight: '700' },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  questionText: { fontSize: 16, color: '#1E1B4B', textAlign: 'right', lineHeight: 28 },
  modeTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F3F4F6' },
  modeTabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  answerInput: { backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 15, color: '#1E1B4B', minHeight: 140, textAlignVertical: 'top', borderWidth: 2, outlineStyle: 'none', textAlign: 'right' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10 },
  uploadingText: { fontSize: 13, fontWeight: '600' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: '#555' },
  navBtnNext: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  navBtnNextText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  resultHeader: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20 },
  resultCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  resultPct: { fontSize: 38, fontWeight: '900', color: '#fff' },
  resultLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  resultTitle: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  resultScore: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  resultActions: { flexDirection: 'row', gap: 12, margin: 16 },
  resultBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, height: 48, borderWidth: 2 },
  resultBtnFill: { borderWidth: 0 },
  resultBtnText: { fontSize: 14, fontWeight: '700' },
  reviewTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', textAlign: 'right', marginHorizontal: 16, marginBottom: 12 },
  answerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  answerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNum: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  scoreTag: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreTagText: { fontSize: 13, fontWeight: '800' },
  questionTextReview: { fontSize: 14, color: '#1E1B4B', textAlign: 'right', lineHeight: 22, marginBottom: 12 },
  answerBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 },
  answerBoxLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'right', marginBottom: 4 },
  answerBoxText: { fontSize: 14, color: '#1E1B4B', textAlign: 'right', lineHeight: 20 },
});