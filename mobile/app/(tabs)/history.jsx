import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />;

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
              <Text style={[styles.percent, { color: percent >= 50 ? colors.success : colors.error }]}>
                {percent}%
              </Text>
              <Text style={styles.subject}>{s.exam?.subject?.name}</Text>
            </View>
            <Text style={styles.meta}>{s.exam?.year} — {ROUND_LABELS[s.exam?.round]}</Text>
            <Text style={styles.score}>{score} / {total} درجة</Text>
            <Text style={styles.date}>{new Date(s.submittedAt).toLocaleDateString('ar-IQ')}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', padding: 24, paddingTop: 60 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 16, fontFamily: fonts.regular },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  percent: { fontSize: 20, fontFamily: fonts.bold },
  meta: { color: colors.textSecondary, fontSize: 13, textAlign: 'right', marginBottom: 4, fontFamily: fonts.regular },
  score: { color: colors.primary, fontSize: 14, textAlign: 'right', marginBottom: 4, fontFamily: fonts.regular },
  date: { color: '#aaa', fontSize: 12, textAlign: 'right', fontFamily: fonts.regular }
});