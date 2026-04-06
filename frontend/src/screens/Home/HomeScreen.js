import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { sessionsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, avgScore: 0, best: 0 });
  const [recent, setRecent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

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

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const getScoreColor = (pct) => pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
            </TouchableOpacity>
            <View style={styles.greetingBox}>
              <Text style={styles.greeting}>{greeting()} 👋</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
          </View>

          {/* Stats Banner */}
          <View style={styles.statsBanner}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLbl}>امتحان</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.avgScore}%</Text>
              <Text style={styles.statLbl}>المتوسط</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.best}%</Text>
              <Text style={styles.statLbl}>الأفضل</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>ابدأ الآن</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, styles.actionPrimary]}
            onPress={() => navigation.navigate('Subjects')}>
            <View style={styles.actionIconBig}>
              <Ionicons name="book" size={32} color="#fff" />
            </View>
            <Text style={styles.actionTitleWhite}>الامتحانات الوزارية</Text>
            <Text style={styles.actionSubWhite}>اختر المادة وابدأ</Text>
            <Ionicons name="arrow-back-circle" size={24} color="rgba(255,255,255,0.6)" style={styles.actionArrow} />
          </TouchableOpacity>

          <View style={styles.actionsCol}>
            <TouchableOpacity style={[styles.actionCardSmall, { backgroundColor: '#EFF6FF' }]}
              onPress={() => navigation.navigate('History')}>
              <Ionicons name="time" size={24} color="#4F46E5" />
              <Text style={styles.actionTitleSmall}>السجل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCardSmall, { backgroundColor: '#F0FDF4' }]}
              onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person" size={24} color="#10B981" />
              <Text style={[styles.actionTitleSmall, { color: '#10B981' }]}>حسابي</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Exams */}
        {recent.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>آخر الامتحانات</Text>
            </View>
            {recent.map((s, i) => {
              const pct = Math.round((s.total_score / s.max_score) * 100);
              const color = getScoreColor(pct);
              return (
                <TouchableOpacity key={i} style={styles.recentCard}
                  onPress={() => navigation.navigate('Results', { session_id: s.id })}>
                  <View style={[styles.recentScore, { backgroundColor: color + '15' }]}>
                    <Text style={[styles.recentScoreText, { color }]}>{pct}%</Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.recentMeta}>{s.subject_name} • {s.year} • {s.round}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color="#ccc" />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="school-outline" size={48} color="#4F46E5" />
            </View>
            <Text style={styles.emptyTitle}>ابدأ رحلتك الدراسية!</Text>
            <Text style={styles.emptySub}>اختر مادة وابدأ أول امتحان وزاري</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Subjects')}>
              <Text style={styles.emptyBtnText}>ابدأ الآن</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { marginBottom: 8 },
  headerBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    backgroundColor: '#4F46E5', borderBottomLeftRadius: 32, borderBottomRightRadius: 32
  },
  headerContent: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20, gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)'
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  greetingBox: { flex: 1 },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statsBanner: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    flexDirection: 'row-reverse', justifyContent: 'space-around',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
  statLbl: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', textAlign: 'right', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  seeAll: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  actionsGrid: { flexDirection: 'row-reverse', marginHorizontal: 20, gap: 12 },
  actionCard: {
    flex: 2, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4
  },
  actionPrimary: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5', shadowOpacity: 0.3
  },
  actionIconBig: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  actionTitleWhite: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  actionSubWhite: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'right' },
  actionArrow: { position: 'absolute', bottom: 16, left: 16 },
  actionsCol: { flex: 1, gap: 12 },
  actionCardSmall: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8
  },
  actionTitleSmall: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  recentCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  recentScore: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  recentScoreText: { fontSize: 16, fontWeight: '800' },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', textAlign: 'right', marginBottom: 4 },
  recentMeta: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: '#EEF2FF', justifyContent: 'center',
    alignItems: 'center', marginBottom: 20
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 14
  },
  emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
