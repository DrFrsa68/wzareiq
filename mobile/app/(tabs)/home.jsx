import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { router } from 'expo-router';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function Home() {
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, hours: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  useEffect(() => {
    api.get('/sessions/history').then(r => {
      const sessions = r.data;
      const total = sessions.length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMarks = sessions.reduce((sum, s) => sum + (s.exam?.questions?.length || 0) * 10, 0);
      const avgScore = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
      const hours = Math.round(total * 1.5);
      setStats({ total, avgScore, hours });
      setRecentSessions(sessions.slice(0, 3));
    }).catch(() => {});
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 50) return '#F59E0B';
    return colors.error;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.header, { paddingHorizontal: isTablet ? 48 : 24 }]}>
        <Image source={require('../../assets/sawabwhite.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.greeting, { fontSize: isTablet ? 28 : 22 }]}>أهلاً، {user?.name} 👋</Text>
        <Text style={styles.sub}>جاهز للمراجعة اليوم؟</Text>
      </View>

      <View style={[styles.statsRow, { maxWidth: isTablet ? 800 : '100%', width: '100%' }]}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { fontSize: isTablet ? 32 : 26 }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>امتحان مكتمل</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { fontSize: isTablet ? 32 : 26, color: getScoreColor(stats.avgScore) }]}>{stats.avgScore}%</Text>
          <Text style={styles.statLabel}>معدل النجاح</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { fontSize: isTablet ? 32 : 26 }]}>{stats.hours}</Text>
          <Text style={styles.statLabel}>ساعة دراسة</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { maxWidth: isTablet ? 800 : '100%', width: '100%' }]}
        onPress={() => router.push('/(tabs)/subjects')}
      >
        <Text style={styles.startBtnText}>ابدأ امتحاناً جديداً ←</Text>
      </TouchableOpacity>

      {recentSessions.length > 0 && (
        <View style={[styles.section, { maxWidth: isTablet ? 800 : '100%', width: '100%' }]}>
          <Text style={styles.sectionTitle}>آخر الامتحانات</Text>
          {recentSessions.map(s => {
            const total = (s.exam?.questions?.length || 0) * 10;
            const score = s.totalScore || 0;
            const percent = total > 0 ? Math.round((score / total) * 100) : 0;
            return (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(percent) + '20' }]}>
                  <Text style={[styles.scoreBadgeText, { color: getScoreColor(percent) }]}>{percent}%</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionSubject}>{s.exam?.subject?.name}</Text>
                  <Text style={styles.sessionMeta}>{score} / {total} درجة</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { width: '100%', paddingTop: 60, paddingBottom: 32, backgroundColor: colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: 'flex-end' },
  logo: { width: 100, height: 40, marginBottom: 16, alignSelf: 'flex-end' },
  greeting: { fontFamily: fonts.bold, color: colors.white },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontFamily: fonts.regular },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  statNum: { fontFamily: fonts.bold, color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center', fontFamily: fonts.regular },
  startBtn: { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center' },
  startBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  section: { padding: 16, marginTop: 8 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, textAlign: 'right', marginBottom: 12 },
  sessionCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  scoreBadge: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  scoreBadgeText: { fontFamily: fonts.bold, fontSize: 16 },
  sessionInfo: { flex: 1, alignItems: 'flex-end' },
  sessionSubject: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  sessionMeta: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 2 },
});