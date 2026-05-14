import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'IBMPlexArabic-Regular': require('../assets/fonts/IBMPlexArabic-Regular.ttf'),
    'IBMPlexArabic-Bold': require('../assets/fonts/IBMPlexArabic-Bold.ttf'),
  });

  if (!fontsLoaded) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="exam" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}