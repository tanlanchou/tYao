import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

// 通知提供者组件
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');

  // 自动隐藏通知
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 3000);
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
    setVisible(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {visible && (
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
  notificationBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1976d2',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationText: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
}); 