import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Dialog, IconButton, Portal, Text, useTheme } from 'react-native-paper';
import { deleteAlarm, getAllAlarms, initDatabase, updateAlarmStatus } from '../services/database';
import { cancelAlarmNotifications, scheduleAlarmNotifications } from '../services/notifications';
import vibrantColors from '../theme/colors';

interface Alarm {
  id: number;
  name: string;
  reminder_date: string;
  reminder_times: string[];
  repeat_type: string;
  custom_period: number | null;
  custom_days: number[] | null;
  created_at: string;
  medicines: Array<{
    id: number;
    name: string;
    image?: string;
    dosage?: string;
  }>;
  status: number;
}

export default function HomeScreen() {
  const { refresh } = useLocalSearchParams();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [alarmToDelete, setAlarmToDelete] = useState<number | null>(null);
  const theme = useTheme();

  // 添加通知监听器
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('收到通知:', {
          '标题': notification.request.content.title,
          '内容': notification.request.content.body,
          '时间': new Date().toISOString()
        });
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const loadAlarms = async () => {
    try {
      const data = await getAllAlarms() as Alarm[];
      // 按创建时间倒序排序
      const sortedData = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAlarms(sortedData);
    } catch (error) {
      console.error('Failed to load alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  // 监听 refresh 参数变化，重新加载数据
  useEffect(() => {
    loadAlarms();
  }, [refresh]);

  const handleDeleteAlarm = async (id: number) => {
    try {
      // 先取消所有相关的通知
      await cancelAlarmNotifications(id);
      // 然后删除闹钟
      await deleteAlarm(id);
      await loadAlarms(); // 重新加载数据
      setDeleteDialogVisible(false);
      setAlarmToDelete(null);
    } catch (error) {
      console.error('Failed to delete alarm:', error);
      showSnackbar('删除失败，请重试', 'error');
    }
  };

  const handleRequestDelete = (id: number) => {
    setAlarmToDelete(id);
    setDeleteDialogVisible(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogVisible(false);
    setAlarmToDelete(null);
  };

  const handleEditAlarm = (id: number) => {
    router.push({
      pathname: '/(tabs)/add',
      params: { id }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getRepeatTypeText = (type: string, customPeriod?: number | null, customDays?: number[] | null) => {
    switch (type) {
      case 'single':
        return '单次提醒';
      case 'weekly':
        return '每周重复';
      case 'monthly':
        return '每月重复';
      case 'hourly':
        return `每${customPeriod}小时重复`;
      case 'custom':
        return `自定义重复周期(${customPeriod}天)`;
      default:
        return type;
    }
  };

  // 添加showSnackbar函数
  const showSnackbar = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info') => {
    console.log(`[${type}] ${message}`);
    // 如果需要可以在这里实现真正的snackbar显示
  };

  // 修改handleToggleAlarmStatus函数中的repeat_type类型
  const handleToggleAlarmStatus = async (alarm: Alarm) => {
    try {
      // 计算新状态（切换）
      const newStatus = alarm.status === 1 ? 0 : 1;
      
      // 更新状态
      await updateAlarmStatus(alarm.id, newStatus);
      
      // 处理通知
      if (newStatus === 0) {
        // 禁用闹钟，取消所有通知
        await cancelAlarmNotifications(alarm.id);
      } else {
        // 启用闹钟，注册通知
        const reminderDate = new Date(alarm.reminder_date);
        const reminderTimes = alarm.reminder_times.map(time => new Date(time));
        
        await scheduleAlarmNotifications(
          alarm.id,
          alarm.name,
          reminderDate,
          reminderTimes,
          alarm.repeat_type as "single" | "weekly" | "monthly" | "custom" | "hourly", // 类型断言
          alarm.custom_period,
          alarm.custom_days,
          alarm.medicines
        );
      }
      
      // 重新加载数据
      await loadAlarms();
      showSnackbar(`闹钟已${newStatus === 1 ? '启用' : '禁用'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle alarm status:', error);
      showSnackbar('更新闹钟状态失败', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {alarms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无闹钟</Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/add')}
              style={styles.addButton}
              buttonColor={vibrantColors.primary}
            >
              添加闹钟
            </Button>
          </View>
        ) : (
          alarms.map((alarm) => (
            <Card key={alarm.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleLarge" style={styles.alarmName}>
                    {alarm.name}
                  </Text>
                  <View style={styles.iconButtonGroup}>
                    <Chip
                      icon={alarm.status === 1 ? "bell" : "bell-off"}
                      onPress={() => handleToggleAlarmStatus(alarm)}
                      style={[
                        styles.statusChip,
                        alarm.status === 1 ? styles.activeStatusChip : styles.inactiveStatusChip,
                        Platform.OS === 'android' && styles.androidStatusChip,
                        Platform.OS === 'ios' && styles.iosStatusChip,
                        Platform.OS === 'web' && styles.webStatusChip
                      ]}
                      textStyle={{
                        color: alarm.status === 1 ? vibrantColors.primary : vibrantColors.neutral,
                        fontWeight: 'bold',
                        fontSize: 13,
                        includeFontPadding: false,
                        ...(Platform.OS === 'android' && {
                          paddingTop: 3,
                          lineHeight: 12,
                        }),
                        ...(Platform.OS === 'ios' && {
                          paddingBottom: 1,
                        }),
                        ...(Platform.OS === 'web' && {
                          lineHeight: 20,
                        }),
                      }}
                      compact={true}
                    >
                      {alarm.status === 1 ? "已启用" : "已禁用"}
                    </Chip>
                    <IconButton
                      icon="pencil"
                      size={22}
                      style={styles.iconButton}
                      containerColor={vibrantColors.secondary}
                      iconColor="#fff"
                      onPress={() => handleEditAlarm(alarm.id)}
                    />
                    <IconButton
                      icon="delete"
                      size={22}
                      style={styles.iconButton}
                      containerColor={vibrantColors.error}
                      iconColor="#fff"
                      onPress={() => handleRequestDelete(alarm.id)}
                    />
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Chip icon="calendar" style={[styles.chip, {backgroundColor: vibrantColors.primaryLight}]} textStyle={styles.chipText}>
                    日期: {formatDate(alarm.reminder_date)}
                  </Chip>
                  <Chip icon="clock" style={[styles.chip, {backgroundColor: vibrantColors.secondaryLight}]} textStyle={styles.chipText}>
                    时间: {alarm.reminder_times.map(formatTime).join('、')}
                  </Chip>
                  <Chip icon="repeat" style={[styles.chip, {backgroundColor: vibrantColors.accentLight}]} textStyle={styles.chipText}>
                    重复: {getRepeatTypeText(alarm.repeat_type, alarm.custom_period, alarm.custom_days)}
                  </Chip>
                  {alarm.custom_days && Array.isArray(alarm.custom_days) && alarm.custom_days.length > 0 && (
                    <Chip icon="calendar-clock" style={[styles.chip, {backgroundColor: vibrantColors.infoLight}]} textStyle={styles.chipText}>
                      自定义天数: 第 {alarm.custom_days.join(', ')} 天
                    </Chip>
                  )}
                </View>

                <View style={styles.medicineSection}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    药品列表
                  </Text>
                  <View style={styles.medicineList}>
                    {alarm.medicines.map((medicine) => (
                      <View key={medicine.id} style={styles.medicineItem}>
                        <Chip 
                          icon="pill" 
                          style={[styles.medicineChip, {backgroundColor: vibrantColors.successLight}]}
                          textStyle={styles.chipText}
                        >
                          {medicine.name}
                          {medicine.dosage && ` (${medicine.dosage})`}
                        </Chip>
                        {medicine.image && (
                          <Image
                            source={{ uri: medicine.image }}
                            style={styles.medicineImage}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={handleCancelDelete}
        >
          <Dialog.Title>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除这个闹钟吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelDelete}>取消</Button>
            <Button 
              onPress={() => alarmToDelete && handleDeleteAlarm(alarmToDelete)}
              textColor={vibrantColors.error}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vibrantColors.surfaceLight,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    backgroundColor: vibrantColors.surfaceLight,
    padding: 16,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 18,
    color: vibrantColors.textSecondary,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: vibrantColors.surface,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: vibrantColors.surface,
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: vibrantColors.divider,
  },
  alarmName: {
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
    color: vibrantColors.textPrimary,
  },
  iconButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  infoSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    paddingVertical: 4,
  },
  chip: {
    margin: 4,
    borderRadius: 16,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    ...(Platform.OS === 'android' && {
      height: 38, // 安卓上高度稍大
      paddingBottom: 1,
    }),
    ...(Platform.OS === 'web' && {
      height: 34, // Web上高度稍小
    }),
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600', 
    color: vibrantColors.textPrimary,
    lineHeight: 18, // 行高调小
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' && { 
      paddingTop: 2, 
    }),
    ...(Platform.OS === 'web' && { 
      paddingBottom: 2, 
    }),
    ...(Platform.OS === 'ios' && {
      lineHeight: 16,
    }),
  },
  statusChip: {
    height: 28, // 基础高度
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    overflow: 'hidden',
    paddingHorizontal: 10, // 水平内边距增加
  },
  androidStatusChip: {
    height: 30, // 安卓高度稍大
    paddingLeft: 6, // 图标左边距略小
  },
  iosStatusChip: {
    height: 28, // iOS高度保持原样
    paddingHorizontal: 8,
  },
  webStatusChip: {
    height: 26, // web高度略小
    paddingLeft: 6,
  },
  activeStatusChip: {
    backgroundColor: vibrantColors.primaryLight,
    borderWidth: 1,
    borderColor: vibrantColors.primary,
  },
  inactiveStatusChip: {
    backgroundColor: vibrantColors.divider,
    borderWidth: 1,
    borderColor: vibrantColors.neutral,
  },
  sectionTitle: {
    marginBottom: 8,
    color: vibrantColors.neutral,
    fontWeight: "bold",
  },
  medicineSection: {
    backgroundColor: vibrantColors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  medicineList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  medicineItem: {
    alignItems: "center",
    marginBottom: 8,
  },
  medicineChip: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36, // 基础高度
    paddingVertical: 0,
    ...(Platform.OS === 'android' && {
      height: 38, // 安卓上高度稍大
      paddingBottom: 1,
    }),
    ...(Platform.OS === 'web' && {
      height: 34, // web上高度稍小
    }),
    ...(Platform.OS === 'ios' && {
      height: 34, // iOS上高度也稍小
    }),
  },
  medicineImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});
