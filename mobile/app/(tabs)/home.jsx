import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';

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
        <Text style={styles.greeting}>أهلاً، {user?.name} 👋</Text>
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#1D52D8', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  sub: { fontSize: 14, color: '#a8bef5', textAlign: 'right', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#1D52D8' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' }
});