import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const SUBJECT_COLORS = {
  'الرياضيات': '#4F46E5', 'الفيزياء': '#0EA5E9', 'الكيمياء': '#10B981',
  'الأحياء': '#22C55E', 'اللغة العربية': '#F59E0B',
  'اللغة الإنجليزية': '#EF4444', 'الإسلامية': '#8B5CF6',
};

const ROUNDS = {
  'first': 'د1', 'second': 'د2', 'third': 'د3', 'preliminary': 'تمهيدي'
};

export default function AdminExamsScreen({ navigation }) {
  const [exams, setExams] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadExams(); }, []);
  useEffect(() => {
    if (!search) return setFiltered(exams);
    setFiltered(exams.filter(e =>
      e.title?.includes(search) || e.subject_name?.includes(search) || String(e.year)?.includes(search)
    ));
  }, [search, exams]);

  const loadExams = async () => {
    try {
      const res = await api.get('/admin/exams');
      setExams(res.data);
      setFiltered(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadExams(); setRefreshing(false); };

  const deleteExam = (id, title) => {
    if (typeof window !== 'undefined') {
      if (window.confirm(`حذف "${title}"؟`)) doDelete(id);
    } else {
      Alert.alert('حذف', `حذف "${title}"؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => doDelete(id) }
      ]);
    }
  };

  const doDelete = async (id) => {
    try {
      await api.delete(`/exams/${id}`);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) { console.log(err); }
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
            <Text style={styles.title}>الامتحانات</Text>
            <Text style={styles.subtitle}>{exams.length} امتحان مرفوع</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="بحث بالاسم أو المادة أو السنة..."
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد امتحانات</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = SUBJECT_COLORS[item.subject_name] || '#4F46E5';
          return (
            <View style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: color }]} />
              <View style={[styles.cardIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name="document-text" size={22} color={color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.subject_name} • {item.year} • {ROUNDS[item.round] || item.round}</Text>
                <Text style={styles.cardMarks}>{item.total_marks} درجة • {item.duration} دقيقة</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteExam(item.id, item.title)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 8 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, backgroundColor: '#4F46E5', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerContent: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 24, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 46, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E1B4B', outlineStyle: 'none' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  cardAccent: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', textAlign: 'right', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginBottom: 2 },
  cardMarks: { fontSize: 11, color: '#C4C4C4', textAlign: 'right' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 4 },
});
