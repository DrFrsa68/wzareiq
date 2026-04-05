import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subjectsAPI } from '../../services/api';

const SUBJECT_ICONS = {
  'الرياضيات': { icon: 'calculator', color: '#4F46E5' },
  'الفيزياء': { icon: 'planet', color: '#0EA5E9' },
  'الكيمياء': { icon: 'flask', color: '#10B981' },
  'الأحياء': { icon: 'leaf', color: '#22C55E' },
  'اللغة العربية': { icon: 'language', color: '#F59E0B' },
  'اللغة الإنجليزية': { icon: 'globe', color: '#EF4444' },
  'الإسلامية': { icon: 'moon', color: '#8B5CF6' },
};

export default function SubjectsScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data);
    } catch (err) {
      Alert.alert('خطأ', 'تعذر تحميل المواد');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectStyle = (name) => {
    return SUBJECT_ICONS[name] || { icon: 'book', color: '#4F46E5' };
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  if (subjects.length === 0) return (
    <View style={styles.center}>
      <Ionicons name="book-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>لا توجد مواد متاحة حالياً</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>المواد الدراسية</Text>
        <Text style={styles.subtitle}>اختر المادة للبدء</Text>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const style = getSubjectStyle(item.name);
          return (
            <TouchableOpacity
              style={[styles.card, { borderTopColor: style.color }]}
              onPress={() => navigation.navigate('ExamSearch', { subject: item })}>
              <View style={[styles.iconBox, { backgroundColor: style.color + '20' }]}>
                <Ionicons name={style.icon} size={32} color={style.color} />
              </View>
              <Text style={styles.subjectName}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: style.color }]}>
                <Text style={styles.badgeText}>ابدأ</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'right', marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: 18,
    padding: 20, alignItems: 'center', borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', textAlign: 'center', marginBottom: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
