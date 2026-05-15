import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../lib/theme';

export default function Index() {
  const { token, initialized, initAuth } = useAuthStore();

  useEffect(() => {
    if (!initialized) initAuth();
  }, []);

  if (!initialized) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );

  return <Redirect href={token ? '/(tabs)/home' : '/(auth)/login'} />;
}