import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validateUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) return showError('أدخل اسمك الكامل');
    if (name.trim().length < 2) return showError('الاسم قصير جداً');
    if (!username.trim()) return showError('أدخل اسم المستخدم');
    if (!validateUsername(username.trim())) return showError('اسم المستخدم: أحرف إنجليزية وأرقام فقط (3-20 حرف)');
    if (!password) return showError('أدخل كلمة المرور');
    if (password.length < 6) return showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (password !== confirmPassword) return showError('كلمة المرور غير متطابقة');

    setLoading(true);
    try {
      await register(name.trim(), username.trim().toLowerCase(), password);
    } catch (err) {
      showError(err.response?.data?.error || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: 'ضعيف', color: '#EF4444', width: '30%' };
    if (password.length < 8) return { label: 'متوسط', color: '#F59E0B', width: '60%' };
    return { label: 'قوي', color: '#10B981', width: '100%' };
  };

  const strength = getPasswordStrength();

  const fields = [
    { key: 'name', placeholder: 'الاسم الكامل', icon: 'person-outline', value: name, setValue: setName, secure: false },
    { key: 'username', placeholder: 'اسم المستخدم (إنجليزي)', icon: 'at-outline', value: username, setValue: setUsername, secure: false },
    { key: 'password', placeholder: 'كلمة المرور', icon: showPass ? 'eye-off-outline' : 'eye-outline', value: password, setValue: setPassword, secure: !showPass, isPassword: true },
    { key: 'confirm', placeholder: 'تأكيد كلمة المرور', icon: 'lock-closed-outline', value: confirmPassword, setValue: setConfirmPassword, secure: !showPass },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoBox}>
              <Ionicons name="school" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>إنشاء حساب</Text>
            <Text style={styles.appSlogan}>انضم لمنصة الامتحانات الوزارية</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {fields.map((field) => (
              <View key={field.key}>
                <View style={[styles.inputBox, focusedField === field.key && styles.inputBoxFocused]}>
                  <TouchableOpacity onPress={field.isPassword ? () => setShowPass(!showPass) : undefined}>
                    <Ionicons name={field.icon} size={20}
                      color={focusedField === field.key ? '#4F46E5' : '#aaa'} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor="#bbb"
                    value={field.value}
                    onChangeText={(t) => { field.setValue(t); setError(''); }}
                    secureTextEntry={field.secure}
                    textAlign="right"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField(field.key)}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {/* Password Strength */}
                {field.key === 'password' && strength && (
                  <View style={styles.strengthContainer}>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                    </View>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{ marginLeft: 8 }} />
                  <Text style={styles.btnText}>إنشاء الحساب</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}>
              <Text style={styles.loginText}>لدي حساب — تسجيل الدخول</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF' },
  circle1: { position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: '#4F46E520' },
  circle2: { position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#818CF820' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  appName: { fontSize: 30, fontWeight: '900', color: '#1E1B4B', letterSpacing: -0.5 },
  appSlogan: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  form: { gap: 12 },
  errorBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, height: 54, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, outlineStyle: 'none' },
  inputBoxFocused: { borderColor: '#4F46E5', shadowColor: '#4F46E5', shadowOpacity: 0.15 },
  input: { flex: 1, fontSize: 15, color: '#1E1B4B', marginHorizontal: 10, outlineStyle: 'none' },
  strengthContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 6, paddingHorizontal: 4 },
  strengthLabel: { fontSize: 12, fontWeight: '700', width: 40, textAlign: 'right' },
  strengthBar: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  strengthFill: { height: 4, borderRadius: 2 },
  btn: { backgroundColor: '#4F46E5', borderRadius: 16, height: 56, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, marginTop: 4 },
  btnLoading: { opacity: 0.8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 13 },
  loginBtn: { borderWidth: 2, borderColor: '#4F46E5', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center' },
  loginText: { color: '#4F46E5', fontSize: 15, fontWeight: '700' },
});
