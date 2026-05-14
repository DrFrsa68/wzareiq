import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);

  const handleRegister = async () => {
    if (!name || !username || !password) return Alert.alert('خطأ', 'ملأ جميع الحقول');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, username, password });
      setAuth(data.user, data.token);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || 'خطأ بالاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>حساب جديد</Text>

      <TextInput style={styles.input} placeholder="الاسم الكامل" value={name} onChangeText={setName} textAlign="right" />
      <TextInput style={styles.input} placeholder="اسم المستخدم" value={username} onChangeText={setUsername} textAlign="right" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry textAlign="right" />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'جاري التسجيل...' : 'تسجيل'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>عندك حساب؟ ادخل</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', marginBottom: 48 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  btn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#4F46E5', fontSize: 15 }
});
