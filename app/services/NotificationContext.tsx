import Constants from 'expo-constants';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

// 通知类型
export type NotificationType = 'error' | 'warning' | 'success' | 'info';

// 通知上下文接口
interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  hideNotification: () => void;
}

// 创建上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 通知提供者组件属性
interface NotificationProviderProps {
  children: ReactNode;
}

// 获取屏幕宽度
const { width } = Dimensions.get('window');

// 通知提供者组件
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const translateY = useState(new Animated.Value(-100))[0];

  // 显示通知的动画
  const showNotificationAnimation = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start();
  };

  // 隐藏通知的动画
  const hideNotificationAnimation = (callback?: () => void) => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  // 自动隐藏通知
  useEffect(() => {
    if (visible) {
      showNotificationAnimation();
      const timer = setTimeout(() => {
        hideNotificationAnimation(() => setVisible(false));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 显示通知
  const showNotification = (message: string, type: NotificationType = 'info') => {
    setMessage(message);
    setType(type);
    setVisible(true);
  };

  // 隐藏通知
  const hideNotification = () => {
    hideNotificationAnimation(() => setVisible(false));
  };

  // 获取状态栏高度
  const statusBarHeight = Platform.OS === 'ios' ? Constants.statusBarHeight : 0;

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.notificationContainer,
            { transform: [{ translateY }], top: statusBarHeight },
          ]}
        >
          <View
            style={[
              styles.notificationBar,
              type === "error" && { backgroundColor: "#d32f2f" },
              type === "warning" && { backgroundColor: "#ffa000" },
              type === "success" && { backgroundColor: "#388e3c" },
              type === "info" && { backgroundColor: "#1976d2" },
            ]}
          >
            <Text style={styles.notificationText}>{message}</Text>
            <Button
              mode="text"
              onPress={hideNotification}
              labelStyle={{ color: "#fff", fontWeight: "bold" }}
              compact
            >
              确定
            </Button>
          </View>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

// 使用通知的自定义Hook
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// 样式
const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: width,
    zIndex: 9999,
    elevation: 9999,
  },
  notificationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1976d2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 9999,
  },
  notificationText: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
}); 