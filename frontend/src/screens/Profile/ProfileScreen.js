import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { sessionsAPI } from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total: 0, avg: 0, best: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await sessionsAPI.getHistory();
      const sessions = res.data;
      if (sessions.length > 0) {
        const avg = sessions.reduce((s, i) => s + (i.total_score / i.max_score * 100), 0) / sessions.length;
        const best = Math.max(...sessions.map(i => i.total_score / i.max_score * 100));
        setStats({ total: sessions.length, avg: Math.round(avg), best: Math.round(best) });
      }
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) logout();
    } else { logout(); }
  };

  const menuItems = [
    { icon: 'time-outline', label: 'سجل الامتحانات', color: '#4F46E5', onPress: () => navigation.navigate('History') },
    { icon: 'book-outline', label: 'المواد الدراسية', color: '#10B981', onPress: () => navigation.navigate('Subjects') },
    ...(user?.role === 'admin' ? [{ icon: 'settings-outline', label: 'لوحة الإدارة', color: '#F59E0B', onPress: () => navigation.navigate('Admin') }] : []),
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
              <Text style={styles.adminBadgeText}>مدير</Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userHandle}>@{user?.username}</Text>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator color="#4F46E5" style={{ margin: 20 }} />
      ) : (
        <View style={styles.statsRow}>
          {[
            { label: 'امتحان', value: stats.total, icon: 'document-text', color: '#4F46E5' },
            { label: 'المتوسط', value: `${stats.avg}%`, icon: 'stats-chart', color: '#10B981' },
            { label: 'الأفضل', value: `${stats.best}%`, icon: 'trophy', color: '#F59E0B' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>القائمة</Text>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name="chevron-back" size={18} color="#ccc" />
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Account */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>الحساب</Text>
        <View style={styles.menuItem}>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemLabel}>{user?.name}</Text>
            <Text style={styles.menuItemSub}>الاسم الكامل</Text>
          </View>
          <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
        </View>
        <View style={styles.menuItem}>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemLabel}>@{user?.username}</Text>
            <Text style={styles.menuItemSub}>اسم المستخدم</Text>
          </View>
          <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="at-outline" size={20} color="#9CA3AF" />
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <Text style={styles.version}>وزاري v1.0.0</Text>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { alignItems: 'center', paddingBottom: 24, marginBottom: 8 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, backgroundColor: '#4F46E5', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarContainer: { marginTop: 52, marginBottom: 12, alignItems: 'center' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  adminBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  adminBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '900', color: '#1E1B4B', marginTop: 8 },
  userHandle: { fontSize: 14, color: '#9CA3AF', marginTop: 2 },
  statsRow: { flexDirection: 'row-reverse', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  menuSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textAlign: 'right', marginBottom: 8, marginRight: 4 },
  menuItem: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  menuItemInfo: { flex: 1 },
  menuItemLabel: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', textAlign: 'right' },
  menuItemSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 2 },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 14, height: 52, marginHorizontal: 16, marginBottom: 12 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#C4C4C4', marginBottom: 8 },
});
