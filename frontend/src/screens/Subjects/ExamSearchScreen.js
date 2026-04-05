import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { examsAPI } from '../../services/api';

const EXAM_TYPES = [
  { label: 'وزاري شامل', value: 'comprehensive' },
  { label: 'حسب الفصول', value: 'chapter' },
];

const ROUNDS = {
  'first': 'الدور الأول',
  'second': 'الدور الثاني',
  'third': 'الدور الثالث',
  'preliminary': 'التمهيدي',
};

export default function ExamSearchScreen({ route, navigation }) {
  const { subject } = route.params;
  const [examType, setExamType] = useState(null);
  const [year, setYear] = useState(null);
  const [round, setRound] = useState(null);
  const [years, setYears] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (examType) {
      setYear(null); setRound(null); setYears([]); setRounds([]); setResults([]);
      loadYears();
    }
  }, [examType]);

  useEffect(() => {
    if (year) {
      setRound(null); setRounds([]);
      loadRounds();
    }
  }, [year]);

  const loadYears = async () => {
    try {
      const res = await examsAPI.getYears(subject.id, examType);
      setYears(res.data);
    } catch (err) { Alert.alert('خطأ', 'تعذر تحميل السنوات'); }
  };

  const loadRounds = async () => {
    try {
      const res = await examsAPI.getRounds(subject.id, examType, year);
      setRounds(res.data);
    } catch (err) { Alert.alert('خطأ', 'تعذر تحميل الأدوار'); }
  };

  const handleSearch = async () => {
    setLoading(true); setSearched(true);
    try {
      const res = await examsAPI.search({ subject_id: subject.id, exam_type: examType, year, round });
      setResults(res.data);
    } catch (err) {
      Alert.alert('خطأ', 'تعذر البحث');
    } finally { setLoading(false); }
  };

  const canSearch = examType && year && round;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.title}>{subject.name}</Text>
      </View>

      {/* نوع الامتحان */}
      <View style={styles.section}>
        <Text style={styles.label}>نوع الامتحان</Text>
        <View style={styles.optionsRow}>
          {EXAM_TYPES.map((t) => (
            <TouchableOpacity key={t.value}
              style={[styles.option, examType === t.value && styles.optionActive]}
              onPress={() => setExamType(t.value)}>
              <Text style={[styles.optionText, examType === t.value && styles.optionTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* السنة */}
      <View style={[styles.section, !examType && styles.disabled]}>
        <Text style={styles.label}>السنة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.optionsRow}>
            {years.map((y) => (
              <TouchableOpacity key={y}
                style={[styles.option, year === y && styles.optionActive]}
                onPress={() => examType && setYear(y)}>
                <Text style={[styles.optionText, year === y && styles.optionTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
            {examType && years.length === 0 && (
              <Text style={styles.noData}>لا توجد سنوات متاحة</Text>
            )}
          </View>
        </ScrollView>
      </View>

      {/* الدور */}
      <View style={[styles.section, !year && styles.disabled]}>
        <Text style={styles.label}>الدور</Text>
        <View style={styles.optionsRow}>
          {rounds.map((r) => (
            <TouchableOpacity key={r}
              style={[styles.option, round === r && styles.optionActive]}
              onPress={() => year && setRound(r)}>
              <Text style={[styles.optionText, round === r && styles.optionTextActive]}>
                {ROUNDS[r] || r}
              </Text>
            </TouchableOpacity>
          ))}
          {year && rounds.length === 0 && (
            <Text style={styles.noData}>لا توجد أدوار متاحة</Text>
          )}
        </View>
      </View>

      {/* زر البحث */}
      <TouchableOpacity
        style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
        onPress={handleSearch}
        disabled={!canSearch || loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Ionicons name="search" size={20} color="#fff" style={{ marginLeft: 8 }} />
              <Text style={styles.searchBtnText}>البحث عن الامتحانات المتوفرة</Text>
            </>
        }
      </TouchableOpacity>

      {/* النتائج */}
      {searched && !loading && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>
            {results.length > 0 ? `${results.length} امتحان متوفر` : 'لا توجد امتحانات'}
          </Text>
          {results.map((exam) => (
            <View key={exam.id} style={styles.examCard}>
              <View style={styles.examInfo}>
                <Text style={styles.examTitle}>{exam.title}</Text>
                <Text style={styles.examMeta}>
                  {exam.year} • {ROUNDS[exam.round] || exam.round} • {exam.duration} دقيقة
                </Text>
                <Text style={styles.examMarks}>الدرجة الكاملة: {exam.total_marks}</Text>
              </View>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('Exam', { exam })}>
                <Text style={styles.startBtnText}>بدء الامتحان</Text>
                <Ionicons name="play" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  section: { marginHorizontal: 20, marginBottom: 20 },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginBottom: 10 },
  optionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  option: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB' },
  optionActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#555' },
  optionTextActive: { color: '#fff' },
  noData: { fontSize: 13, color: '#aaa', textAlign: 'right' },
  searchBtn: { marginHorizontal: 20, backgroundColor: '#4F46E5', borderRadius: 14, height: 54, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  searchBtnDisabled: { backgroundColor: '#ccc', shadowOpacity: 0 },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  results: { marginHorizontal: 20 },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginBottom: 12 },
  examCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  examInfo: { marginBottom: 12 },
  examTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', textAlign: 'right', marginBottom: 4 },
  examMeta: { fontSize: 13, color: '#888', textAlign: 'right', marginBottom: 4 },
  examMarks: { fontSize: 13, color: '#4F46E5', textAlign: 'right', fontWeight: '600' },
  startBtn: { backgroundColor: '#4F46E5', borderRadius: 12, height: 44, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
