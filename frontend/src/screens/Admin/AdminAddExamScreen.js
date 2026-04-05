import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subjectsAPI } from '../../services/api';
import api from '../../services/api';

const ROUNDS = [
  { label: 'الدور الأول', value: 'first' },
  { label: 'الدور الثاني', value: 'second' },
  { label: 'الدور الثالث', value: 'third' },
  { label: 'التمهيدي', value: 'preliminary' },
];

const EXAM_TYPES = [
  { label: 'وزاري شامل', value: 'comprehensive' },
  { label: 'حسب الفصول', value: 'chapter' },
];

export default function AdminAddExamScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [round, setRound] = useState('');
  const [examType, setExamType] = useState('comprehensive');
  const [duration, setDuration] = useState('60');
  const [questions, setQuestions] = useState([
    { question_number: 1, question_text: '', marks: '', model_answer: '' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    subjectsAPI.getAll().then(res => setSubjects(res.data));
  }, []);

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      question_number: prev.length + 1,
      question_text: '', marks: '', model_answer: ''
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return Alert.alert('تنبيه', 'يجب أن يكون هناك سؤال واحد على الأقل');
    setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, question_number: i + 1 })));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const handleSubmit = async () => {
    if (!subjectId || !title || !year || !round || !examType)
      return Alert.alert('تنبيه', 'أكمل جميع بيانات الامتحان');

    for (const q of questions) {
      if (!q.question_text || !q.marks || !q.model_answer)
        return Alert.alert('تنبيه', `السؤال ${q.question_number} غير مكتمل`);
    }

    setLoading(true);
    try {
      await api.post('/exams', {
        subject_id: subjectId,
        title,
        year: parseInt(year),
        round,
        exam_type: examType,
        duration: parseInt(duration),
        questions: questions.map(q => ({ ...q, marks: parseInt(q.marks) }))
      });
      Alert.alert('✅ تم', 'تم إضافة الامتحان بنجاح', [
        { text: 'حسناً', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || 'تعذر إضافة الامتحان');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.title}>إضافة امتحان جديد</Text>
      </View>

      {/* بيانات الامتحان */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>بيانات الامتحان</Text>

        <Text style={styles.label}>المادة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsRow}>
            {subjects.map(s => (
              <TouchableOpacity key={s.id}
                style={[styles.option, subjectId === s.id && styles.optionActive]}
                onPress={() => setSubjectId(s.id)}>
                <Text style={[styles.optionText, subjectId === s.id && styles.optionTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>نوع الامتحان</Text>
        <View style={styles.optionsRow}>
          {EXAM_TYPES.map(t => (
            <TouchableOpacity key={t.value}
              style={[styles.option, examType === t.value && styles.optionActive]}
              onPress={() => setExamType(t.value)}>
              <Text style={[styles.optionText, examType === t.value && styles.optionTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>عنوان الامتحان</Text>
        <TextInput style={styles.input} placeholder="مثال: امتحان الرياضيات الوزاري الشامل"
          placeholderTextColor="#aaa" value={title} onChangeText={setTitle} textAlign="right" />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>السنة</Text>
            <TextInput style={styles.input} placeholder="2024" placeholderTextColor="#aaa"
              value={year} onChangeText={setYear} keyboardType="numeric" textAlign="right" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>المدة (دقيقة)</Text>
            <TextInput style={styles.input} placeholder="60" placeholderTextColor="#aaa"
              value={duration} onChangeText={setDuration} keyboardType="numeric" textAlign="right" />
          </View>
        </View>

        <Text style={styles.label}>الدور</Text>
        <View style={styles.optionsRow}>
          {ROUNDS.map(r => (
            <TouchableOpacity key={r.value}
              style={[styles.option, round === r.value && styles.optionActive]}
              onPress={() => setRound(r.value)}>
              <Text style={[styles.optionText, round === r.value && styles.optionTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* الأسئلة */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>إضافة سؤال</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>الأسئلة ({questions.length})</Text>
        </View>

        {questions.map((q, index) => (
          <View key={index} style={styles.questionCard}>
            <View style={styles.questionCardHeader}>
              <TouchableOpacity onPress={() => removeQuestion(index)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
              <Text style={styles.questionNum}>السؤال {q.question_number}</Text>
            </View>

            <Text style={styles.label}>نص السؤال</Text>
            <TextInput style={[styles.input, styles.multiline]}
              placeholder="اكتب نص السؤال..." placeholderTextColor="#aaa"
              value={q.question_text} onChangeText={v => updateQuestion(index, 'question_text', v)}
              multiline textAlign="right" />

            <Text style={styles.label}>الدرجة</Text>
            <TextInput style={styles.input} placeholder="10" placeholderTextColor="#aaa"
              value={q.marks} onChangeText={v => updateQuestion(index, 'marks', v)}
              keyboardType="numeric" textAlign="right" />

            <Text style={styles.label}>الإجابة النموذجية</Text>
            <TextInput style={[styles.input, styles.multiline]}
              placeholder="اكتب الإجابة النموذجية..." placeholderTextColor="#aaa"
              value={q.model_answer} onChangeText={v => updateQuestion(index, 'model_answer', v)}
              multiline textAlign="right" />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.submitBtnText}>حفظ الامتحان</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  section: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 16 },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', textAlign: 'right', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F7', borderRadius: 12, padding: 12, fontSize: 14, color: '#1A1A2E', borderWidth: 1.5, borderColor: '#E5E7EB' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row-reverse', gap: 12 },
  halfInput: { flex: 1 },
  optionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  option: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F7', borderWidth: 1.5, borderColor: '#E5E7EB' },
  optionActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  optionText: { fontSize: 13, fontWeight: '600', color: '#555' },
  optionTextActive: { color: '#fff' },
  addBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  questionCard: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
  questionCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  questionNum: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  submitBtn: { backgroundColor: '#4F46E5', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
