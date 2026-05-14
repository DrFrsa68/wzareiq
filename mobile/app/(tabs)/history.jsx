import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';

const ROUND_LABELS = {
  FIRST: 'الدور الأول',
  SECOND: 'الدور الثاني',
  THIRD: 'الدور الثالث',
  PRELIMINARY: 'التمهيدي'
};

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions/history').then(r => {
      setSessions(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1D52D8" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>سجل الامتحانات</Text>

      {sessions.length === 0 && (
        <Text style={styles.empty}>ما أجريت أي امتحان بعد</Text>
      )}

      {sessions.map(s => {
        const total = s.exam?.questions?.length * 10 || 0;
        const score = s.totalScore || 0;
        const percent = total > 0 ? Math.round((score / total) * 100) : 0;

        return (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/exam/result', params: { sessionId: s.id } })}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.percent, { color: percent >= 50 ? '#10B981' : '#EF4444' }]}>
                {percent}%
              </Text>
              <Text style={styles.subject}>{s.exam?.subject?.name}</Text>
            </View>
            <Text style={styles.meta}>
              {s.exam?.year} — {ROUND_LABELS[s.exam?.round]}
            </Text>
            <Text style={styles.score}>{score} / {total} درجة</Text>
            <Text style={styles.date}>
              {new Date(s.submittedAt).toLocaleDateString('ar-IQ')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'right', padding: 24, paddingTop: 60 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  percent: { fontSize: 20, fontWeight: 'bold' },
  meta: { color: '#666', fontSize: 13, textAlign: 'right', marginBottom: 4 },
  score: { color: '#1D52D8', fontSize: 14, textAlign: 'right', marginBottom: 4 },
  date: { color: '#aaa', fontSize: 12, textAlign: 'right' }
});