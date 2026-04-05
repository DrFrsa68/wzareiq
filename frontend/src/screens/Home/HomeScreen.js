import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { sessionsAPI } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, avgScore: 0, best: 0 });
  const [recent, setRecent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await sessionsAPI.getHistory();
      const sessions = res.data;
      if (sessions.length > 0) {
        const avg = sessions.reduce((s, i) => s + (i.total_score / i.max_score * 100), 0) / sessions.length;
        const best = Math.max(...sessions.map(i => i.total_score / i.max_score * 100));
        setStats({ total: sessions.length, avgScore: Math.round(avg), best: Math.round(best) });
        setRecent(sessions.slice(0, 3));
      }
    } catch (err) { console.log(err); }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const statCards = [
    { label: 'امتحانات', value: stats.total, icon: 'document-text', color: '#4F46E5' },
    { label: 'متوسط الدرجات', value: `${stats.avgScore}%`, icon: 'stats-chart', color: '#10B981' },
    { label: 'أفضل نتيجة', value: `${stats.best}%`, icon: 'trophy', color: '#F59E0B' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>أهلاً،</Text>
          <Text style={styles.name}>{user?.name} 👋</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>إحصائياتك</Text>
      <View style={styles.statsRow}>
        {statCards.map((card, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: card.color }]}>
            <View style={[styles.statIcon, { backgroundColor: card.color + '20' }]}>
              <Ionicons name={card.icon} size={22} color={card.color} />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>ابدأ الآن</Text>
      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Subjects')}>
        <View style={styles.actionLeft}>
          <View style={[styles.actionIcon, { backgroundColor: '#4F46E520' }]}>
            <Ionicons name="book" size={28} color="#4F46E5" />
          </View>
          <View>
            <Text style={styles.actionTitle}>الامتحانات الوزارية</Text>
            <Text style={styles.actionSub}>اختر المادة وابدأ الامتحان</Text>
          </View>
        </View>
        <Ionicons name="chevron-back" size={20} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('History')}>
        <View style={styles.actionLeft}>
          <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="time" size={28} color="#10B981" />
          </View>
          <View>
            <Text style={styles.actionTitle}>سجل الامتحانات</Text>
            <Text style={styles.actionSub}>راجع نتائجك السابقة</Text>
          </View>
        </View>
        <Ionicons name="chevron-back" size={20} color="#ccc" />
      </TouchableOpacity>

      {/* Recent */}
      {recent.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>آخر الامتحانات</Text>
          {recent.map((s, i) => (
            <TouchableOpacity key={i} style={styles.recentCard}
              onPress={() => navigation.navigate('Results', { session_id: s.id })}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentTitle}>{s.title}</Text>
                <Text style={styles.recentSub}>{s.subject_name} • {s.year} • {s.round}</Text>
              </View>
              <View style={styles.recentScore}>
                <Text style={styles.recentScoreText}>
                  {Math.round(s.total_score / s.max_score * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', paddingHorizontal: 20 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  greeting: { fontSize: 14, color: '#888', textAlign: 'right' },
  name: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', textAlign: 'right' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginBottom: 12, marginTop: 8 },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 2 },
  actionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', textAlign: 'right' },
  actionSub: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
  recentCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  recentLeft: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', textAlign: 'right' },
  recentSub: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 4 },
  recentScore: { backgroundColor: '#4F46E520', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  recentScoreText: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
});
