import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />;

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
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', padding: 24, paddingTop: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: { width: '47%', backgroundColor: colors.white, borderRadius: 16, padding: 20, alignItems: 'center', borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  icon: { fontSize: 36, marginBottom: 10 },
  name: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  count: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: fonts.regular }
});