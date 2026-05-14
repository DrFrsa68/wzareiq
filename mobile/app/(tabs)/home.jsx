import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth.store';

export default function Home() {
  const user = useAuthStore(s => s.user);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>أهلاً، {user?.name} 👋</Text>
        <Text style={styles.sub}>جاهز للمراجعة اليوم؟</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>امتحان مكتمل</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0%</Text>
          <Text style={styles.statLabel}>معدل النجاح</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>ساعة دراسة</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#4F46E5', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'right' },
  sub: { fontSize: 14, color: '#c7c5ff', textAlign: 'right', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#4F46E5' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' }
});