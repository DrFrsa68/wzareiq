import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { examsAPI, sessionsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const timerRef = useRef(null);

  useEffect(() => {
    initExam();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, sessionId]);

  const initExam = async () => {
    try {
      const [sessionRes, questionsRes] = await Promise.all([
        sessionsAPI.start(exam.id),
        examsAPI.getQuestions(exam.id)
      ]);
      setSessionId(sessionRes.data.session_id);
      setQuestions(questionsRes.data);
    } catch (err) {
      Alert.alert('خطأ', 'تعذر بدء الامتحان');
      navigation.goBack();
    } finally { setLoading(false); }
  };

  const saveAnswer = async (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    if (sessionId) {
      try {
        await sessionsAPI.saveAnswer(sessionId, { question_id: questionId, answer_text: text });
      } catch (err) { console.log(err); }
    }
  };

  const pickImage = async (questionId) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('تنبيه', 'نحتاج إذن للوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled) {
      uploadImage(questionId, result.assets[0]);
    }
  };

  const takePhoto = async (questionId) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('تنبيه', 'نحتاج إذن للكاميرا');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      uploadImage(questionId, result.assets[0]);
    }
  };

  const uploadImage = async (questionId, asset) => {
    setUploadingImage(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'answer.jpg',
      });
      formData.append('question_id', questionId);

      const res = await fetch(`${API_URL}/sessions/${sessionId}/answer-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.image_url) {
        setImages(prev => ({ ...prev, [questionId]: asset.uri }));
        setAnswers(prev => ({ ...prev, [questionId]: '[صورة مرفقة]' }));
        Alert.alert('✅', 'تم رفع الصورة بنجاح');
      }
    } catch (err) {
      Alert.alert('خطأ', 'تعذر رفع الصورة');
    } finally { setUploadingImage(false); }
  };

  const showImageOptions = (questionId) => {
    Alert.alert('رفع صورة الجواب', 'اختر طريقة الرفع', [
      { text: 'الكاميرا', onPress: () => takePhoto(questionId) },
      { text: 'من المعرض', onPress: () => pickImage(questionId) },
      { text: 'إلغاء', style: 'cancel' }
    ]);
  };

  const handleSubmit = async (auto = false) => {
    if (!auto) {
      Alert.alert('تسليم الامتحان', 'هل أنت متأكد من التسليم؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسليم', onPress: () => submitExam() }
      ]);
    } else { submitExam(); }
  };

  const submitExam = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await sessionsAPI.submit(sessionId);
      navigation.replace('Results', { result: res.data, session_id: sessionId });
    } catch (err) {
      Alert.alert('خطأ', 'تعذر تسليم الامتحان');
    } finally { setSubmitting(false); }
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

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>جاري تحميل الامتحان...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.timer, timeLeft < 300 && styles.timerWarning]}>
          <Ionicons name="time-outline" size={16} color={timeLeft < 300 ? '#EF4444' : '#4F46E5'} />
          <Text style={[styles.timerText, timeLeft < 300 && styles.timerTextWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <Text style={styles.examTitle} numberOfLines={1}>{exam.title}</Text>
        <Text style={styles.progress}>{answeredCount}/{questions.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionHeader}>
          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>سؤال {current + 1}</Text>
          </View>
          <Text style={styles.marks}>{q?.marks} درجة</Text>
        </View>

        <Text style={styles.questionText}>{q?.question_text}</Text>

        {/* Answer Options */}
        <View style={styles.answerOptions}>
          <Text style={styles.answerLabel}>طريقة الإجابة:</Text>
          <View style={styles.answerTabs}>
            <TouchableOpacity
              style={[styles.tab, !images[q?.id] && styles.tabActive]}
              onPress={() => setImages(prev => { const n = {...prev}; delete n[q?.id]; return n; })}>
              <Ionicons name="create-outline" size={18} color={!images[q?.id] ? '#fff' : '#888'} />
              <Text style={[styles.tabText, !images[q?.id] && styles.tabTextActive]}>كتابة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, images[q?.id] && styles.tabActive]}
              onPress={() => showImageOptions(q?.id)}>
              <Ionicons name="camera-outline" size={18} color={images[q?.id] ? '#fff' : '#888'} />
              <Text style={[styles.tabText, images[q?.id] && styles.tabTextActive]}>صورة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        {images[q?.id] ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: images[q?.id] }} style={styles.answerImage} resizeMode="contain" />
            <TouchableOpacity style={styles.changeImageBtn} onPress={() => showImageOptions(q?.id)}>
              <Ionicons name="refresh-outline" size={16} color="#4F46E5" />
              <Text style={styles.changeImageText}>تغيير الصورة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeImageBtn}
              onPress={() => setImages(prev => { const n = {...prev}; delete n[q?.id]; return n; })}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={styles.answerInput}
            placeholder="اكتب إجابتك هنا..."
            placeholderTextColor="#aaa"
            multiline
            textAlign="right"
            value={answers[q?.id] || ''}
            onChangeText={(text) => saveAnswer(q?.id, text)}
          />
        )}

        {uploadingImage && (
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.uploadingText}>جاري رفع الصورة...</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Navigation */}
      <View style={styles.nav}>
        {current > 0 ? (
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(c => c - 1)}>
            <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
            <Text style={styles.navBtnText}>السابق</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 100 }} />}

        {isLast ? (
          <TouchableOpacity style={styles.submitBtn} onPress={() => handleSubmit(false)} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={styles.submitBtnText}>تسليم</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>
            }
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
  loadingText: { fontSize: 16, color: '#888' },
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
  answerOptions: { marginBottom: 12 },
  answerLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginBottom: 10 },
  answerTabs: { flexDirection: 'row-reverse', gap: 10 },
  tab: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: 'transparent' },
  tabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },
  answerInput: { backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 15, color: '#1A1A2E', minHeight: 140, textAlignVertical: 'top', borderWidth: 2, borderColor: '#E5E7EB' },
  imageContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: '#4F46E5' },
  answerImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 10 },
  changeImageBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  changeImageText: { color: '#4F46E5', fontSize: 14, fontWeight: '600' },
  removeImageBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: '#FEE2E2', borderRadius: 20, padding: 6 },
  uploadingBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12 },
  uploadingText: { fontSize: 14, color: '#4F46E5' },
  nav: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  navBtnText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  submitBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
