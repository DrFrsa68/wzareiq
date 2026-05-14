import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function Home() {
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, hours: 0 });

  useEffect(() => {
    api.get('/sessions/history').then(r => {
      const sessions = r.data;
      const total = sessions.length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMarks = sessions.reduce((sum, s) => sum + (s.exam?.questions?.length || 0) * 10, 0);
      const avgScore = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
      const hours = Math.round(total * 1.5);
      setStats({ total, avgScore, hours });
    }).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/sawabwhite.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.greeting}>أهلاً، {user?.name}</Text>
        <Text style={styles.sub}>جاهز للمراجعة اليوم؟</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>امتحان مكتمل</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.avgScore}%</Text>
          <Text style={styles.statLabel}>معدل النجاح</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.hours}</Text>
          <Text style={styles.statLabel}>ساعة دراسة</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60, backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'flex-end' },
  logo: { width: 100, height: 40, marginBottom: 12, alignSelf: 'flex-end' },
  greeting: { fontSize: 24, fontFamily: fonts.bold, color: colors.white },
  sub: { fontSize: 14, color: colors.primaryLight, marginTop: 4, fontFamily: fonts.regular },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statNum: { fontSize: 24, fontFamily: fonts.bold, color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center', fontFamily: fonts.regular }
});