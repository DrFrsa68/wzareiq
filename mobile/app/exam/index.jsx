import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../lib/api';

const EXAM_TYPES = [
  { label: 'وزاري شامل', value: 'COMPREHENSIVE' },
  { label: 'حسب الفصول', value: 'BY_CHAPTER' }
];

const ROUND_LABELS = {
  FIRST: 'الدور الأول',
  SECOND: 'الدور الثاني',
  THIRD: 'الدور الثالث',
  PRELIMINARY: 'التمهيدي'
};

export default function SelectExam() {
  const { subjectId, subjectName } = useLocalSearchParams();
  const [type, setType] = useState(null);
  const [year, setYear] = useState(null);
  const [round, setRound] = useState(null);
  const [years, setYears] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (type) {
      setYear(null); setRound(null); setYears([]); setRounds([]);
      api.get(`/exams/years?subjectId=${subjectId}&type=${type}`)
        .then(r => setYears(r.data));
    }
  }, [type]);

  useEffect(() => {
    if (year) {
      setRound(null); setRounds([]);
      api.get(`/exams/rounds?subjectId=${subjectId}&type=${type}&year=${year}`)
        .then(r => setRounds(r.data));
    }
  }, [year]);

  const handleSearch = async () => {
    setLoading(true);
    const r = await api.get(`/exams/search?subjectId=${subjectId}&type=${type}&year=${year}&round=${round}`);
    setExams(r.data);
    setSearched(true);
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>→ رجوع</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{subjectName}</Text>

      <Text style={styles.label}>نوع الامتحان</Text>
      <View style={styles.row}>
        {EXAM_TYPES.map(t => (
          <TouchableOpacity key={t.value} style={[styles.chip, type === t.value && styles.chipActive]} onPress={() => setType(t.value)}>
            <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, !type && styles.disabled]}>السنة</Text>
      <View style={styles.row}>
        {years.map(y => (
          <TouchableOpacity key={y} style={[styles.chip, year === y && styles.chipActive]} onPress={() => type && setYear(y)}>
            <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
          </TouchableOpacity>
        ))}
        {type && years.length === 0 && <Text style={styles.empty}>لا توجد سنوات متوفرة</Text>}
      </View>

      <Text style={[styles.label, !year && styles.disabled]}>الدور</Text>
      <View style={styles.row}>
        {rounds.map(r => (
          <TouchableOpacity key={r} style={[styles.chip, round === r && styles.chipActive]} onPress={() => year && setRound(r)}>
            <Text style={[styles.chipText, round === r && styles.chipTextActive]}>{ROUND_LABELS[r]}</Text>
          </TouchableOpacity>
        ))}
        {year && rounds.length === 0 && <Text style={styles.empty}>لا توجد أدوار متوفرة</Text>}
      </View>

      <TouchableOpacity
        style={[styles.searchBtn, (!type || !year || !round) && styles.searchBtnDisabled]}
        onPress={handleSearch}
        disabled={!type || !year || !round}
      >
        <Text style={styles.searchBtnText}>🔍 بحث عن الامتحانات</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />}

      {searched && exams.length === 0 && !loading && (
        <Text style={styles.empty}>لا توجد امتحانات متوفرة</Text>
      )}

      {exams.map(exam => (
        <View key={exam.id} style={styles.examCard}>
          <Text style={styles.examTitle}>{exam.subject?.name} — {ROUND_LABELS[exam.round]} {exam.year}</Text>
          <Text style={styles.examMeta}>{exam._count?.questions} سؤال • {exam.duration} دقيقة</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push({ pathname: '/exam/session', params: { examId: exam.id } })}
          >
            <Text style={styles.startBtnText}>بدء الامتحان</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  back: { marginTop: 50, marginBottom: 8 },
  backText: { color: '#4F46E5', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'right', marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'right', marginBottom: 8, marginTop: 16 },
  disabled: { color: '#bbb' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { color: '#333', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  searchBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  searchBtnDisabled: { backgroundColor: '#c7c5ff' },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  examCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'right' },
  examMeta: { color: '#888', fontSize: 13, textAlign: 'right', marginTop: 4 },
  startBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  startBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#888', textAlign: 'center', marginTop: 16 }
});