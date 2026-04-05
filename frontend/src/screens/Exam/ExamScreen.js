import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { examsAPI, sessionsAPI } from '../../services/api';
import ImageUploader from '../../components/ImageUploader';
import Toast from '../../components/Toast';

const API_URL = 'https://modest-trust-production-c992.up.railway.app/api';

export default function ExamScreen({ route, navigation }) {
  const { exam } = route.params;
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

  const initExam = async () => {
    try {
      showToast('جاري تحميل الامتحان...', 'info');
      const [sessionRes, questionsRes] = await Promise.all([
        sessionsAPI.start(exam.id),
        examsAPI.getQuestions(exam.id)
      ]);
      sessionIdRef.current = sessionRes.data.session_id;
      setQuestions(questionsRes.data);
      showToast('تم تحميل الامتحان ✅', 'success');
    } catch (err) {
      showToast('خطأ: ' + err.message, 'error');
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
    } catch (err) { showToast('خطأ رفع الصورة: ' + err.message, 'error'); }
    finally { setUploadingImage(false); }
  };

  const removeImage = (questionId) => {
    setImages(prev => { const n = {...prev}; delete n[questionId]; return n; });
    setAnswers(prev => { const n = {...prev}; delete n[questionId]; return n; });
  };

  const doSubmit = async () => {
    const sid = sessionIdRef.current;
    showToast(`session: ${sid ? sid.slice(0,8) + '...' : 'فارغ!'}`, sid ? 'info' : 'error');
    if (!sid) return;

    clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      showToast('يتصل بالسيرفر...', 'info');

      const res = await fetch(`${API_URL}/sessions/${sid}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      showToast(`Status: ${res.status}`, res.ok ? 'success' : 'error');
      const text = await res.text();
      const data = JSON.parse(text);
      showToast('تم التسليم! جاري عرض النتيجة...', 'success');
      setTimeout(() => setExamResult(data), 1500);
    } catch (err) {
      showToast('خطأ: ' + err.message, 'error');
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    showToast('جاري التسليم...', 'info');
    doSubmit();
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

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>جاري تحميل الامتحان...</Text>
    </View>
  );

  if (submitting) return (
    <View style={styles.center}>
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.loadingText}>جاري التسليم...</Text>
    </View>
  );

  if (examResult) {
    const pct = Math.round((examResult.total_score / examResult.max_score) * 100);
    const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
        <View style={{ backgroundColor: color, paddingTop: 60, paddingBottom: 32, alignItems: 'center' }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff' }}>{pct}%</Text>
            <Text style={{ fontSize: 14, color: '#fff' }}>{pct >= 80 ? 'ممتاز' : pct >= 60 ? 'جيد' : 'يحتاج مراجعة'}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center', paddingHorizontal: 20 }}>{examResult.title}</Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>{examResult.total_score} / {examResult.max_score} درجة</Text>
          {examResult.grading && <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8, fontSize: 13 }}>⏳ جاري التصحيح النهائي...</Text>}
        </View>
        <View style={{ flexDirection: 'row-reverse', gap: 12, margin: 20 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => navigation.navigate('Home')}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#4F46E5' }}>الرئيسية</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => navigation.navigate('SubjectsList')}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981' }}>امتحان جديد</Text>
          </TouchableOpacity>
        </View>
        {(examResult.answers || []).map((ans, i) => {
          const s = ans.ai_score ?? ans.score ?? 0;
          const c = s/ans.marks >= 0.8 ? '#10B981' : s/ans.marks >= 0.6 ? '#F59E0B' : '#EF4444';
          return (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', color: '#1A1A2E' }}>السؤال {i+1}</Text>
                <Text style={{ color: c, fontWeight: '700' }}>{s}/{ans.marks}</Text>
              </View>
              <Text style={{ color: '#1A1A2E', textAlign: 'right', marginBottom: 8 }}>{ans.question_text}</Text>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 6 }}>
                <Text style={{ color: '#888', textAlign: 'right', fontSize: 12 }}>إجابتك:</Text>
                <Text style={{ color: '#1A1A2E', textAlign: 'right' }}>{ans.student_answer || 'لم تجب'}</Text>
              </View>
              <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 10 }}>
                <Text style={{ color: '#10B981', textAlign: 'right', fontSize: 12 }}>الإجابة النموذجية:</Text>
                <Text style={{ color: '#1A1A2E', textAlign: 'right' }}>{ans.model_answer}</Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
      <View style={styles.header}>
        <View style={[styles.timer, timeLeft < 300 && styles.timerWarning]}>
          <Ionicons name="time-outline" size={16} color={timeLeft < 300 ? '#EF4444' : '#4F46E5'} />
          <Text style={[styles.timerText, timeLeft < 300 && styles.timerTextWarning]}>{formatTime(timeLeft)}</Text>
        </View>
        <Text style={styles.examTitle} numberOfLines={1}>{exam.title}</Text>
        <Text style={styles.progress}>{answeredCount}/{questions.length}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionHeader}>
          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>سؤال {current + 1}</Text>
          </View>
          <Text style={styles.marks}>{q?.marks} درجة</Text>
        </View>
        <Text style={styles.questionText}>{q?.question_text}</Text>
        <View style={styles.modeTabs}>
          <TouchableOpacity style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
            onPress={() => setAnswerMode(prev => ({ ...prev, [q?.id]: 'text' }))}>
            <Ionicons name="create-outline" size={18} color={mode === 'text' ? '#fff' : '#888'} />
            <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>كتابة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, mode === 'image' && styles.modeTabActive]}
            onPress={() => setAnswerMode(prev => ({ ...prev, [q?.id]: 'image' }))}>
            <Ionicons name="camera-outline" size={18} color={mode === 'image' ? '#fff' : '#888'} />
            <Text style={[styles.modeTabText, mode === 'image' && styles.modeTabTextActive]}>صورة</Text>
          </TouchableOpacity>
        </View>
        {mode === 'image' ? (
          <View>
            <ImageUploader imageUri={images[q?.id]}
              onImageSelected={(asset) => uploadImage(q?.id, asset)}
              onRemove={() => removeImage(q?.id)} />
            {uploadingImage && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.uploadingText}>جاري رفع الصورة...</Text>
              </View>
            )}
          </View>
        ) : (
          <TextInput style={styles.answerInput} placeholder="اكتب إجابتك هنا..."
            placeholderTextColor="#aaa" multiline textAlign="right"
            value={answers[q?.id] || ''} onChangeText={(text) => saveAnswer(q?.id, text)} />
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
      <View style={styles.nav}>
        {current > 0 ? (
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(c => c - 1)}>
            <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
            <Text style={styles.navBtnText}>السابق</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 100 }} />}
        {isLast ? (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>تسليم</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(c => c + 1)}>
            <Text style={styles.navBtnText}>التالي</Text>
            <Ionicons name="chevron-back" size={20} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: '#888', marginTop: 12 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F46E520', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  timerWarning: { backgroundColor: '#FEE2E2' },
  timerText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  timerTextWarning: { color: '#EF4444' },
  examTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A2E', textAlign: 'center', marginHorizontal: 8 },
  progress: { fontSize: 13, color: '#888', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB' },
  progressFill: { height: 4, backgroundColor: '#4F46E5', borderRadius: 2 },
  content: { flex: 1, padding: 20 },
  questionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  questionBadge: { backgroundColor: '#4F46E520', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  questionBadgeText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  marks: { fontSize: 13, color: '#888', fontWeight: '600' },
  questionText: { fontSize: 17, color: '#1A1A2E', textAlign: 'right', lineHeight: 28, marginBottom: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modeTabs: { flexDirection: 'row-reverse', gap: 10, marginBottom: 14 },
  modeTab: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: 'transparent' },
  modeTabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  modeTabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  modeTabTextActive: { color: '#fff' },
  answerInput: { backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 15, color: '#1A1A2E', minHeight: 140, textAlignVertical: 'top', borderWidth: 2, borderColor: '#E5E7EB' },
  uploadingBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12 },
  uploadingText: { fontSize: 14, color: '#4F46E5' },
  nav: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  navBtnText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  submitBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
