import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const maxWidth = isTablet ? 700 : '100%';

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
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.header, { paddingHorizontal: isTablet ? 48 : 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>→ رجوع</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: isTablet ? 36 : 28 }]}>{subjectName}</Text>
      </View>

      <View style={[styles.body, { maxWidth, width: '100%' }]}>
        <Text style={styles.label}>نوع الامتحان</Text>
        <View style={styles.row}>
          {EXAM_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, type === t.value && styles.chipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, !type && styles.disabled]}>السنة</Text>
        <View style={styles.row}>
          {years.map(y => (
            <TouchableOpacity
              key={y}
              style={[styles.chip, year === y && styles.chipActive]}
              onPress={() => type && setYear(y)}
            >
              <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
          {type && years.length === 0 && <Text style={styles.empty}>لا توجد سنوات متوفرة</Text>}
        </View>

        <Text style={[styles.label, !year && styles.disabled]}>الدور</Text>
        <View style={styles.row}>
          {rounds.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, round === r && styles.chipActive]}
              onPress={() => year && setRound(r)}
            >
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

        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
        {searched && exams.length === 0 && !loading && <Text style={styles.empty}>لا توجد امتحانات متوفرة</Text>}

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { width: '100%', backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 24 },
  back: { marginBottom: 8 },
  backText: { color: colors.primaryLight, fontSize: 16, fontFamily: fonts.regular },
  title: { fontFamily: fonts.bold, color: colors.white },
  body: { padding: 20, alignSelf: 'center' },
  label: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', marginBottom: 8, marginTop: 16 },
  disabled: { color: colors.border },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.regular },
  chipTextActive: { color: colors.white, fontFamily: fonts.bold },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  searchBtnDisabled: { backgroundColor: colors.primaryLight },
  searchBtnText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold },
  examCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  examTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, textAlign: 'right' },
  examMeta: { color: colors.textMuted, fontSize: 13, textAlign: 'right', marginTop: 4, fontFamily: fonts.regular },
  startBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  startBtnText: { color: colors.white, fontFamily: fonts.bold },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 16, fontFamily: fonts.regular }
});