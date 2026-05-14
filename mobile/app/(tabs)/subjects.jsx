import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';

const ICONS = {
  calculator: '🧮', zap: '⚡', flask: '🧪',
  leaf: '🌿', book: '📖', globe: '🌐', star: '⭐'
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subjects').then(r => {
      setSubjects(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1D52D8" />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>المواد الدراسية</Text>
      <View style={styles.grid}>
        {subjects.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.card, { borderTopColor: s.color }]}
            onPress={() => router.push({ pathname: '/exam', params: { subjectId: s.id, subjectName: s.name } })}
          >
            <Text style={styles.icon}>{ICONS[s.icon] || '📚'}</Text>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.count}>{s._count?.exams || 0} امتحان</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'right', padding: 24, paddingTop: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  icon: { fontSize: 36, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center' },
  count: { fontSize: 12, color: '#888', marginTop: 4 }
});