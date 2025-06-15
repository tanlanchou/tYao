import { Dimensions, Platform } from 'react-native';

// 检查是否为Web环境
export const isWeb = Platform.OS === 'web';

// 检查是否为移动设备浏览器
export const isMobileBrowser = (): boolean => {
  if (!isWeb) {
    // 如果不是Web环境，则根据平台判断
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }
  
  // Web环境下，通过窗口宽度判断是否为移动设备
  // 也可以通过userAgent判断，但在React Native Web中不太可靠
  const { width, height } = Dimensions.get('window');
  return width < 768; // 通常768px以下被认为是移动设备
};

// 检查是否为桌面浏览器
export const isDesktopBrowser = (): boolean => {
  return isWeb && !isMobileBrowser();
}; 