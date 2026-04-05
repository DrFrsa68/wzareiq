import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>مدير</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحساب</Text>

        <View style={styles.item}>
          <Ionicons name="person-outline" size={20} color="#888" />
          <View style={styles.itemInfo}>
            <Text style={styles.itemLabel}>الاسم الكامل</Text>
            <Text style={styles.itemValue}>{user?.name}</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Ionicons name="at-outline" size={20} color="#888" />
          <View style={styles.itemInfo}>
            <Text style={styles.itemLabel}>اسم المستخدم</Text>
            <Text style={styles.itemValue}>{user?.username}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإعدادات</Text>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" />
          <View style={styles.itemInfo}>
            <Text style={styles.itemLabel}>تغيير كلمة المرور</Text>
          </View>
          <Ionicons name="chevron-back" size={16} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="notifications-outline" size={20} color="#888" />
          <View style={styles.itemInfo}>
            <Text style={styles.itemLabel}>الإشعارات</Text>
          </View>
          <Ionicons name="chevron-back" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, backgroundColor: '#fff', marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  username: { fontSize: 14, color: '#888', marginBottom: 8 },
  adminBadge: { backgroundColor: '#4F46E520', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  adminBadgeText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  section: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textAlign: 'right', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  item: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F5F5F7', gap: 12 },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 13, color: '#888', textAlign: 'right' },
  itemValue: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', textAlign: 'right', marginTop: 2 },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 14, height: 52, marginHorizontal: 20 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
});
