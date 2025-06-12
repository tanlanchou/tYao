import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { getBrowserNotificationPermissionStatus, requestBrowserNotificationPermission } from '../services/browserNotifications';

interface NotificationPermissionScreenProps {
  onPermissionGranted: () => void;
}

export default function NotificationPermissionScreen({ onPermissionGranted }: NotificationPermissionScreenProps) {
  const [permissionStatus, setPermissionStatus] = React.useState<'granted' | 'denied' | 'default' | 'unsupported'>(
    getBrowserNotificationPermissionStatus()
  );

  // 请求权限
  const requestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    const newStatus = getBrowserNotificationPermissionStatus();
    setPermissionStatus(newStatus);
    
    if (granted) {
      onPermissionGranted();
    }
  };

  // 显示不同的提示信息，基于权限状态
  const getStatusMessage = () => {
    switch (permissionStatus) {
      case 'denied':
        return '您已拒绝通知权限。请在浏览器设置中允许通知，或点击下方按钮重新授权。';
      case 'default':
        return '此应用需要通知权限才能正常工作。请点击下方按钮授予权限。';
      case 'unsupported':
        return '当前浏览器不支持通知功能。请使用支持Web通知功能的现代浏览器（如Chrome、Firefox、Edge等）。';
      default:
        return '此应用需要通知权限才能正常工作。';
    }
  };

  // 显示不同的按钮文本，基于权限状态
  const getButtonText = () => {
    switch (permissionStatus) {
      case 'denied':
        return '重新请求权限';
      case 'default':
        return '授予通知权限';
      case 'unsupported':
        return '使用其他浏览器';
      default:
        return '请求权限';
    }
  };

  // 不同权限状态下的按钮行为
  const handleButtonPress = () => {
    if (permissionStatus === 'unsupported') {
      // 对于不支持的浏览器，可以提供浏览器下载链接
      window.open('https://www.google.com/chrome/', '_blank');
    } else {
      requestPermission();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>通知权限受限</Text>
            <Text style={styles.description}>{getStatusMessage()}</Text>
            <Button 
              mode="contained" 
              onPress={handleButtonPress}
              style={styles.button}
            >
              {getButtonText()}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 480, // 卡片最大宽度
    alignItems: 'center',
  },
  card: {
    width: '100%',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    } : {
      elevation: 4,
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    color: '#666666',
  },
  button: {
    paddingVertical: 8,
    borderRadius: 8,
  }
}); 