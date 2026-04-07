import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sessionsAPI } from '../../services/api';

export default function ResultsScreen({ route, navigation }) {
  const { result, session_id } = route.params;
  const [data, setData] = useState(result || null);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result && session_id) loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const res = await sessionsAPI.getSession(session_id);
      setData(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>جاري تحميل النتيجة...</Text>
    </View>
  );

  const pct = data ? Math.round((data.total_score / data.max_score) * 100) : 0;
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const label = pct >= 80 ? 'ممتاز 🎉' : pct >= 60 ? 'جيد 👍' : 'يحتاج مراجعة 📚';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scorePct}>{pct}%</Text>
          <Text style={styles.scoreLabel}>{label}</Text>
        </View>
        <Text style={styles.examTitle}>{data?.title}</Text>
        <Text style={styles.scoreDetail}>{data?.total_score} / {data?.max_score} درجة</Text>
        {data?.grading && (
          <View style={styles.gradingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.gradingText}>جاري التصحيح النهائي...</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={20} color="#4F46E5" />
          <Text style={styles.actionBtnText}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFill]} onPress={() => navigation.navigate('SubjectsList')}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>امتحان جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'الدرجة', value: `${data?.total_score}/${data?.max_score}`, icon: 'star', color: '#F59E0B' },
          { label: 'النسبة', value: `${pct}%`, icon: 'stats-chart', color },
          { label: 'الأسئلة', value: (data?.answers || []).length, icon: 'help-circle', color: '#4F46E5' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Answers Review */}
      <Text style={styles.sectionTitle}>مراجعة الإجابات</Text>
      {(data?.answers || []).map((ans, i) => {
        const s = ans.ai_score ?? ans.score ?? 0;
        const m = ans.marks;
        const c = s/m >= 0.8 ? '#10B981' : s/m >= 0.6 ? '#F59E0B' : '#EF4444';
        return (
          <View key={i} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <View style={[styles.scoreTag, { backgroundColor: c + '15' }]}>
                <Text style={[styles.scoreTagText, { color: c }]}>{s}/{m}</Text>
              </View>
              <Text style={styles.questionNum}>السؤال {i + 1}</Text>
            </View>
            <Text style={styles.questionText}>{ans.question_text}</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerBoxLabel}>إجابتك</Text>
              <Text style={styles.answerBoxText}>{ans.student_answer || ans.answer_text || 'لم تجب'}</Text>
            </View>
            <View style={[styles.answerBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.answerBoxLabel, { color: '#10B981' }]}>الإجابة النموذجية</Text>
              <Text style={styles.answerBoxText}>{ans.model_answer}</Text>
            </View>
            {(ans.ai_feedback || ans.feedback) && (
              <View style={[styles.answerBox, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.answerBoxLabel, { color: '#4F46E5' }]}>تحليل الذكاء الاصطناعي</Text>
                <Text style={styles.answerBoxText}>{ans.ai_feedback || ans.feedback}</Text>
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#888' },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20 },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scorePct: { fontSize: 38, fontWeight: '900', color: '#fff' },
  scoreLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  examTitle: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6, paddingHorizontal: 20 },
  scoreDetail: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  gradingBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  gradingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row-reverse', gap: 12, margin: 16 },
  actionBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 14, height: 50, borderWidth: 2, borderColor: '#4F46E5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionBtnFill: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  statsRow: { flexDirection: 'row-reverse', marginHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', textAlign: 'right', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  answerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  answerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  questionNum: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  scoreTag: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreTagText: { fontSize: 13, fontWeight: '800' },
  questionText: { fontSize: 14, color: '#1E1B4B', textAlign: 'right', lineHeight: 22, marginBottom: 12 },
  answerBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 },
  answerBoxLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'right', marginBottom: 4 },
  answerBoxText: { fontSize: 14, color: '#1E1B4B', textAlign: 'right', lineHeight: 20 },
});
