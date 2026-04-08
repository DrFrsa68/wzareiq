import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sessionsAPI } from '../../services/api';

const SUBJECT_COLORS = {
  'الرياضيات': '#4F46E5', 'الفيزياء': '#0EA5E9', 'الكيمياء': '#10B981',
  'الأحياء': '#22C55E', 'اللغة العربية': '#F59E0B',
  'اللغة الإنجليزية': '#EF4444', 'الإسلامية': '#8B5CF6',
};

const ROUNDS = {
  'first': 'الدور الأول', 'second': 'الدور الثاني',
  'third': 'الدور الثالث', 'preliminary': 'التمهيدي',
};

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await sessionsAPI.getHistory();
      setSessions(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadHistory(); setRefreshing(false); };

  const getColor = (pct) => pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';

  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'high', label: 'ممتاز' },
    { key: 'mid', label: 'جيد' },
    { key: 'low', label: 'يراجع' },
  ];

  const filtered = sessions.filter(s => {
    const pct = Math.round((s.total_score / s.max_score) * 100);
    if (filter === 'high') return pct >= 80;
    if (filter === 'mid') return pct >= 60 && pct < 80;
    if (filter === 'low') return pct < 60;
    return true;
  });

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>سجل الامتحانات</Text>
          <Text style={styles.subtitle}>{sessions.length} امتحان مكتمل</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {filters.map(f => (
          <TouchableOpacity key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={48} color="#4F46E5" />
          </View>
          <Text style={styles.emptyTitle}>
            {sessions.length === 0 ? 'لم تجري أي امتحان بعد' : 'لا توجد نتائج'}
          </Text>
          {sessions.length === 0 && (
            <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('Subjects')}>
              <Text style={styles.startBtnText}>ابدأ الآن</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
          renderItem={({ item }) => {
            const pct = Math.round((item.total_score / item.max_score) * 100);
            const color = getColor(pct);
            const subjectColor = SUBJECT_COLORS[item.subject_name] || '#4F46E5';
            return (
              <TouchableOpacity style={styles.card}
                onPress={() => navigation.navigate('Results', { session_id: item.id })}>
                <View style={[styles.cardAccent, { backgroundColor: subjectColor }]} />
                <View style={[styles.subjectIcon, { backgroundColor: subjectColor + '15' }]}>
                  <Ionicons name="document-text" size={22} color={subjectColor} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.subject_name} • {item.year} • {ROUNDS[item.round] || item.round}</Text>
                  <Text style={styles.cardDate}>
                    {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('ar-IQ') : ''}
                  </Text>
                </View>
                <View style={[styles.scoreCircle, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.scoreText, { color }]}>{pct}%</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 4 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, backgroundColor: '#4F46E5', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'right' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginTop: 4 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyIcon: { width: 96, height: 96, borderRadius: 28, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, color: '#888', fontWeight: '600', textAlign: 'center' },
  startBtn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, 
    flexDirection: 'row', alignItems: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, 
    overflow: 'hidden' 
  },
  cardAccent: { 
    position: 'absolute', 
    left: 0,  // تغيير من right إلى left
    top: 0, bottom: 0, 
    width: 4 
  },
  subjectIcon: { 
    width: 46, height: 46, borderRadius: 13, 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 12  // تغيير من marginLeft إلى marginRight
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', textAlign: 'right', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginBottom: 3 },
  cardDate: { fontSize: 11, color: '#C4C4C4', textAlign: 'right' },
  scoreCircle: { 
    width: 52, height: 52, borderRadius: 14, 
    justifyContent: 'center', alignItems: 'center', 
    marginLeft: 4  // تغيير من marginRight إلى marginLeft
  },
  scoreText: { fontSize: 14, fontWeight: '800' },
});