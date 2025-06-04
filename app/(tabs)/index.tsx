import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Dialog, IconButton, Portal, Text, useTheme } from 'react-native-paper';
import { deleteAlarm, getAllAlarms, initDatabase } from '../services/database';

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
}

export default function HomeScreen() {
  const { refresh } = useLocalSearchParams();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [alarmToDelete, setAlarmToDelete] = useState<number | null>(null);
  const theme = useTheme();

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
      await deleteAlarm(id);
      await loadAlarms(); // 重新加载数据
      setDeleteDialogVisible(false);
      setAlarmToDelete(null);
    } catch (error) {
      console.error('Failed to delete alarm:', error);
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
      case 'custom':
        return `自定义重复周期(${customPeriod}天)`;
      default:
        return type;
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
                    <IconButton
                      icon="pencil"
                      size={22}
                      style={styles.iconButton}
                      containerColor={theme.colors.primary}
                      iconColor="#fff"
                      onPress={() => handleEditAlarm(alarm.id)}
                    />
                    <IconButton
                      icon="delete"
                      size={22}
                      style={styles.iconButton}
                      containerColor={theme.colors.error}
                      iconColor="#fff"
                      onPress={() => handleRequestDelete(alarm.id)}
                    />
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Chip icon="calendar" style={styles.chip}>
                    日期: {formatDate(alarm.reminder_date)}
                  </Chip>
                  <Chip icon="clock" style={styles.chip}>
                    时间: {alarm.reminder_times.map(formatTime).join('、')}
                  </Chip>
                  <Chip icon="repeat" style={styles.chip}>
                    重复: {getRepeatTypeText(alarm.repeat_type, alarm.custom_period, alarm.custom_days)}
                  </Chip>
                  {alarm.custom_days && (
                    <Chip icon="calendar-clock" style={styles.chip}>
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
                          style={styles.medicineChip}
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
              textColor={theme.colors.error}
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
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alarmName: {
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
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
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginBottom: 8,
  },
  medicineSection: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  medicineList: {
    gap: 16,
  },
  medicineItem: {
    backgroundColor: "rgb(232, 222, 248)",
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 12,
    elevation: 1,
  },
  medicineImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  medicineChip: {
    alignSelf: "flex-start",
  },
});
