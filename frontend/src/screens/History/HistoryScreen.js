import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sessionsAPI } from '../../services/api';

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await sessionsAPI.getHistory();
      setSessions(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getColor = (p) => p >= 80 ? '#10B981' : p >= 60 ? '#F59E0B' : '#EF4444';

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سجل الامتحانات</Text>
        <Text style={styles.subtitle}>{sessions.length} امتحان مكتمل</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>لم تجري أي امتحان بعد</Text>
          <TouchableOpacity style={styles.startBtn}
            onPress={() => navigation.navigate('Subjects')}>
            <Text style={styles.startBtnText}>ابدأ الآن</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const pct = Math.round((item.total_score / item.max_score) * 100);
            const color = getColor(pct);
            return (
              <TouchableOpacity style={styles.card}
                onPress={() => navigation.navigate('Results', { session_id: item.id })}>
                <View style={styles.cardLeft}>
                  <View style={[styles.subjectIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name="document-text" size={24} color={color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardMeta}>{item.subject_name} • {item.year} • {item.round}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(item.submitted_at).toLocaleDateString('ar-IQ')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
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
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'right', marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: '#888' },
  startBtn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 },
  subjectIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', textAlign: 'right' },
  cardMeta: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
  cardDate: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  scoreText: { fontSize: 15, fontWeight: '800' },
});
