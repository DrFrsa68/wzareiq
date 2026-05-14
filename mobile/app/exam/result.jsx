import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../lib/api';

export default function Result() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sessions/${sessionId}/result`).then(r => {
      setSession(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  const totalMarks = session.answers.reduce((sum, a) => sum + a.question.marks, 0);
  const scored = session.answers.reduce((sum, a) => sum + (a.aiScore || 0), 0);
  const percent = totalMarks > 0 ? Math.round((scored / totalMarks) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subject}>{session.exam.subject?.name}</Text>
        <Text style={styles.title}>نتيجة الامتحان</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNum}>{scored}</Text>
          <Text style={styles.scoreTotal}>/ {totalMarks}</Text>
        </View>
        <Text style={styles.percent}>{percent}%</Text>
      </View>

      <View style={styles.body}>
        {session.answers.map((a, i) => (
          <View key={a.id} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerScore}>{a.aiScore || 0} / {a.question.marks}</Text>
              <Text style={styles.answerNum}>السؤال {i + 1}</Text>
            </View>
            <Text style={styles.questionText}>{a.question.text}</Text>

            <Text style={styles.label}>إجابتك:</Text>
            <Text style={styles.studentAnswer}>{a.studentAnswer || 'لم تجب'}</Text>

            <Text style={styles.label}>الإجابة النموذجية:</Text>
            <Text style={styles.modelAnswer}>{a.question.answer?.text || 'غير متوفرة'}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/subjects')}>
        <Text style={styles.backBtnText}>العودة للمواد</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4F46E5', paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  subject: { color: '#c7c5ff', fontSize: 14, marginBottom: 4 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  scoreCircle: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 60, paddingHorizontal: 24, paddingVertical: 16 },
  scoreNum: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  scoreTotal: { fontSize: 20, color: '#c7c5ff', marginBottom: 8, marginLeft: 4 },
  percent: { color: '#fff', fontSize: 18, marginTop: 8 },
  body: { padding: 16 },
  answerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  answerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  answerNum: { fontSize: 14, color: '#666' },
  answerScore: { fontSize: 14, fontWeight: 'bold', color: '#4F46E5' },
  questionText: { fontSize: 15, color: '#1a1a2e', textAlign: 'right', marginBottom: 12 },
  label: { fontSize: 12, color: '#888', textAlign: 'right', marginBottom: 4 },
  studentAnswer: { fontSize: 14, color: '#333', textAlign: 'right', backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 10 },
  modelAnswer: { fontSize: 14, color: '#10B981', textAlign: 'right', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8 },
  backBtn: { margin: 16, backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 40 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});