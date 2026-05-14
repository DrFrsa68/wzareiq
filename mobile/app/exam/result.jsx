import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function Result() {
  const { sessionId } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const maxWidth = isTablet ? 700 : '100%';

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
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const totalMarks = session.answers.reduce((sum, a) => sum + a.question.marks, 0);
  const scored = session.answers.reduce((sum, a) => sum + (a.aiScore || 0), 0);
  const percent = totalMarks > 0 ? Math.round((scored / totalMarks) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.header, { width: '100%' }]}>
        <Text style={styles.subject}>{session.exam.subject?.name}</Text>
        <Text style={[styles.title, { fontSize: isTablet ? 28 : 22 }]}>نتيجة الامتحان</Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNum, { fontSize: isTablet ? 64 : 48 }]}>{scored}</Text>
          <Text style={styles.scoreTotal}>/ {totalMarks}</Text>
        </View>
        <Text style={[styles.percent, { fontSize: isTablet ? 24 : 18 }]}>{percent}%</Text>
      </View>

      <View style={[styles.body, { maxWidth, width: '100%' }]}>
        {session.answers.map((a, i) => (
          <View key={a.id} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerScore}>{a.aiScore || 0} / {a.question.marks}</Text>
              <Text style={styles.answerNum}>السؤال {i + 1}</Text>
            </View>
            <Text style={[styles.questionText, { fontSize: isTablet ? 17 : 15 }]}>{a.question.text}</Text>

            <Text style={styles.label}>إجابتك:</Text>
            <Text style={styles.studentAnswer}>{a.studentAnswer || 'لم تجب'}</Text>

            <Text style={styles.label}>الإجابة النموذجية:</Text>
            <Text style={styles.modelAnswer}>{a.question.answer?.text || 'غير متوفرة'}</Text>

            {a.aiFeedback && (
              <>
                <Text style={styles.label}>تحليل الذكاء الاصطناعي:</Text>
                <Text style={styles.aiFeedback}>{a.aiFeedback}</Text>
              </>
            )}
          </View>
        ))}

        <View style={styles.btns}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/subjects')}>
            <Text style={styles.backBtnText}>العودة للمواد</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  subject: { color: colors.primaryLight, fontSize: 14, marginBottom: 4, fontFamily: fonts.regular },
  title: { fontFamily: fonts.bold, color: colors.white, marginBottom: 20 },
  scoreCircle: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 60, paddingHorizontal: 24, paddingVertical: 16 },
  scoreNum: { fontFamily: fonts.bold, color: colors.white },
  scoreTotal: { fontSize: 20, color: colors.primaryLight, marginBottom: 8, marginLeft: 4, fontFamily: fonts.regular },
  percent: { color: colors.white, marginTop: 8, fontFamily: fonts.bold },
  body: { padding: 16, alignSelf: 'center' },
  answerCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  answerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  answerNum: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.regular },
  answerScore: { fontSize: 14, fontFamily: fonts.bold, color: colors.primary },
  questionText: { color: colors.text, textAlign: 'right', marginBottom: 12, fontFamily: fonts.regular },
  label: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginBottom: 4, fontFamily: fonts.regular },
  studentAnswer: { fontSize: 14, color: colors.text, textAlign: 'right', backgroundColor: colors.background, padding: 10, borderRadius: 8, marginBottom: 10, fontFamily: fonts.regular },
  modelAnswer: { fontSize: 14, color: colors.success, textAlign: 'right', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, marginBottom: 10, fontFamily: fonts.regular },
  aiFeedback: { fontSize: 14, color: colors.primary, textAlign: 'right', backgroundColor: '#eff6ff', padding: 10, borderRadius: 8, fontFamily: fonts.regular },
  btns: { gap: 12, marginBottom: 40, marginTop: 8 },
  backBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  backBtnText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold }
});