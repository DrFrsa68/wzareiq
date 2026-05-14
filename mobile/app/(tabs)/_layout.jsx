import { Tabs } from 'expo-router';
import { Home, BookOpen, History, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f0f0f0', height: 60 },
      tabBarActiveTintColor: '#1D52D8',
      tabBarInactiveTintColor: '#999',
      tabBarLabelStyle: { fontSize: 11, marginBottom: 6 }
    }}>
      <Tabs.Screen name="home" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="subjects" options={{ title: 'المواد', tabBarIcon: ({ color }) => <BookOpen size={22} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'السجل', tabBarIcon: ({ color }) => <History size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}