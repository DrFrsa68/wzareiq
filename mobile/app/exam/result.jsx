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
      <Text style={styles.loadingText}>جاري تحميل النتيجة...</Text>
    </View>
  );

  const totalMarks = session.answers.reduce((sum, a) => sum + a.question.marks, 0);
  const scored = Math.round(session.answers.reduce((sum, a) => sum + (a.aiScore || 0), 0));
  const percent = totalMarks > 0 ? Math.round((scored / totalMarks) * 100) : 0;

  const getPercentColor = () => {
    if (percent >= 80) return colors.success;
    if (percent >= 50) return '#F59E0B';
    return colors.error;
  };

  const getPercentLabel = () => {
    if (percent >= 80) return 'ممتاز 🌟';
    if (percent >= 70) return 'جيد جداً 👍';
    if (percent >= 60) return 'جيد ✓';
    if (percent >= 50) return 'مقبول';
    return 'راجع مرة ثانية 📚';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.header, { width: '100%' }]}>
        <Text style={styles.subject}>{session.exam.subject?.name}</Text>
        <Text style={styles.title}>نتيجة الامتحان</Text>
        <View style={[styles.scoreCircle, { borderColor: getPercentColor() }]}>
          <Text style={[styles.scoreNum, { fontSize: isTablet ? 56 : 44, color: getPercentColor() }]}>{scored}</Text>
          <Text style={styles.scoreTotal}>/ {totalMarks}</Text>
        </View>
        <Text style={[styles.percent, { color: getPercentColor() }]}>{percent}%</Text>
        <Text style={styles.percentLabel}>{getPercentLabel()}</Text>
      </View>

      <View style={[styles.body, { maxWidth, width: '100%' }]}>
        <Text style={styles.sectionTitle}>تفاصيل الإجابات</Text>
        {session.answers.map((a, i) => (
          <View key={a.id} style={[styles.answerCard, { borderRightColor: a.aiScore >= a.question.marks * 0.5 ? colors.success : colors.error }]}>
            <View style={styles.answerHeader}>
              <View style={[styles.scoreBadge, { backgroundColor: (a.aiScore || 0) >= a.question.marks * 0.5 ? colors.success + '20' : colors.error + '20' }]}>
                <Text style={[styles.answerScore, { color: (a.aiScore || 0) >= a.question.marks * 0.5 ? colors.success : colors.error }]}>
                  {a.aiScore || 0} / {a.question.marks}
                </Text>
              </View>
              <Text style={styles.answerNum}>السؤال {i + 1}</Text>
            </View>

            <Text style={[styles.questionText, { fontSize: isTablet ? 16 : 14 }]}>{a.question.text}</Text>

            <View style={styles.answerSection}>
              <Text style={styles.label}>إجابتك</Text>
              <Text style={[styles.studentAnswer, !a.studentAnswer && styles.noAnswer]}>
                {a.studentAnswer || 'لم تجب على هذا السؤال'}
              </Text>
            </View>

            <View style={styles.answerSection}>
              <Text style={styles.label}>الإجابة النموذجية</Text>
              <Text style={styles.modelAnswer}>{a.question.answer?.text || 'غير متوفرة'}</Text>
            </View>

            {a.aiFeedback && (
              <View style={styles.answerSection}>
                <Text style={styles.label}>تحليل الذكاء الاصطناعي</Text>
                <Text style={styles.aiFeedback}>{a.aiFeedback}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/subjects')}>
          <Text style={styles.backBtnText}>العودة للمواد</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.textMuted, fontFamily: fonts.regular },
  header: { backgroundColor: colors.white, paddingTop: 60, paddingBottom: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  subject: { color: colors.textMuted, fontSize: 13, marginBottom: 4, fontFamily: fonts.regular },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 20, marginBottom: 20 },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 16 },
  scoreNum: { fontFamily: fonts.bold },
  scoreTotal: { fontSize: 18, color: colors.textMuted, marginBottom: 4, marginLeft: 4, fontFamily: fonts.regular },
  percent: { fontSize: 28, marginTop: 12, fontFamily: fonts.bold },
  percentLabel: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 4 },
  body: { padding: 16, alignSelf: 'center' },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, textAlign: 'right', marginBottom: 12, marginTop: 4 },
  answerCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderRightWidth: 4 },
  answerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  answerNum: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular },
  scoreBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  answerScore: { fontSize: 14, fontFamily: fonts.bold },
  questionText: { color: colors.text, textAlign: 'right', marginBottom: 12, fontFamily: fonts.regular, lineHeight: 24 },
  answerSection: { marginBottom: 10 },
  label: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginBottom: 4, fontFamily: fonts.regular },
  studentAnswer: { fontSize: 14, color: colors.text, textAlign: 'right', backgroundColor: '#f8f9fa', padding: 10, borderRadius: 10, fontFamily: fonts.regular },
  noAnswer: { color: colors.textMuted, fontStyle: 'italic' },
  modelAnswer: { fontSize: 14, color: colors.success, textAlign: 'right', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 10, fontFamily: fonts.regular },
  aiFeedback: { fontSize: 13, color: colors.primary, textAlign: 'right', backgroundColor: '#eff6ff', padding: 10, borderRadius: 10, fontFamily: fonts.regular },
  backBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  backBtnText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold },
});