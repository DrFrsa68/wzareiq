import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screen = {
  width,
  height,
  isTablet: width >= 768,
  isDesktop: width >= 1024,
};

export const responsive = {
  // عدد الأعمدة حسب حجم الشاشة
  columns: width >= 1024 ? 4 : width >= 768 ? 3 : 2,
  
  // padding حسب حجم الشاشة
  padding: width >= 768 ? 32 : 16,
  
  // حجم الخط
  fontSize: {
    xs: width >= 768 ? 13 : 11,
    sm: width >= 768 ? 15 : 13,
    md: width >= 768 ? 18 : 15,
    lg: width >= 768 ? 22 : 18,
    xl: width >= 768 ? 28 : 22,
    xxl: width >= 768 ? 36 : 28,
  },

  // عرض المحتوى الأقصى
  maxWidth: width >= 1024 ? 900 : '100%',
};