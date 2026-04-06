import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ])
    ]).start();
  }, []);

  const showError = (msg) => {
    setError(msg);
    Animated.sequence([
      Animated.timing(errorOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ])
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim()) return showError('أدخل اسم المستخدم');
    if (!password) return showError('أدخل كلمة المرور');
    if (password.length < 6) return showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');

    setLoading(true);
    try {
      await login(username.trim().toLowerCase(), password);
    } catch (err) {
      showError(err.response?.data?.error || 'اسم المستخدم أو كلمة المرور غلط');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Background Circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBox}>
            <Ionicons name="school" size={44} color="#fff" />
          </View>
          <Text style={styles.appName}>وزاري</Text>
          <Text style={styles.appSlogan}>منصة الامتحانات الوزارية العراقية</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.form, {
          transform: [{ translateY: slideAnim }, { translateX: shakeAnim }]
        }]}>
          {/* Error */}
          {error ? (
            <Animated.View style={[styles.errorBox, { opacity: errorOpacity }]}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Username */}
          <View style={[styles.inputBox, focusedField === 'username' && styles.inputBoxFocused]}>
            <Ionicons name="person-outline" size={20}
              color={focusedField === 'username' ? '#4F46E5' : '#aaa'} />
            <TextInput
              style={styles.input}
              placeholder="اسم المستخدم"
              placeholderTextColor="#bbb"
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              textAlign="right"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputBox, focusedField === 'password' && styles.inputBoxFocused]}>
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20}
                color={focusedField === 'password' ? '#4F46E5' : '#aaa'} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPass}
              textAlign="right"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnLoading]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={22} color="#fff" style={{ marginLeft: 8 }} />
                <Text style={styles.btnText}>تسجيل الدخول</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}>
            <Text style={styles.registerText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF' },
  circle1: {
    position: 'absolute', top: -80, right: -80,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#4F46E520'
  },
  circle2: {
    position: 'absolute', top: 100, left: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#818CF820'
  },
  circle3: {
    position: 'absolute', bottom: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#4F46E515'
  },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12
  },
  appName: { fontSize: 36, fontWeight: '900', color: '#1E1B4B', letterSpacing: -1 },
  appSlogan: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  form: { gap: 14 },
  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA'
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, height: 56,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
  },
  inputBoxFocused: { borderColor: '#4F46E5', shadowColor: '#4F46E5', shadowOpacity: 0.15 },
  input: { flex: 1, fontSize: 15, color: '#1E1B4B', marginHorizontal: 10 },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 16, height: 56,
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, marginTop: 4
  },
  btnLoading: { opacity: 0.8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 13 },
  registerBtn: {
    borderWidth: 2, borderColor: '#4F46E5', borderRadius: 16,
    height: 56, justifyContent: 'center', alignItems: 'center'
  },
  registerText: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
});
