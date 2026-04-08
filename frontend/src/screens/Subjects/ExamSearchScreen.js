import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { examsAPI } from '../../services/api';

const EXAM_TYPES = [
  { label: 'وزاري شامل', value: 'comprehensive', icon: 'school', desc: 'جميع الفصول' },
  { label: 'حسب الفصول', value: 'chapter', icon: 'list', desc: 'فصل محدد' },
];

const ROUNDS = {
  'first': 'الدور الأول',
  'second': 'الدور الثاني',
  'third': 'الدور الثالث',
  'preliminary': 'التمهيدي',
};

const SUBJECT_STYLES = {
  'الرياضيات':     { color: '#4F46E5' },
  'الفيزياء':      { color: '#0EA5E9' },
  'الكيمياء':      { color: '#10B981' },
  'الأحياء':       { color: '#22C55E' },
  'اللغة العربية': { color: '#F59E0B' },
  'اللغة الإنجليزية': { color: '#EF4444' },
  'الإسلامية':     { color: '#8B5CF6' },
};

export default function ExamSearchScreen({ route, navigation }) {
  const { subject } = route.params;
  const subjectColor = SUBJECT_STYLES[subject.name]?.color || '#4F46E5';

  const [examType, setExamType] = useState(null);
  const [year, setYear] = useState(null);
  const [round, setRound] = useState(null);
  const [years, setYears] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (examType) {
      setYear(null); setRound(null); setYears([]); setRounds([]); setResults([]);
      loadYears();
    }
  }, [examType]);

  useEffect(() => {
    if (year) { setRound(null); setRounds([]); loadRounds(); }
  }, [year]);

  const loadYears = async () => {
    try {
      const res = await examsAPI.getYears(subject.id, examType);
      setYears(res.data);
    } catch (err) { console.log(err); }
  };

  const loadRounds = async () => {
    try {
      const res = await examsAPI.getRounds(subject.id, examType, year);
      setRounds(res.data);
    } catch (err) { console.log(err); }
  };

  const handleSearch = async () => {
    setLoading(true); setSearched(true);
    try {
      const res = await examsAPI.search({ subject_id: subject.id, exam_type: examType, year, round });
      setResults(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const canSearch = examType && year && round;

  const StepHeader = ({ num, title, active, done }) => (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <View style={[styles.stepBadge,
        done ? { backgroundColor: '#10B981' } :
        active ? { backgroundColor: subjectColor } :
        { backgroundColor: '#E5E7EB' }]}>
        {done
          ? <Ionicons name="checkmark" size={14} color="#fff" />
          : <Text style={[styles.stepNum, { color: active ? '#fff' : '#9CA3AF' }]}>{num}</Text>
        }
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: subjectColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {/* تغيير من chevron-forward إلى chevron-back للRTL */}
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{subject.name}</Text>
          <Text style={styles.headerSub}>اختر نوع الامتحان والسنة والدور</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Step 1: نوع الامتحان */}
          <View style={styles.section}>
            <StepHeader num="1" title="نوع الامتحان" active={!examType} done={!!examType} />
            <View style={styles.typeCards}>
              {EXAM_TYPES.map((t) => (
                <TouchableOpacity key={t.value}
                  style={[styles.typeCard, examType === t.value && { borderColor: subjectColor, backgroundColor: subjectColor + '08' }]}
                  onPress={() => setExamType(t.value)}>
                  <View style={[styles.typeIcon, { backgroundColor: examType === t.value ? subjectColor + '20' : '#F3F4F6' }]}>
                    <Ionicons name={t.icon} size={22} color={examType === t.value ? subjectColor : '#9CA3AF'} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeLabel, examType === t.value && { color: subjectColor }]}>{t.label}</Text>
                    <Text style={styles.typeDesc}>{t.desc}</Text>
                  </View>
                  {examType === t.value && <Ionicons name="checkmark-circle" size={22} color={subjectColor} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 2: السنة */}
          <View style={[styles.section, !examType && styles.disabled]}>
            <StepHeader num="2" title="السنة الدراسية" active={!!examType && !year} done={!!year} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                {years.length === 0 && examType && (
                  <Text style={styles.noData}>لا توجد سنوات متاحة</Text>
                )}
                {years.map((y) => (
                  <TouchableOpacity key={y}
                    style={[styles.chip, year === y && { backgroundColor: subjectColor, borderColor: subjectColor }]}
                    onPress={() => examType && setYear(y)}>
                    <Text style={[styles.chipText, year === y && { color: '#fff' }]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Step 3: الدور */}
          <View style={[styles.section, !year && styles.disabled]}>
            <StepHeader num="3" title="الدور" active={!!year && !round} done={!!round} />
            <View style={styles.chipsRow}>
              {rounds.length === 0 && year && (
                <Text style={styles.noData}>لا توجد أدوار متاحة</Text>
              )}
              {rounds.map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.chip, round === r && { backgroundColor: subjectColor, borderColor: subjectColor }]}
                  onPress={() => year && setRound(r)}>
                  <Text style={[styles.chipText, round === r && { color: '#fff' }]}>{ROUNDS[r] || r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* زر البحث */}
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: canSearch ? subjectColor : '#E5E7EB' }]}
            onPress={handleSearch}
            disabled={!canSearch || loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="search" size={20} color={canSearch ? '#fff' : '#9CA3AF'} style={{ marginRight: 8 }} />
                  <Text style={[styles.searchBtnText, { color: canSearch ? '#fff' : '#9CA3AF' }]}>
                    البحث عن الامتحانات
                  </Text>
                </>
            }
          </TouchableOpacity>

          {/* النتائج */}
          {searched && !loading && (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>
                {results.length > 0 ? `${results.length} امتحان متوفر` : 'لا توجد امتحانات لهذا الاختيار'}
              </Text>
              {results.map((exam) => (
                <TouchableOpacity key={exam.id} style={styles.examCard}
                  onPress={() => navigation.navigate('Exam', { exam })}>
                  <View style={styles.examCardLeft}>
                    <View style={[styles.examCardIcon, { backgroundColor: subjectColor + '15' }]}>
                      <Ionicons name="document-text" size={24} color={subjectColor} />
                    </View>
                    <View style={styles.examInfo}>
                      <Text style={styles.examTitle}>{exam.title}</Text>
                      <Text style={styles.examMeta}>
                        {exam.year} • {ROUNDS[exam.round] || exam.round} • {exam.duration} دقيقة
                      </Text>
                      <View style={[styles.examBadge, { backgroundColor: subjectColor + '15' }]}>
                        <Text style={[styles.examBadgeText, { color: subjectColor }]}>
                          {exam.total_marks} درجة
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.startBtn, { backgroundColor: subjectColor }]}>
                    <Ionicons name="play" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'right' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginTop: 2 },
  scroll: { flex: 1 },
  section: { margin: 16, marginBottom: 4 },
  disabled: { opacity: 0.4 },
  stepHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12
  },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B' },
  stepBadge: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center'
  },
  stepNum: { fontSize: 13, fontWeight: '800' },
  typeCards: { gap: 10 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', textAlign: 'right' },
  typeDesc: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E7EB'
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#555' },
  noData: { fontSize: 13, color: '#aaa', textAlign: 'right' },
  searchBtn: {
    margin: 16, borderRadius: 16, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 20
  },
  searchBtnText: { fontSize: 16, fontWeight: '700' },
  results: { marginHorizontal: 16 },
  resultsTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B', textAlign: 'right', marginBottom: 12 },
  examCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
  },
  examCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  examCardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  examInfo: { flex: 1 },
  examTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', textAlign: 'right', marginBottom: 4 },
  examMeta: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginBottom: 6 },
  examBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  examBadgeText: { fontSize: 12, fontWeight: '700' },
  startBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
});