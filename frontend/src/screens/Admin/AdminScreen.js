import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exams: 0, students: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadStats(); setRefreshing(false); };

  if (user?.role !== 'admin') return (
    <View style={styles.center}>
      <Ionicons name="lock-closed" size={64} color="#ccc" />
      <Text style={styles.noAccess}>هذه الصفحة للمدراء فقط</Text>
    </View>
  );

  const quickActions = [
    { title: 'إضافة امتحان', subtitle: 'يدوي سؤال بسؤال', icon: 'add-circle', color: '#4F46E5', screen: 'AdminAddExam' },
    { title: 'رفع Excel', subtitle: 'رفع بالجملة', icon: 'cloud-upload', color: '#10B981', screen: 'AdminUpload' },
    { title: 'الامتحانات', subtitle: `${stats.exams} امتحان`, icon: 'document-text', color: '#0EA5E9', screen: 'AdminExams' },
    { title: 'الطلاب', subtitle: `${stats.students} طالب`, icon: 'people', color: '#F59E0B', screen: 'AdminStudents' },
    { title: 'التقارير', subtitle: 'إحصائيات تفصيلية', icon: 'stats-chart', color: '#8B5CF6', screen: 'AdminStats' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.headerGreeting}>لوحة الإدارة</Text>
              <Text style={styles.headerName}>{user?.name}</Text>
            </View>
          </View>

          {/* Stats Banner */}
          {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 16 }} /> : (
            <View style={styles.statsBanner}>
              {[
                { label: 'امتحان', value: stats.exams, icon: 'document-text' },
                { label: 'طالب', value: stats.students, icon: 'people' },
                { label: 'جلسة', value: stats.sessions, icon: 'time' },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statNum}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity key={i}
            style={[styles.actionCard, i === 0 && styles.actionCardWide]}
            onPress={() => navigation.navigate(action.screen)}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={26} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSub}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  noAccess: { fontSize: 16, color: '#888' },
  header: { marginBottom: 8 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, backgroundColor: '#4F46E5', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statsBanner: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row-reverse', justifyContent: 'space-around', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', textAlign: 'right', marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginHorizontal: 16, gap: 12 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionCardWide: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#1E1B4B', textAlign: 'right', marginBottom: 2 },
  actionSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
});
