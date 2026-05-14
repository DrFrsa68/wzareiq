import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { colors, fonts } from '../../lib/theme';

export default function Profile() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/sawabwhite.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'ADMIN' ? 'مدير' : 'طالب'}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logo: { width: 100, height: 40 },
  avatarContainer: { alignItems: 'center', marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white, marginBottom: 12 },
  avatarText: { fontSize: 32, color: colors.white, fontFamily: fonts.bold },
  name: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  username: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 8 },
  roleBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold },
  body: { padding: 24, marginTop: 32 },
  logoutBtn: { backgroundColor: colors.error, borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold }
});