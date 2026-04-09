import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const SUBJECT_COLORS = {
  'الرياضيات': '#4F46E5', 'الفيزياء': '#0EA5E9', 'الكيمياء': '#10B981',
  'الأحياء': '#22C55E', 'اللغة العربية': '#F59E0B',
  'اللغة الإنجليزية': '#EF4444', 'الإسلامية': '#8B5CF6',
};

const ROUNDS = {
  'first': 'الدور الأول', 'second': 'الدور الثاني',
  'third': 'الدور الثالث', 'preliminary': 'التمهيدي',
};

export default function AdminExamsScreen({ navigation }) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '', subject_id: '', year: '', round: 'first',
    duration: 60, total_marks: 100
  });

  useEffect(() => { loadExams(); loadSubjects(); }, []);

  const loadExams = async () => {
    try {
      const res = await api.get('/admin/exams');
      setExams(res.data || []);
    } catch (err) { Alert.alert('خطأ', 'تعذر تحميل الامتحانات'); }
    finally { setLoading(false); }
  };

  const loadSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExams();
    setRefreshing(false);
  };

  // ✅ حذف
  const handleDelete = (id, title) => {
    Alert.alert(
      'حذف امتحان',
      `هل أنت متأكد من حذف "${title}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/exams/${id}`);
              Alert.alert('تم', 'تم الحذف');
              loadExams();
            } catch (err) {
              Alert.alert('خطأ', 'فشل الحذف');
            }
          }
        }
      ]
    );
  };

  // ✅ فتح نافذة التعديل
  const openEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      subject_id: exam.subject_id,
      year: exam.year.toString(),
      round: exam.round,
      duration: exam.duration,
      total_marks: exam.total_marks
    });
    setModalVisible(true);
  };

  // ✅ تحديث
  const handleUpdate = async () => {
    if (!formData.title.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال عنوان الامتحان');
      return;
    }
    try {
      await api.put(`/admin/exams/${editingExam.id}`, formData);
      Alert.alert('تم', 'تم التحديث');
      setModalVisible(false);
      loadExams();
    } catch (err) {
      Alert.alert('خطأ', 'فشل التحديث');
    }
  };

  // ✅ عرض
  const handleView = (subjectId, subjectName) => {
    navigation.navigate('ExamSearch', { 
      subject: { id: subjectId, name: subjectName } 
    });
  };

  const filteredExams = filterSubject === 'all'
    ? exams
    : exams.filter(e => e.subject_id === filterSubject);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الامتحانات ({exams.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminAddExam')}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterSubject === 'all' && styles.filterChipActive]}
            onPress={() => setFilterSubject('all')}
          >
            <Text style={[styles.filterText, filterSubject === 'all' && styles.filterTextActive]}>الكل</Text>
          </TouchableOpacity>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[styles.filterChip, filterSubject === subject.id && styles.filterChipActive]}
              onPress={() => setFilterSubject(subject.id)}
            >
              <Text style={[styles.filterText, filterSubject === subject.id && styles.filterTextActive]}>{subject.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* List */}
      <FlatList
        data={filteredExams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد امتحانات</Text>
          </View>
        }
        renderItem={({ item }) => {
          const subjectColor = SUBJECT_COLORS[item.subject_name] || '#4F46E5';
          return (
            <View style={[styles.card, { borderRightColor: subjectColor, borderRightWidth: 4 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.subjectBadge, { backgroundColor: subjectColor + '15' }]}>
                  <Text style={[styles.subjectText, { color: subjectColor }]}>{item.subject_name}</Text>
                </View>
                <Text style={styles.yearText}>{item.year}</Text>
              </View>
              <Text style={styles.titleText}>{item.title}</Text>
              <View style={styles.details}>
                <Text style={styles.detailText}>⏱ {item.duration} دقيقة</Text>
                <Text style={styles.detailText}>⭐ {item.total_marks} درجة</Text>
                <Text style={styles.detailText}>📅 {ROUNDS[item.round] || item.round}</Text>
              </View>
              <View style={styles.buttons}>
                <TouchableOpacity style={[styles.btn, styles.viewBtn]} onPress={() => handleView(item.subject_id, item.subject_name)}>
                  <Ionicons name="eye-outline" size={16} color="#4F46E5" />
                  <Text style={styles.viewBtnText}>عرض</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => openEditModal(item)}>
                  <Ionicons name="create-outline" size={16} color="#F59E0B" />
                  <Text style={styles.editBtnText}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => handleDelete(item.id, item.title)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Edit Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل الامتحان</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>العنوان</Text>
              <TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData({...formData, title: t})} textAlign="right" />
              
              <Text style={styles.label}>السنة</Text>
              <TextInput style={styles.input} value={formData.year} onChangeText={t => setFormData({...formData, year: t})} keyboardType="numeric" textAlign="right" />
              
              <Text style={styles.label}>المادة</Text>
              <View style={styles.pickerContainer}>
                {subjects.map(s => (
                  <TouchableOpacity key={s.id} style={[styles.pickerOption, formData.subject_id === s.id && styles.pickerOptionActive]} onPress={() => setFormData({...formData, subject_id: s.id})}>
                    <Text style={[styles.pickerText, formData.subject_id === s.id && styles.pickerTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>الدور</Text>
              <View style={styles.pickerContainer}>
                {Object.entries(ROUNDS).map(([key, label]) => (
                  <TouchableOpacity key={key} style={[styles.pickerOption, formData.round === key && styles.pickerOptionActive]} onPress={() => setFormData({...formData, round: key})}>
                    <Text style={[styles.pickerText, formData.round === key && styles.pickerTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>المدة (دقيقة)</Text>
              <TextInput style={styles.input} value={String(formData.duration)} onChangeText={t => setFormData({...formData, duration: parseInt(t) || 0})} keyboardType="numeric" textAlign="right" />
              
              <Text style={styles.label}>الدرجة الكلية</Text>
              <TextInput style={styles.input} value={String(formData.total_marks)} onChangeText={t => setFormData({...formData, total_marks: parseInt(t) || 0})} keyboardType="numeric" textAlign="right" />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                  <Text style={styles.saveBtnText}>حفظ</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4F46E5', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  filtersScroll: { maxHeight: 50 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { fontSize: 13, color: '#555' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  subjectText: { fontSize: 12, fontWeight: 'bold' },
  yearText: { fontSize: 12, color: '#999' },
  titleText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' },
  details: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  detailText: { fontSize: 12, color: '#666' },
  buttons: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  viewBtn: { backgroundColor: '#EEF2FF' },
  viewBtnText: { color: '#4F46E5', fontWeight: '600' },
  editBtn: { backgroundColor: '#FEF3C7' },
  editBtnText: { color: '#F59E0B', fontWeight: '600' },
  deleteBtn: { backgroundColor: '#FEE2E2' },
  deleteBtnText: { color: '#EF4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '90%', maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', textAlign: 'right', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', textAlign: 'right' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  pickerOptionActive: { backgroundColor: '#4F46E5' },
  pickerText: { fontSize: 13, color: '#555' },
  pickerTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#4F46E5', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
