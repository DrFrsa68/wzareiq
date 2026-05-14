import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';

export default function Profile() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.[0]}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.username}>@{user?.username}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', paddingTop: 80 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1D52D8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  username: { fontSize: 15, color: '#888', marginTop: 4, marginBottom: 40 },
  logoutBtn: { backgroundColor: '#ff4757', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});