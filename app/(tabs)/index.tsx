import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, IconButton, Portal, Switch, Text, useTheme } from 'react-native-paper';
import { useNotification } from '../services/NotificationContext';
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
  const [expandedAlarm, setExpandedAlarm] = useState<number | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const theme = useTheme();
  const { showNotification } = useNotification();

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
      showNotification('删除失败，请重试', 'error');
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
      showNotification(`闹钟已${newStatus === 1 ? '启用' : '禁用'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle alarm status:', error);
      showNotification('更新闹钟状态失败', 'error');
    }
  };

  const toggleExpandAlarm = (id: number) => {
    setExpandedAlarm(expandedAlarm === id ? null : id);
  };

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
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
                  <TouchableOpacity 
                    onPress={() => handleEditAlarm(alarm.id)}
                    activeOpacity={0.7}
                    style={styles.cardTitleContainer}
                  >
                    <Text variant="titleLarge" style={styles.alarmName}>
                      {alarm.name}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.iconButtonGroup}>
                    <Switch
                      value={alarm.status === 1}
                      onValueChange={() => handleToggleAlarmStatus(alarm)}
                      color={vibrantColors.primary}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => handleEditAlarm(alarm.id)}
                  activeOpacity={0.7}
                >
                  {/* 预览信息 - 只显示最重要的信息 */}
                  <View style={styles.previewInfo}>
                    <View style={styles.previewItem}>
                      <IconButton icon="clock-outline" size={16} iconColor={vibrantColors.secondary} style={styles.previewIcon} />
                      <Text style={styles.previewText}>
                        {alarm.reminder_times.map(formatTime).join('、')}
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.expandButton} 
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleExpandAlarm(alarm.id);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.expandButtonText}>
                        {expandedAlarm === alarm.id ? "收起" : "详情"}
                      </Text>
                      <IconButton 
                        icon={expandedAlarm === alarm.id ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        iconColor="#fff"
                        style={styles.expandIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Card.Content>
              
              {/* 展开的详情信息 */}
              {expandedAlarm === alarm.id && (
                <Card.Content style={styles.expandedContent}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailRow}>
                      <IconButton icon="calendar" size={20} iconColor={vibrantColors.primary} style={styles.detailIcon} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>日期</Text>
                        <Text style={styles.detailText}>{formatDate(alarm.reminder_date)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailRow}>
                      <IconButton icon="clock" size={20} iconColor={vibrantColors.secondary} style={styles.detailIcon} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>时间</Text>
                        <Text style={styles.detailText}>{alarm.reminder_times.map(formatTime).join('、')}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailRow}>
                      <IconButton icon="repeat" size={20} iconColor={vibrantColors.accent} style={styles.detailIcon} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>重复</Text>
                        <Text style={styles.detailText}>{getRepeatTypeText(alarm.repeat_type, alarm.custom_period, alarm.custom_days)}</Text>
                      </View>
                    </View>
                  </View>

                  {alarm.custom_days && Array.isArray(alarm.custom_days) && alarm.custom_days.length > 0 && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailRow}>
                        <IconButton icon="calendar-clock" size={20} iconColor={vibrantColors.info} style={styles.detailIcon} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>自定义天数</Text>
                          <Text style={styles.detailText}>第 {alarm.custom_days.join(', ')} 天</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <View style={styles.detailRow}>
                      <IconButton icon="pill" size={20} iconColor={vibrantColors.success} style={styles.detailIcon} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>药品列表</Text>
                      </View>
                    </View>
                    <View style={styles.medicineGrid}>
                      {alarm.medicines.map((medicine) => (
                        <View key={medicine.id} style={styles.medicineCard}>
                                                      {medicine.image ? (
                              <TouchableOpacity 
                                onPress={() => medicine.image && handleImagePress(medicine.image)}
                                activeOpacity={0.7}
                              >
                                <Image
                                  source={{ uri: medicine.image }}
                                  style={styles.medicineCardImage}
                                  resizeMode="cover"
                                />
                                <View style={styles.imageIndicator}>
                                  <IconButton icon="magnify" size={16} iconColor="#fff" style={{margin: 0}} />
                                </View>
                              </TouchableOpacity>
                            ) : (
                              <View style={[styles.medicineCardImagePlaceholder, {backgroundColor: vibrantColors.successLight}]}>
                                <IconButton icon="pill" size={24} iconColor={vibrantColors.success} style={{margin: 0}} />
                              </View>
                            )}
                            <View style={styles.medicineInfo}>
                              <Text style={styles.medicineInfoLabel}>药品名称:</Text>
                              <Text style={styles.medicineCardName} numberOfLines={1} ellipsizeMode="tail">
                                {medicine.name}
                              </Text>
                            </View>
                            {medicine.dosage && (
                              <View style={styles.medicineInfo}>
                                <Text style={styles.medicineInfoLabel}>剂量:</Text>
                                <Text style={styles.medicineCardDosage}>{medicine.dosage}</Text>
                              </View>
                            )}
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* 管理操作按钮 */}
                  <View style={styles.actionsContainer}>
                    <Button 
                      mode="contained" 
                      icon="pencil" 
                      style={styles.actionButton}
                      buttonColor={vibrantColors.secondary}
                      onPress={() => handleEditAlarm(alarm.id)}
                    >
                      编辑
                    </Button>
                    <Button 
                      mode="outlined" 
                      icon="delete" 
                      style={[styles.actionButton, {borderColor: vibrantColors.error}]}
                      textColor={vibrantColors.error}
                      onPress={() => handleRequestDelete(alarm.id)}
                    >
                      删除
                    </Button>
                  </View>
                </Card.Content>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={handleCancelDelete}
          style={styles.deleteDialog}
        >
          <Dialog.Title style={styles.deleteDialogTitle}>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.deleteDialogContent}>确定要删除这个闹钟吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.deleteDialogActions}>
            <Button 
              onPress={handleCancelDelete}
              mode="outlined"
              style={styles.deleteDialogButton}
            >
              取消
            </Button>
            <Button 
              onPress={() => alarmToDelete && handleDeleteAlarm(alarmToDelete)}
              mode="contained"
              buttonColor={vibrantColors.error}
              textColor="#fff"
              style={styles.deleteDialogButton}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerBackground}
            activeOpacity={1}
            onPress={closeImageViewer}
          >
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
            <IconButton
              icon="close"
              size={24}
              iconColor="#fff"
              style={styles.closeButton}
              onPress={closeImageViewer}
            />
          </TouchableOpacity>
        </View>
      </Modal>
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
    backgroundColor: vibrantColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    // 加深阴影效果
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: vibrantColors.surface,
    padding: 12,
    paddingBottom: 8,
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

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
    marginBottom: 4,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 8,
    borderColor: vibrantColors.primary,
  },
  expandedContent: {
    padding: 0,
    backgroundColor: vibrantColors.surface,
  },
  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: vibrantColors.divider,
    paddingBottom: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: vibrantColors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {
    margin: 0,
    padding: 0,
    marginRight: -4,
  },
  detailContent: {
    flex: 1,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: vibrantColors.textPrimary,
  },
  detailText: {
    fontSize: 14,
    color: vibrantColors.textSecondary,
  },
  medicineListContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    ...Platform.OS !== 'web' ? {
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    } : {
      borderWidth: 1,
      borderColor: vibrantColors.divider,
    },
  },
  medicineListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: vibrantColors.textPrimary,
    marginLeft: 8,
  },
  medicineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  medicineCard: {
    width: '48%',
    marginBottom: 12,
    padding: 8,
    backgroundColor: vibrantColors.surfaceLight,
    borderRadius: 8,
  },
  medicineCardImage: {
    width: '100%',
    height: 90,
    borderRadius: 6,
  },
  medicineCardImagePlaceholder: {
    width: '100%',
    height: 90,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineCardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: vibrantColors.textPrimary,
    flex: 1,
  },
  medicineCardDosage: {
    fontSize: 12,
    color: vibrantColors.textPrimary,
    flex: 1,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    margin: 0,
    padding: 0,
  },
  previewText: {
    fontSize: 14,
    color: vibrantColors.textSecondary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: vibrantColors.primary,
    minWidth: 80,
    justifyContent: 'center',
  },
  expandButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  expandIcon: {
    margin: 0,
    padding: 0,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerBackground: {
    flex: 1,
    width: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  imageIndicator: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 2,
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  medicineInfoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: vibrantColors.textSecondary,
    marginRight: 4,
  },
  deleteDialog: {
    backgroundColor: '#fff', 
    borderRadius: 12,
    elevation: 24,
  },
  deleteDialogTitle: {
    textAlign: 'center',
    fontSize: 18,
    color: vibrantColors.textPrimary,
  },
  deleteDialogContent: {
    textAlign: 'center',
    fontSize: 16,
    color: vibrantColors.textSecondary,
    paddingVertical: 8,
  },
  deleteDialogActions: {
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteDialogButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  cardTitleContainer: {
    flex: 1,
  },
});
