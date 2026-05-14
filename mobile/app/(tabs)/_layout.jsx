import { Tabs } from 'expo-router';
import { Home, BookOpen, User } from 'lucide-react-native';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f0f0f0', height: 60 },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: '#999',
      tabBarLabelStyle: { fontSize: 11, marginBottom: 6 }
    }}>
      <Tabs.Screen name="home" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="subjects" options={{ title: 'المواد', tabBarIcon: ({ color }) => <BookOpen size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}