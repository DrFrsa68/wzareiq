import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ImageUploader({ imageUri, onImageSelected, onRemove }) {
  const inputRef = useRef(null);

  const handleWebUpload = () => {
    if (Platform.OS === 'web') {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Alert.alert('تنبيه', 'حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }
    const uri = URL.createObjectURL(file);
    onImageSelected({ uri, file, type: file.type, name: file.name });
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.changeBtn} onPress={handleWebUpload}>
              <Ionicons name="refresh-outline" size={16} color="#4F46E5" />
              <Text style={styles.changeBtnText}>تغيير الصورة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadArea} onPress={handleWebUpload}>
          <Ionicons name="cloud-upload-outline" size={36} color="#4F46E5" />
          <Text style={styles.uploadText}>اضغط لرفع صورة الجواب</Text>
          <Text style={styles.uploadSub}>JPG, PNG — حتى 5MB</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  uploadArea: {
    borderWidth: 2, borderColor: '#4F46E5', borderStyle: 'dashed',
    borderRadius: 16, padding: 32, alignItems: 'center', gap: 8,
    backgroundColor: '#4F46E508'
  },
  uploadText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  uploadSub: { fontSize: 12, color: '#888' },
  previewContainer: { borderWidth: 2, borderColor: '#4F46E5', borderRadius: 16, overflow: 'hidden' },
  preview: { width: '100%', height: 250 },
  previewActions: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB'
  },
  changeBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  changeBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '600' },
  removeBtn: { backgroundColor: '#FEE2E2', borderRadius: 20, padding: 8 },
});
