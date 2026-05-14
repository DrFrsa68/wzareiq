import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);

  const handleRegister = async () => {
    if (!name || !username || !password) return window.alert('ملأ جميع الحقول');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, username, password });
      setAuth(data.user, data.token);
      router.replace('/(tabs)/home');
    } catch (err) {
      window.alert(err.response?.data?.error || 'خطأ بالاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Image source={require('../../assets/sawabwhite.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>الوزاري يبدأ من صواب</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>حساب جديد</Text>
        <TextInput style={styles.input} placeholder="الاسم الكامل" value={name} onChangeText={setName} textAlign="right" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} placeholder="اسم المستخدم" value={username} onChangeText={setUsername} textAlign="right" autoCapitalize="none" placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.input} placeholder="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry textAlign="right" placeholderTextColor={colors.textMuted} />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'جاري التسجيل...' : 'تسجيل'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>عندك حساب؟ ادخل</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  logoArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  logo: { width: 160, height: 80, marginBottom: 12 },
  subtitle: { color: colors.primaryLight, fontSize: 16, fontFamily: fonts.regular },
  form: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'right', marginBottom: 24, fontFamily: fonts.bold },
  input: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border, fontFamily: fonts.regular, textAlign: 'right' },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { color: colors.white, fontSize: 18, fontFamily: fonts.bold },
  link: { textAlign: 'center', color: colors.primary, fontSize: 15, fontFamily: fonts.regular }
});