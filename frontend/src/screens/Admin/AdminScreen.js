import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { subjectsAPI, examsAPI } from '../../services/api';
import api from '../../services/api';

export default function AdminScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ subjects: 0, exams: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [subjectsRes, statsRes] = await Promise.all([
        subjectsAPI.getAll(),
        api.get('/admin/stats'),
      ]);
      setStats({
        subjects: subjectsRes.data.length,
        exams: statsRes.data.exams || 0,
        students: statsRes.data.students || 0,
      });
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  if (user?.role !== 'admin') return (
    <View style={styles.center}>
      <Ionicons name="lock-closed" size={60} color="#ccc" />
      <Text style={styles.noAccess}>هذه الصفحة للمدراء فقط</Text>
    </View>
  );

  const menuItems = [
    { title: 'إدارة المواد', subtitle: `${stats.subjects} مادة`, icon: 'book', color: '#4F46E5', screen: 'AdminSubjects' },
    { title: 'إدارة الامتحانات', subtitle: `${stats.exams} امتحان`, icon: 'document-text', color: '#10B981', screen: 'AdminExams' },
    { title: 'إضافة امتحان جديد', subtitle: 'رفع أسئلة وأجوبة', icon: 'add-circle', color: '#F59E0B', screen: 'AdminAddExam' },
    { title: 'إدارة الطلاب', subtitle: `${stats.students} طالب`, icon: 'people', color: '#EF4444', screen: 'AdminStudents' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>لوحة الإدارة</Text>
        <Text style={styles.subtitle}>مرحباً {user?.name}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'المواد', value: stats.subjects, icon: 'book', color: '#4F46E5' },
          { label: 'الامتحانات', value: stats.exams, icon: 'document-text', color: '#10B981' },
          { label: 'الطلاب', value: stats.students, icon: 'people', color: '#F59E0B' },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Ionicons name={s.icon} size={24} color={s.color} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <Text style={styles.sectionTitle}>الإجراءات</Text>
      {menuItems.map((item, i) => (
        <TouchableOpacity key={i} style={styles.menuItem}
          onPress={() => navigation.navigate(item.screen)}>
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <Ionicons name="chevron-back" size={20} color="#ccc" />
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  noAccess: { fontSize: 16, color: '#888' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'right', marginTop: 4 },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginHorizontal: 20, marginBottom: 12 },
  menuItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  menuIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', textAlign: 'right' },
  menuSubtitle: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
});
