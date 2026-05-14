import { View, Text, StyleSheet } from 'react-native';

export default function Subjects() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>المواد الدراسية</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, color: '#333' }
});