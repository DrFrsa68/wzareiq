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
      api.get(`/exams/years?subjectId=${subjectId}&type=${type}`).then(r => setYears(r.data));
    }
  }, [type]);

  useEffect(() => {
    if (year) {
      setRound(null); setRounds([]);
      api.get(`/exams/rounds?subjectId=${subjectId}&type=${type}&year=${year}`).then(r => setRounds(r.data));
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
        <Text style={[styles.title, { fontSize: isTablet ? 32 : 26 }]}>{subjectName}</Text>
        <Text style={styles.subtitle}>حدد نوع الامتحان والسنة والدور</Text>
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
          disabled={!type || !year || !round || loading}
        >
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.searchBtnText}>🔍 بحث عن الامتحانات</Text>}
        </TouchableOpacity>

        {searched && exams.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.empty}>لا توجد امتحانات متوفرة</Text>
          </View>
        )}

        {exams.map(exam => (
          <View key={exam.id} style={styles.examCard}>
            <View style={styles.examCardHeader}>
              <View style={styles.examBadge}>
                <Text style={styles.examBadgeText}>{exam._count?.questions} سؤال</Text>
              </View>
              <Text style={styles.examTitle}>{exam.subject?.name} — {ROUND_LABELS[exam.round]} {exam.year}</Text>
            </View>
            <Text style={styles.examMeta}>⏱ {exam.duration} دقيقة</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => router.push({ pathname: '/exam/session', params: { examId: exam.id } })}
            >
              <Text style={styles.startBtnText}>بدء الامتحان ←</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { width: '100%', backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 28 },
  back: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontFamily: fonts.regular },
  title: { fontFamily: fonts.bold, color: colors.white, marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.regular },
  body: { padding: 20, alignSelf: 'center' },
  label: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', marginBottom: 10, marginTop: 20 },
  disabled: { color: colors.border },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.regular },
  chipTextActive: { color: colors.white, fontFamily: fonts.bold },
  searchBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  searchBtnDisabled: { backgroundColor: colors.primaryLight },
  searchBtnText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold },
  emptyContainer: { alignItems: 'center', marginTop: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14 },
  examCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  examCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  examTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, flex: 1, textAlign: 'right' },
  examBadge: { backgroundColor: colors.primary + '15', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  examBadgeText: { fontSize: 12, color: colors.primary, fontFamily: fonts.bold },
  examMeta: { color: colors.textMuted, fontSize: 13, textAlign: 'right', fontFamily: fonts.regular, marginBottom: 12 },
  startBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  startBtnText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
});