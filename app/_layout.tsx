import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import NotificationPermissionScreen from './components/NotificationPermissionScreen';
import { isBrowser, isBrowserNotificationSupported, startBrowserNotificationService, stopBrowserNotificationService } from './services/browserNotifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // 为Android设置通知渠道
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: '默认',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    
    // 在浏览器环境中检查通知权限
    if (isBrowser) {
      // 如果浏览器不支持通知功能，设置为false
      if (!isBrowserNotificationSupported) {
        setHasNotificationPermission(false);
        return;
      }
      
      // 根据当前权限设置状态
      if (Notification.permission === 'granted') {
        setHasNotificationPermission(true);
        startBrowserNotificationService();
      } else {
        setHasNotificationPermission(false);
      }
    } else {
      // 非浏览器环境下默认设置为有权限
      setHasNotificationPermission(true);
    }
    
    // 组件卸载时的清理工作
    return () => {
      // 停止浏览器通知服务
      if (isBrowser) {
        stopBrowserNotificationService();
      }
    };
  }, []);

  // 处理权限获取成功
  const handlePermissionGranted = () => {
    setHasNotificationPermission(true);
    startBrowserNotificationService();
  };

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // 浏览器环境下且没有通知权限
  if (isBrowser && hasNotificationPermission === false) {
    return (
      <PaperProvider>
        <View style={styles.pageContainer}>
          <View style={styles.contentContainer}>
            <NotificationPermissionScreen onPermissionGranted={handlePermissionGranted} />
          </View>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.pageContainer}>
          <View style={styles.contentContainer}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </View>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    maxWidth: 1200, // 设置最大宽度
    width: '100%',
    alignSelf: 'center', // 在大屏幕上居中
    backgroundColor: '#ffffff', // 内容区域背景色
    ...(Platform.OS === 'web' ? {
      // Web端特定样式
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    } : {}),
  },
});
