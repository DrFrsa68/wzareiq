import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { examsAPI, sessionsAPI } from '../../services/api';
import { submitExam } from '../../services/examService';
import ImageUploader from '../../components/ImageUploader';

const API_URL = 'https://modest-trust-production-c992.up.railway.app/api';

export default function ExamScreen({ route, navigation }) {
  const { exam } = route.params;
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [images, setImages] = useState({});
  const [current, setCurrent] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [answerMode, setAnswerMode] = useState({});
  const timerRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => { initExam(); return () => clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (!loading) {
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
      const [sessionRes, questionsRes] = await Promise.all([
        sessionsAPI.start(exam.id),
        examsAPI.getQuestions(exam.id)
      ]);
      sessionIdRef.current = sessionRes.data.session_id;
      setSessionId(sessionRes.data.session_id);
      setQuestions(questionsRes.data);
    } catch (err) {
      Alert.alert('خطأ', 'تعذر بدء الامتحان');
      navigation.goBack();
    } finally { setLoading(false); }
  };

  const saveAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    try { await sessionsAPI.saveAnswer(sessionIdRef.current, { question_id: questionId, answer_text: text }); }
    catch (err) { console.log(err); }
  };

  const uploadImage = async (questionId, asset) => {
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
      }
    } catch (err) { Alert.alert('خطأ', 'تعذر رفع الصورة'); }
    finally { setUploadingImage(false); }
  };

  const removeImage = (questionId) => {
    setImages(prev => { const n = {...prev}; delete n[questionId]; return n; });
    setAnswers(prev => { const n = {...prev}; delete n[questionId]; return n; });
  };

  const doSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    const sid = sessionIdRef.current || sessionId;
    console.log('doSubmit called, sid:', sid);
    try {
      const data = await submitExam(sid);
      console.log('Submit success:', data?.total_score);
      navigation.navigate('Results', { result: data, session_id: sid });
    } catch (err) {
      console.log('Submit error:', err.message);
      Alert.alert('خطأ في التسليم', err.message);
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    Alert.alert('تسليم الامتحان', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسليم', onPress: doSubmit }
    ]);
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
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.loadingText}>جاري التصحيح...</Text>
      <Text style={styles.loadingSubText}>قد يستغرق دقيقة</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
  loadingSubText: { fontSize: 13, color: '#bbb' },
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
