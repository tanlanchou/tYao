import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button, Checkbox, Chip, Dialog, IconButton, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import MedicineForm, { MedicineData } from '../components/MedicineForm';

interface ReminderData {
  reminderDate: Date;
  reminderTimes: Date[];
  repeatType: 'single' | 'weekly' | 'monthly' | 'custom';
  customPeriod?: number;
  customDays?: number[];
  displayData: {
    reminderDateText: string;
    reminderTimesText: string;
    repeatTypeText: string;
    customDaysText: string;
    fullDisplayText: string;
  };
}

interface CombinedData extends MedicineData {
  reminder: ReminderData;
}

export default function AddScreen() {
  const [alarmName, setAlarmName] = useState('');
  const [medicines, setMedicines] = useState<CombinedData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'warning' | 'success' | 'info'>('info');

  // 时间提醒相关状态
  const [reminderDate, setReminderDate] = useState(new Date());
  const [reminderTimes, setReminderTimes] = useState<Date[]>([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);
  const [isRepeatModalVisible, setRepeatModalVisible] = useState(false);
  const [isCustomModalVisible, setCustomModalVisible] = useState(false);
  const [repeatType, setRepeatType] = useState<ReminderData['repeatType']>('single');
  const [customPeriod, setCustomPeriod] = useState<number>(7);
  const [customDays, setCustomDays] = useState<number[]>([]);

  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => setSnackbarVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible]);

  // 统一弹出提示
  const showSnackbar = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleSaveAlarm = () => {
    // 检查闹钟名称
    if (!alarmName.trim()) {
      showSnackbar('请输入闹钟名称', 'error');
      return;
    }

    // 检查提醒日期
    if (!reminderDate) {
      showSnackbar('请选择提醒日期', 'error');
      return;
    }

    // 检查时间
    if (reminderTimes.length === 0) {
      showSnackbar('请至少添加一个提醒时间', 'error');
      return;
    }

    // 检查重复类型
    if (!repeatType) {
      showSnackbar('请选择重复类型', 'error');
      return;
    }

    // 如果选择自定义重复周期，检查是否选择了天数
    if (repeatType === 'custom') {
      if (customPeriod === 0) {
        showSnackbar('请输入自定义重复周期', 'error');
        return;
      }
      if (customDays.length === 0) {
        showSnackbar('请至少选择一天作为重复日期', 'error');
        return;
      }
    }

    // TODO: 这里添加保存闹钟的逻辑
    showSnackbar('闹钟保存成功', 'success');
  };

  const handleAddMedicine = (data: MedicineData) => {
    if (editingIndex !== null) {
      const newMedicines = [...medicines];
      newMedicines[editingIndex] = { ...data, reminder: {
        reminderDate,
        reminderTimes,
        repeatType,
        customPeriod,
        customDays,
        displayData: {
          reminderDateText: reminderDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\//g, '/'),
          reminderTimesText: reminderTimes.map(time => {
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          }).join('、'),
          repeatTypeText: repeatType === 'single' ? '单次提醒' : 
                         repeatType === 'weekly' ? '每周重复' : 
                         repeatType === 'monthly' ? '每月重复' : 
                         `自定义重复周期(${customPeriod}天)`,
          customDaysText: repeatType === 'custom' ? `第 ${customDays.join(', ')} 天` : '',
          fullDisplayText: ''
        }
      }};
      setMedicines(newMedicines);
      setEditingIndex(null);
      showSnackbar('编辑成功', 'success');
    } else {
      setMedicines([...medicines, { ...data, reminder: {
        reminderDate,
        reminderTimes,
        repeatType,
        customPeriod,
        customDays,
        displayData: {
          reminderDateText: reminderDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\//g, '/'),
          reminderTimesText: reminderTimes.map(time => {
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          }).join('、'),
          repeatTypeText: repeatType === 'single' ? '单次提醒' : 
                         repeatType === 'weekly' ? '每周重复' : 
                         repeatType === 'monthly' ? '每月重复' : 
                         `自定义重复周期(${customPeriod}天)`,
          customDaysText: repeatType === 'custom' ? `第 ${customDays.join(', ')} 天` : '',
          fullDisplayText: ''
        }
      }}]);
      showSnackbar('添加成功', 'success');
    }
    setIsAdding(false);
  };

  const handleStartAdding = () => {
    setIsAdding(true);
    scrollToBottom();
  };

  const handleEditMedicine = (index: number) => {
    if (isAdding) {
      showSnackbar('请先保存或取消当前操作', 'warning');
      return;
    }
    setEditingIndex(index);
    setIsAdding(true);
    scrollToBottom();
  };

  const handleRequestDeleteMedicine = (index: number) => {
    if (isAdding) {
      showSnackbar('请先保存或取消当前操作', 'warning');
      return;
    }
    setDeleteIndex(index);
  };

  const handleConfirmDeleteMedicine = () => {
    if (deleteIndex !== null) {
      setMedicines(medicines.filter((_, i) => i !== deleteIndex));
      setDeleteIndex(null);
      showSnackbar('删除成功', 'success');
    }
  };

  const handleCancelDeleteMedicine = () => {
    setDeleteIndex(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
  };

  // 时间提醒相关处理函数
  const handleDateConfirm = (date: Date) => {
    setReminderDate(date);
    setDatePickerVisible(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const newTimes = [...reminderTimes];
    newTimes[currentTimeIndex] = time;
    setReminderTimes(newTimes);
    setTimePickerVisible(false);
  };

  const handleAddTime = () => {
    if (reminderTimes.length < 6) {
      setReminderTimes([...reminderTimes, new Date()]);
    } else {
      showSnackbar('最多只能添加6个时间', 'warning');
    }
  };

  const handleRemoveTime = (index: number) => {
    if (reminderTimes.length > 1) {
      const newTimes = reminderTimes.filter((_, i) => i !== index);
      setReminderTimes(newTimes);
    } else {
      showSnackbar('至少需要保留一个时间', 'warning');
    }
  };

  const handleRepeatTypeSelect = (type: ReminderData['repeatType']) => {
    setRepeatType(type);
    setRepeatModalVisible(false);
  };

  const handleCustomPeriodChange = (text: string) => {
    if (text === '') {
      setCustomPeriod(0);
      setCustomDays([]);
      return;
    }
    
    const period = parseInt(text, 10);
    if (!isNaN(period) && period >= 1 && period <= 14) {
      setCustomPeriod(period);
      setCustomDays(customDays.filter(day => day <= period));
    }
  };

  const handleCustomDayToggle = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day].sort((a, b) => a - b));
    }
  };

  // 添加滚动到底部的函数
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
      >
        <TextInput
          label="闹钟名称"
          value={alarmName}
          onChangeText={setAlarmName}
          style={styles.input}
          maxLength={20}
        />

        <View style={styles.reminderSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>提醒设置</Text>
          <Button
            mode="outlined"
            onPress={() => setDatePickerVisible(true)}
            style={styles.input}
            icon="calendar"
          >
            提醒日期: {reminderDate.toLocaleDateString()}
          </Button>
          <View style={styles.timesContainer}>
            {reminderTimes.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setCurrentTimeIndex(index);
                    setTimePickerVisible(true);
                  }}
                  style={styles.timeButton}
                  icon="clock"
                >
                  时间 {index + 1}: {time.toLocaleTimeString()}
                </Button>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleRemoveTime(index)}
                  style={styles.deleteButton}
                  iconColor="#d32f2f"
                />
              </View>
            ))}
            {reminderTimes.length < 6 && (
              <Button
                mode="outlined"
                onPress={handleAddTime}
                style={styles.addTimeButton}
                icon="plus"
              >
                添加时间
              </Button>
            )}
          </View>
          <Button
            mode="outlined"
            onPress={() => setRepeatModalVisible(true)}
            style={styles.input}
            icon="repeat"
          >
            重复类型: {repeatType === 'single' ? '单次提醒' : repeatType === 'weekly' ? '每周重复' : repeatType === 'monthly' ? '每月重复' : '自定义重复周期'}
          </Button>
          {repeatType === 'custom' && (
            <Button
              mode="outlined"
              onPress={() => setCustomModalVisible(true)}
              style={styles.input}
              icon="calendar-clock"
            >
              选择自定义重复周期
            </Button>
          )}
          {repeatType === 'custom' && customDays.length > 0 && (
            <Text style={styles.selectedDateText}>
              自定义重复周期: {customPeriod}天，第 {customDays.join(', ')} 天
            </Text>
          )}
        </View>

        <View style={styles.medicineList}>
          <Text variant="titleLarge" style={styles.sectionTitle}>药品列表</Text>
          {medicines.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>暂无记录</Text>
            </View>
          ) : (
            medicines.map((medicine, index) => (
              <View key={index} style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <Text variant="titleMedium" style={styles.medicineName}>{medicine.name}</Text>
                  <View style={styles.iconButtonGroup}>
                    <IconButton
                      icon="pencil"
                      size={22}
                      style={styles.iconButton}
                      containerColor={theme.colors.primary}
                      iconColor="#fff"
                      onPress={() => handleEditMedicine(index)}
                    />
                    <IconButton
                      icon="delete"
                      size={22}
                      style={styles.iconButton}
                      containerColor={theme.colors.error}
                      iconColor="#fff"
                      onPress={() => handleRequestDeleteMedicine(index)}
                    />
                  </View>
                </View>
                {medicine.image && (
                  <Image source={{ uri: medicine.image }} style={styles.medicineImage} />
                )}
                {medicine.dosage && (
                  <View style={styles.medicineInfoRow}>
                    <Chip icon="pill" style={styles.chip} textStyle={styles.chipText}>
                      药量: {medicine.dosage}
                    </Chip>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {isAdding ? (
          <MedicineForm
            onSubmit={handleAddMedicine}
            onCancel={handleCancel}
            initialData={editingIndex !== null ? medicines[editingIndex] : undefined}
            isEdit={editingIndex !== null}
            showSnackbar={showSnackbar}
          />
        ) : (
          <>
            <Button 
              mode="contained" 
              icon="plus"
              style={styles.addButton}
              onPress={handleStartAdding}
            >
              添加药品
            </Button>
            {medicines.length > 0 && (
              <Button 
                mode="contained" 
                icon="content-save"
                style={styles.saveButton}
                onPress={handleSaveAlarm}
              >
                保存闹钟
              </Button>
            )}
          </>
        )}
      </ScrollView>
      <Portal>
        <Dialog
          visible={deleteIndex !== null}
          onDismiss={handleCancelDeleteMedicine}
        >
          <Dialog.Title>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除该药品吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelDeleteMedicine}>取消</Button>
            <Button onPress={handleConfirmDeleteMedicine} textColor={theme.colors.error}>删除</Button>
          </Dialog.Actions>
        </Dialog>
        <Modal
          visible={isRepeatModalVisible}
          onDismiss={() => setRepeatModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            Platform.OS === 'android' && styles.androidModalContainer
          ]}
          style={[
            styles.modal,
            Platform.OS === 'android' && styles.androidModal
          ]}
        >
          <Text style={styles.modalTitle}>请选择重复类型</Text>
          <View style={styles.modalContent}>
            <Button mode="contained" style={styles.modalButton} onPress={() => handleRepeatTypeSelect('single')} icon="bell">
              单次提醒
            </Button>
            <Button mode="contained" style={styles.modalButton} onPress={() => handleRepeatTypeSelect('weekly')} icon="calendar-week">
              每周重复
            </Button>
            <Button mode="contained" style={styles.modalButton} onPress={() => handleRepeatTypeSelect('monthly')} icon="calendar-month">
              每月重复
            </Button>
            <Button mode="contained" style={styles.modalButton} onPress={() => handleRepeatTypeSelect('custom')} icon="calendar-clock">
              自定义重复周期
            </Button>
            <Button mode="outlined" style={styles.modalButton} onPress={() => setRepeatModalVisible(false)} icon="close">
              取消
            </Button>
          </View>
        </Modal>
        <Modal
          visible={isCustomModalVisible}
          onDismiss={() => setCustomModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            Platform.OS === 'android' && styles.androidModalContainer
          ]}
          style={[
            styles.modal,
            Platform.OS === 'android' && styles.androidModal
          ]}
        >
          <Text style={styles.modalTitle}>自定义重复周期</Text>
          <View style={styles.modalContent}>
            <TextInput
              label="周期（1-14天）"
              value={customPeriod === 0 ? '' : customPeriod.toString()}
              onChangeText={handleCustomPeriodChange}
              keyboardType="numeric"
              style={styles.input}
              maxLength={2}
              placeholder="请输入1-14之间的数字"
              mode="outlined"
            />
            <View style={styles.checkboxContainer}>
              {Array.from({ length: customPeriod }, (_, i) => i + 1).map(day => (
                <View key={day} style={styles.checkboxItem}>
                  <Checkbox
                    status={customDays.includes(day) ? 'checked' : 'unchecked'}
                    onPress={() => handleCustomDayToggle(day)}
                  />
                  <Text>第 {day} 天</Text>
                </View>
              ))}
            </View>
            <Button mode="contained" style={styles.modalButton} onPress={() => setCustomModalVisible(false)} icon="check">
              确定
            </Button>
            <Button mode="outlined" style={styles.modalButton} onPress={() => setCustomModalVisible(false)} icon="close">
              取消
            </Button>
          </View>
        </Modal>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={() => setTimePickerVisible(false)}
          date={reminderTimes[currentTimeIndex] || new Date()}
        />
      </Portal>
      {/* 顶部提示条 */}
      {snackbarVisible && (
        <View style={[
          styles.topNoticeBar,
          snackbarType === 'error' && { backgroundColor: '#d32f2f' },
          snackbarType === 'warning' && { backgroundColor: '#ffa000' },
          snackbarType === 'success' && { backgroundColor: '#388e3c' },
          snackbarType === 'info' && { backgroundColor: '#1976d2' },
        ]}>
          <Text style={styles.topNoticeText}>{snackbarMessage}</Text>
          <Button
            mode="text"
            onPress={() => setSnackbarVisible(false)}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            compact
          >
            确定
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  reminderSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  medicineList: {
    marginBottom: 5,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  medicineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medicineName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  iconButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    marginHorizontal: 0,
    marginVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  medicineInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    marginBottom: 4,
    maxWidth: '100%',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipText: {
    color: '#1976d2',
    fontSize: 14,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 6,
  },
  saveButton: {
    marginTop: 4,
    marginBottom: 32,
    backgroundColor: '#4caf50',
  },
  topNoticeBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1976d2',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 4,
  },
  topNoticeText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timesContainer: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#1976d2',
    borderWidth: 1,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    marginLeft: 8,
  },
  addTimeButton: {
    marginTop: 12,
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
    borderWidth: 1,
  },
  selectedDateText: {
    marginTop: 12,
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  androidModal: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    margin: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  androidModalContainer: {
    margin: 0,
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalContent: {
    gap: 12,
  },
  modalButton: {
    marginVertical: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1976d2',
  },
}); 