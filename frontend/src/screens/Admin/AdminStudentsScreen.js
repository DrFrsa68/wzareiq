import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function AdminStudentsScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => {
    if (!search) return setFiltered(students);
    setFiltered(students.filter(s =>
      s.name?.includes(search) || s.username?.includes(search)
    ));
  }, [search, students]);

  const loadStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
      setFiltered(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadStudents(); setRefreshing(false); };

  const confirmAction = (title, msg, onConfirm) => {
    if (typeof window !== 'undefined') {
      if (window.confirm(`${title}\n${msg}`)) onConfirm();
    } else {
      Alert.alert(title, msg, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', style: 'destructive', onPress: onConfirm }
      ]);
    }
  };

  const deleteStudent = (id, name) => {
    confirmAction('حذف الطالب', `هل تريد حذف "${name}"؟`, async () => {
      try {
        await api.delete(`/admin/students/${id}`);
        setStudents(prev => prev.filter(s => s.id !== id));
      } catch (err) { console.log(err); }
    });
  };

  const makeAdmin = (id, name) => {
    confirmAction('ترقية لأدمن', `هل تريد ترقية "${name}" لمدير؟`, async () => {
      try {
        await api.patch(`/admin/students/${id}/make-admin`);
        setStudents(prev => prev.map(s => s.id === id ? { ...s, role: 'admin' } : s));
      } catch (err) { console.log(err); }
    });
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>الطلاب</Text>
            <Text style={styles.subtitle}>{students.length} حساب مسجل</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="بحث بالاسم أو اسم المستخدم..."
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>مدير</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardUsername}>@{item.username}</Text>
              <Text style={styles.cardDate}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-IQ') : ''}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {item.role !== 'admin' && (
                <TouchableOpacity style={styles.promoteBtn} onPress={() => makeAdmin(item.id, item.name)}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#F59E0B" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteStudent(item.id, item.name)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 8 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, backgroundColor: '#F59E0B', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerContent: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 24, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 46, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E1B4B', outlineStyle: 'none' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#4F46E520', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1E1B4B' },
  adminBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  adminBadgeText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  cardUsername: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginBottom: 2 },
  cardDate: { fontSize: 11, color: '#C4C4C4', textAlign: 'right' },
  cardActions: { flexDirection: 'column', gap: 8 },
  promoteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
});
