import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { colors, fonts } from '../../lib/theme';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const maxWidth = isTablet ? 600 : '100%';

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={[styles.header, { paddingHorizontal: isTablet ? 48 : 24 }]}>
        <Image source={require('../../assets/sawabwhite.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={[styles.content, { maxWidth, width: '100%' }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { width: isTablet ? 100 : 80, height: isTablet ? 100 : 80, borderRadius: isTablet ? 50 : 40 }]}>
            <Text style={[styles.avatarText, { fontSize: isTablet ? 40 : 32 }]}>{user?.name?.[0]}</Text>
          </View>
          <Text style={[styles.name, { fontSize: isTablet ? 28 : 22 }]}>{user?.name}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role === 'ADMIN' ? 'مدير' : 'طالب'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{user?.username}</Text>
            <Text style={styles.infoLabel}>اسم المستخدم</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{user?.role === 'ADMIN' ? 'مدير' : 'طالب'}</Text>
            <Text style={styles.infoLabel}>الصلاحية</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { width: '100%', backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logo: { width: 120, height: 48 },
  content: { alignSelf: 'center', padding: 16 },
  avatarContainer: { alignItems: 'center', marginTop: -40, marginBottom: 24 },
  avatar: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white, marginBottom: 12 },
  avatarText: { color: colors.white, fontFamily: fonts.bold },
  name: { fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  username: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 8 },
  roleBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold },
  infoCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular },
  infoValue: { fontSize: 14, color: colors.text, fontFamily: fonts.bold },
  divider: { height: 1, backgroundColor: colors.border },
  logoutBtn: { backgroundColor: colors.error, borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold }
});