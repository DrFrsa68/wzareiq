import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function AdminUploadScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const csv = `subject_name,exam_type,year,round,duration,q_number,q_text,marks,model_answer
الإسلامية,comprehensive,2024,first,60,1,عرّف الإيمان لغةً واصطلاحاً,10,الإيمان لغةً التصديق واصطلاحاً هو...
الإسلامية,comprehensive,2024,first,60,2,اذكر أركان الإسلام الخمسة,10,الشهادتان والصلاة والزكاة والصوم والحج`;

    if (typeof window !== 'undefined') {
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wzareiq_template.csv';
      a.click();
    }
  };

  const pickFile = () => {
    if (typeof window !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFile(file);
      };
      input.click();
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setResult(null);
    setError('');
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]?.trim());
        return obj;
      });

      // تجميع الأسئلة حسب الامتحان
      const examsMap = {};
      rows.forEach(row => {
        const key = `${row.subject_name}|${row.exam_type}|${row.year}|${row.round}`;
        if (!examsMap[key]) {
          examsMap[key] = {
            subject_name: row.subject_name,
            exam_type: row.exam_type,
            year: parseInt(row.year),
            round: row.round,
            duration: parseInt(row.duration) || 60,
            questions: []
          };
        }
        examsMap[key].questions.push({
          question_number: parseInt(row.q_number),
          question_text: row.q_text,
          marks: parseInt(row.marks),
          model_answer: row.model_answer
        });
      });

      // جلب المواد
      const subjectsRes = await api.get('/subjects');
      const subjects = subjectsRes.data;

      let success = 0, failed = 0;
      const errors = [];

      for (const key of Object.keys(examsMap)) {
        const examData = examsMap[key];
        const subject = subjects.find(s => s.name === examData.subject_name);
        if (!subject) {
          failed++;
          errors.push(`مادة غير موجودة: ${examData.subject_name}`);
          continue;
        }

        const title = `امتحان ${examData.subject_name} الوزاري - ${examData.year} - ${examData.round}`;
        const totalMarks = examData.questions.reduce((s, q) => s + q.marks, 0);

        try {
          await api.post('/exams', {
            subject_id: subject.id,
            title,
            year: examData.year,
            round: examData.round,
            exam_type: examData.exam_type,
            duration: examData.duration,
            questions: examData.questions
          });
          success++;
        } catch (err) {
          failed++;
          errors.push(`فشل رفع: ${title}`);
        }
      }

      setResult({ success, failed, errors, total: Object.keys(examsMap).length });
    } catch (err) {
      setError('خطأ في قراءة الملف: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>رفع Excel/CSV</Text>
            <Text style={styles.subtitle}>رفع الامتحانات بالجملة</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={22} color="#4F46E5" />
            <Text style={styles.cardTitle}>تعليمات الرفع</Text>
          </View>
          <View style={styles.steps}>
            {[
              'حمّل الـ template أدناه',
              'عبّئ الأسئلة والإجابات بنفس الترتيب',
              'تأكد من أسماء المواد مطابقة تماماً',
              'ارفع الملف',
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepText}>{step}</Text>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Subjects List */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={22} color="#10B981" />
            <Text style={styles.cardTitle}>أسماء المواد المقبولة</Text>
          </View>
          {['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية', 'اللغة الإنجليزية', 'الإسلامية'].map((s, i) => (
            <View key={i} style={styles.subjectItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.subjectName}>{s}</Text>
            </View>
          ))}
        </View>

        {/* CSV Columns */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="grid" size={22} color="#F59E0B" />
            <Text style={styles.cardTitle}>أعمدة الـ CSV</Text>
          </View>
          {[
            { col: 'subject_name', desc: 'اسم المادة' },
            { col: 'exam_type', desc: 'comprehensive أو chapter' },
            { col: 'year', desc: 'السنة (2014-2026)' },
            { col: 'round', desc: 'first/second/third/preliminary' },
            { col: 'duration', desc: 'مدة الامتحان بالدقائق' },
            { col: 'q_number', desc: 'رقم السؤال' },
            { col: 'q_text', desc: 'نص السؤال' },
            { col: 'marks', desc: 'درجة السؤال' },
            { col: 'model_answer', desc: 'الإجابة النموذجية' },
          ].map((c, i) => (
            <View key={i} style={styles.colItem}>
              <Text style={styles.colDesc}>{c.desc}</Text>
              <Text style={styles.colName}>{c.col}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.templateBtn} onPress={downloadTemplate}>
          <Ionicons name="download-outline" size={20} color="#4F46E5" />
          <Text style={styles.templateBtnText}>تحميل Template جاهز</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickFile} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadBtnText}>اختر ملف CSV وارفعه</Text>
              </>
          }
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={[styles.resultCard, { borderColor: result.failed === 0 ? '#10B981' : '#F59E0B' }]}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={result.failed === 0 ? 'checkmark-circle' : 'warning'}
                size={24}
                color={result.failed === 0 ? '#10B981' : '#F59E0B'}
              />
              <Text style={styles.resultTitle}>نتيجة الرفع</Text>
            </View>
            <Text style={styles.resultText}>✅ تم رفع {result.success} امتحان</Text>
            {result.failed > 0 && <Text style={styles.resultText}>❌ فشل {result.failed} امتحان</Text>}
            {result.errors.map((e, i) => (
              <Text key={i} style={styles.resultError}>• {e}</Text>
            ))}
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { marginBottom: 8 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, backgroundColor: '#10B981', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerContent: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 24, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  steps: { gap: 10 },
  step: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepText: { fontSize: 14, color: '#555', textAlign: 'right', flex: 1 },
  stepNum: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#4F46E520', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#4F46E5' },
  subjectItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  subjectName: { fontSize: 14, color: '#1E1B4B', fontWeight: '600' },
  colItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colName: { fontSize: 13, fontWeight: '700', color: '#4F46E5', fontFamily: 'monospace' },
  colDesc: { fontSize: 13, color: '#555' },
  templateBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EEF2FF', borderRadius: 14, height: 52, marginBottom: 12, borderWidth: 2, borderColor: '#4F46E5' },
  templateBtnText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  uploadBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 14, height: 54, marginBottom: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  uploadBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  resultCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, marginBottom: 12 },
  resultHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B' },
  resultText: { fontSize: 14, color: '#555', textAlign: 'right', marginBottom: 4 },
  resultError: { fontSize: 13, color: '#EF4444', textAlign: 'right', marginBottom: 2 },
  errorCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14 },
  errorText: { fontSize: 14, color: '#EF4444', flex: 1, textAlign: 'right' },
});
