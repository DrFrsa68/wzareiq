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
    // جرب تقرأ النتيجة من window أولاً
    if (!result && typeof window !== 'undefined' && window.__examResult) {
      const cached = window.__examResult;
      window.__examResult = null;
      setData(cached.result);
      setLoading(false);
      return;
    }
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
      <Text style={styles.loadingText}>جاري تحليل إجاباتك...</Text>
    </View>
  );

  const percentage = data ? Math.round((data.total_score / data.max_score) * 100) : 0;
  const getColor = (p) => p >= 80 ? '#10B981' : p >= 60 ? '#F59E0B' : '#EF4444';
  const getLabel = (p) => p >= 80 ? 'ممتاز' : p >= 60 ? 'جيد' : 'يحتاج مراجعة';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getColor(percentage) }]}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scorePercent}>{percentage}%</Text>
          <Text style={styles.scoreLabel}>{getLabel(percentage)}</Text>
        </View>
        <Text style={styles.examTitle}>{data?.title}</Text>
        <Text style={styles.scoreDetail}>
          {data?.total_score} / {data?.max_score} درجة
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}
          onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={20} color="#4F46E5" />
          <Text style={styles.actionBtnText}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}
          onPress={() => navigation.navigate('Subjects')}>
          <Ionicons name="refresh-outline" size={20} color="#10B981" />
          <Text style={[styles.actionBtnText, { color: '#10B981' }]}>امتحان جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Answers Review */}
      <Text style={styles.sectionTitle}>مراجعة الإجابات</Text>
      {(data?.answers || []).map((ans, i) => {
        const score = ans.ai_score ?? ans.score ?? 0;
        const marks = ans.marks;
        const pct = Math.round((score / marks) * 100);
        const color = getColor(pct);
        return (
          <View key={i} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
                <Text style={[styles.scoreBadgeText, { color }]}>{score}/{marks}</Text>
              </View>
              <Text style={styles.questionNum}>السؤال {i + 1}</Text>
            </View>

            <Text style={styles.questionText}>{ans.question_text}</Text>

            <View style={styles.answerSection}>
              <Text style={styles.answerSectionLabel}>إجابتك:</Text>
              <Text style={styles.answerText}>{ans.student_answer || ans.answer_text || 'لم تجب'}</Text>
            </View>

            <View style={[styles.answerSection, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.answerSectionLabel, { color: '#10B981' }]}>الإجابة النموذجية:</Text>
              <Text style={styles.answerText}>{ans.model_answer}</Text>
            </View>

            {(ans.ai_feedback || ans.feedback) && (
              <View style={[styles.answerSection, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.answerSectionLabel, { color: '#4F46E5' }]}>تحليل الذكاء الاصطناعي:</Text>
                <Text style={styles.answerText}>{ans.ai_feedback || ans.feedback}</Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: '#888' },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scorePercent: { fontSize: 36, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  examTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  scoreDetail: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  actions: { flexDirection: 'row-reverse', gap: 12, margin: 20 },
  actionBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, height: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginHorizontal: 20, marginBottom: 12 },
  answerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  answerHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionNum: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  scoreBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreBadgeText: { fontSize: 14, fontWeight: '700' },
  questionText: { fontSize: 15, color: '#1A1A2E', textAlign: 'right', lineHeight: 24, marginBottom: 12 },
  answerSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 },
  answerSectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', textAlign: 'right', marginBottom: 6 },
  answerText: { fontSize: 14, color: '#1A1A2E', textAlign: 'right', lineHeight: 22 },
});
