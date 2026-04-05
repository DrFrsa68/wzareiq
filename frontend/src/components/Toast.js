import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function Toast({ message, type = 'info', onHide }) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onHide && onHide());
  }, []);

  const colors = { info: '#4F46E5', error: '#EF4444', success: '#10B981' };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors[type], opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 60, left: 20, right: 20, borderRadius: 12, padding: 16, zIndex: 9999 },
  text: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 14 },
});
