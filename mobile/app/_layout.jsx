import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'IBMPlexArabic-Regular': { uri: 'https://fonts.gstatic.com/s/ibmplexarabic/v5/Qw3CZRtWPQCuMeDDhIuFBb-RDKhMoFP9.woff2' },
    'IBMPlexArabic-Bold': { uri: 'https://fonts.gstatic.com/s/ibmplexarabic/v5/Qw3NZRtWPQCuMeDDhIuFBb-RDKhkFBP9gFv2.woff2' },
  });

  if (!fontsLoaded) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D52D8' }}>
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