import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://modest-trust-production-c992.up.railway.app/api';

export default function DebugSubmit({ sessionId }) {
  const [log, setLog] = useState('');

  const test = async () => {
    try {
      setLog('جاري الاختبار...\n');
      const token = await AsyncStorage.getItem('token');
      setLog(prev => prev + `Token: ${token ? 'موجود' : 'غير موجود'}\n`);
      setLog(prev => prev + `Session ID: ${sessionId}\n`);

      const res = await fetch(`${API_URL}/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });

      setLog(prev => prev + `Status: ${res.status}\n`);
      const data = await res.json();
      setLog(prev => prev + `Response: ${JSON.stringify(data, null, 2)}\n`);
    } catch (err) {
      setLog(prev => prev + `Error: ${err.message}\n`);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={test}>
        <Text style={styles.btnText}>اختبار التسليم</Text>
      </TouchableOpacity>
      <ScrollView style={styles.log}>
        <Text style={styles.logText}>{log}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#1a1a1a', margin: 16, borderRadius: 12 },
  btn: { backgroundColor: '#4F46E5', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  log: { maxHeight: 200 },
  logText: { color: '#00ff00', fontSize: 12, fontFamily: 'monospace' },
});
