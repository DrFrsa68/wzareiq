import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();

  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const cardWidth = (width - (columns + 1) * 12) / columns;
  const padding = width >= 768 ? 32 : 16;
  const maxWidth = width >= 1024 ? 1000 : '100%';

  useEffect(() => {
    api.get('/subjects').then(r => {
      setSubjects(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.header, { paddingHorizontal: padding }]}>
        <Text style={[styles.title, { fontSize: width >= 768 ? 32 : 24 }]}>المواد الدراسية</Text>
      </View>

      <View style={[styles.grid, { maxWidth, width: '100%', padding: padding / 2 }]}>
        {subjects.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.card, { width: cardWidth, borderTopColor: s.color }]}
            onPress={() => router.push({ pathname: '/exam', params: { subjectId: s.id, subjectName: s.name } })}
          >
            <Text style={[styles.icon, { fontSize: width >= 768 ? 44 : 36 }]}>{ICONS[s.icon] || '📚'}</Text>
            <Text style={[styles.name, { fontSize: width >= 768 ? 18 : 16 }]}>{s.name}</Text>
            <Text style={styles.count}>{s._count?.exams || 0} امتحان</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { width: '100%', paddingTop: 60, paddingBottom: 16 },
  title: { fontFamily: fonts.bold, color: colors.text, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 20, alignItems: 'center', borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  icon: { marginBottom: 10 },
  name: { fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  count: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: fonts.regular }
});