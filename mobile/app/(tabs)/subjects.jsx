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
  const padding = width >= 768 ? 24 : 16;
  const gap = 12;
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;

  useEffect(() => {
    api.get('/subjects').then(r => {
      setSubjects(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: padding }]}>
        <Text style={[styles.title, { fontSize: width >= 768 ? 28 : 22 }]}>المواد الدراسية</Text>
        <Text style={styles.subtitle}>اختر المادة للبدء بالامتحان</Text>
      </View>

      <View style={[styles.grid, { padding }]}>
        {subjects.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.card, { width: cardWidth, borderTopColor: s.color }]}
            onPress={() => router.push({ pathname: '/exam', params: { subjectId: s.id, subjectName: s.name } })}
            activeOpacity={0.8}
          >
            <Text style={[styles.icon, { fontSize: width >= 768 ? 40 : 34 }]}>{ICONS[s.icon] || '📚'}</Text>
            <Text style={[styles.name, { fontSize: width >= 768 ? 16 : 14 }]}>{s.name}</Text>
            <View style={[styles.countBadge, { backgroundColor: s.color + '15' }]}>
              <Text style={[styles.count, { color: s.color }]}>{s._count?.exams || 0} امتحان</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 20 },
  title: { fontFamily: fonts.bold, color: colors.text, textAlign: 'right' },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'right', fontFamily: fonts.regular, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, alignItems: 'center', borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  icon: { marginBottom: 10 },
  name: { fontFamily: fonts.bold, color: colors.text, textAlign: 'center', marginBottom: 8 },
  countBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  count: { fontSize: 11, fontFamily: fonts.bold },
});