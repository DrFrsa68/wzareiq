import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://modest-trust-production-c992.up.railway.app/api';

export const submitExam = async (sessionId) => {
  const token = await AsyncStorage.getItem('token');
  console.log('Submitting session:', sessionId, 'token:', token?.slice(0, 20));
  
  if (!sessionId) throw new Error('Session ID فارغ!');
  if (!token) throw new Error('Token فارغ!');

  const res = await fetch(`${API_URL}/sessions/${sessionId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  const text = await res.text();
  console.log('Raw response:', text.slice(0, 200));
  
  if (!res.ok) throw new Error(`Server error: ${res.status} - ${text}`);
  
  return JSON.parse(text);
};
