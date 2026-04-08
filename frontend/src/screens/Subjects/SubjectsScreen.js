import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated, Dimensions, I18nManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subjectsAPI } from '../../services/api';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

const SUBJECT_STYLES = {
  'الرياضيات':     { icon: 'calculator',  color: '#4F46E5', bg: '#EEF2FF' },
  'الفيزياء':      { icon: 'planet',       color: '#0EA5E9', bg: '#E0F2FE' },
  'الكيمياء':      { icon: 'flask',        color: '#10B981', bg: '#D1FAE5' },
  'الأحياء':       { icon: 'leaf',         color: '#22C55E', bg: '#DCFCE7' },
  'اللغة العربية': { icon: 'language',     color: '#F59E0B', bg: '#FEF3C7' },
  'اللغة الإنجليزية': { icon: 'globe',    color: '#EF4444', bg: '#FEE2E2' },
  'الإسلامية':     { icon: 'moon',         color: '#8B5CF6', bg: '#EDE9FE' },
};

export default function SubjectsScreen({ navigation }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getStyle = (name) => SUBJECT_STYLES[name] || { icon: 'book', color: '#4F46E5', bg: '#EEF2FF' };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  if (subjects.length === 0) return (
    <View style={styles.center}>
      <Ionicons name="book-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>لا توجد مواد متاحة</Text>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const s = getStyle(item.name);
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
        <TouchableOpacity
          style={[styles.card, { borderColor: s.color + '40' }]}
          onPress={() => navigation.navigate('ExamSearch', { subject: item })}
          activeOpacity={0.85}>
          
          {/* Color Bar */}
          <View style={[styles.colorBar, { backgroundColor: s.color }]} />
          
          {/* Icon */}
          <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={30} color={s.color} />
          </View>

          {/* Name */}
          <Text style={styles.subjectName}>{item.name}</Text>

          {/* Arrow - تغيير من arrow-back إلى arrow-forward للRTL */}
          <View style={[styles.arrow, { backgroundColor: s.color }]}>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>المواد الدراسية</Text>
          <Text style={styles.subtitle}>اختر المادة وابدأ امتحانك</Text>
        </View>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  header: { marginBottom: 8 },
  headerBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 140,
    backgroundColor: '#4F46E5',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32
  },
  headerContent: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'right' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  card: {
    width: CARD_SIZE, backgroundColor: '#fff',
    borderRadius: 20, padding: 18,
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
    overflow: 'hidden'
  },
  colorBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    borderTopLeftRadius: 20, borderTopRightRadius: 20
  },
  iconBox: {
    width: 60, height: 60, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, alignSelf: 'flex-end'
  },
  subjectName: {
    fontSize: 15, fontWeight: '800', color: '#1E1B4B',
    textAlign: 'right', marginBottom: 14
  },
  arrow: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-start'
  },
});