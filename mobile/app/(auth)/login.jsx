import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, Alert, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const showAlert = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('خطأ', msg);
  };

  const handleLogin = async () => {
    if (!username || !password) return showAlert('ملأ جميع الحقول');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      await setAuth(data.user, data.token);
      router.replace('/(tabs)/home');
    } catch (err) {
      showAlert(err.response?.data?.error || 'خطأ بالاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.logoArea, { paddingTop: isTablet ? 80 : 60 }]}>
        <Image source={require('../../assets/sawabwhite.png')} style={[styles.logo, { width: isTablet ? 200 : 160, height: isTablet ? 100 : 80 }]} resizeMode="contain" />
        <Text style={[styles.subtitle, { fontSize: isTablet ? 18 : 16 }]}>الوزاري يبدأ من صواب</Text>
      </View>

      <View style={[styles.form, { padding: isTablet ? 48 : 32 }]}>
        <View style={{ maxWidth: isTablet ? 500 : '100%', width: '100%', alignSelf: 'center' }}>
          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم"
            value={username}
            onChangeText={setUsername}
            textAlign="right"
            autoCapitalize="none"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'جاري الدخول...' : 'دخول'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>ما عندك حساب؟ سجل الحين</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  logoArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { marginBottom: 12 },
  subtitle: { color: colors.primaryLight, fontFamily: fonts.regular },
  form: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 48 },
  input: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border, fontFamily: fonts.regular, textAlign: 'right' },
  btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { color: colors.white, fontSize: 18, fontFamily: fonts.bold },
  link: { textAlign: 'center', color: colors.primary, fontSize: 15, fontFamily: fonts.regular }
});