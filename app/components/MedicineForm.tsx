import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button, Checkbox, IconButton, Modal, Portal, Text, TextInput } from 'react-native-paper';

interface MedicineFormProps {
  onSubmit: (data: MedicineData) => void;
  onCancel: () => void;
  initialData?: MedicineData;
  isEdit?: boolean;
  showSnackbar: (msg: string, type?: 'error' | 'warning' | 'success' | 'info') => void;
}

export interface MedicineData {
  name: string;
  image?: string;
  dosage?: string;
  reminderDate: Date;
  reminderTimes: Date[];
  repeatType?: 'single' | 'weekly' | 'monthly' | 'custom';
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

export default function MedicineForm({ onSubmit, onCancel, initialData, isEdit = false, showSnackbar }: MedicineFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [reminderDate, setReminderDate] = useState(initialData?.reminderDate || new Date());
  const [reminderTimes, setReminderTimes] = useState<Date[]>(initialData?.reminderTimes || []);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);
  const [isImagePickerVisible, setImagePickerVisible] = useState(false);
  const [isRepeatModalVisible, setRepeatModalVisible] = useState(false);
  const [isCustomModalVisible, setCustomModalVisible] = useState(false);
  const [repeatType, setRepeatType] = useState<MedicineData['repeatType']>(initialData?.repeatType || 'single');
  const [customPeriod, setCustomPeriod] = useState<number>(initialData?.customPeriod || 7);
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImagePickerVisible(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showSnackbar('需要相机权限才能拍照', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImagePickerVisible(false);
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setImagePickerVisible(false);
  };

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

  const handleSubmit = () => {
    // 检查药品名称
    if (!name.trim()) {
      showSnackbar('请输入药品名称', 'error');
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

    // 格式化提醒时间
    const formattedTimes = reminderTimes.map(time => {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    });

    // 格式化重复类型显示文本
    let repeatTypeText = '';
    let customDaysText = '';
    
    switch (repeatType) {
      case 'single':
        repeatTypeText = '单次提醒';
        break;
      case 'weekly':
        repeatTypeText = '每周重复';
        break;
      case 'monthly':
        repeatTypeText = '每月重复';
        break;
      case 'custom':
        repeatTypeText = `自定义重复周期(${customPeriod}天)`;
        customDaysText = `第 ${customDays.join(', ')} 天`;
        break;
    }

    // 所有验证通过，提交表单
    onSubmit({
      name,
      image,
      dosage,
      reminderDate,
      reminderTimes,
      repeatType,
      customPeriod,
      customDays,
      // 添加用于显示的格式化数据
      displayData: {
        // 日期格式化为 YYYY/MM/DD
        reminderDateText: reminderDate.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '/'),
        // 时间列表，每个时间格式化为 HH:MM
        reminderTimesText: formattedTimes.join('、'),
        // 重复类型文本
        repeatTypeText,
        // 自定义重复天数文本
        customDaysText,
        // 完整的显示文本
        fullDisplayText: `${reminderDate.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '/')} ${formattedTimes.join('、')} ${repeatTypeText}${customDaysText ? `，${customDaysText}` : ''}`
      }
    });
  };

  const handleRepeatTypeSelect = (type: MedicineData['repeatType']) => {
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

  return (
    <View style={styles.container}>
      {isEdit && (
        <Text style={styles.editTitle}>正在编辑：{name}</Text>
      )}
      <TextInput
        label="药品名称"
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
      />
      <View style={styles.imageSection}>
        <Text style={styles.label}>添加照片（可选）</Text>
        <Button 
          mode="outlined" 
          onPress={() => setImagePickerVisible(true)}
          style={styles.imageButton}
          icon="camera"
        >
          选择图片
        </Button>
        {image && (
          <Image source={{ uri: image }} style={styles.previewImage} />
        )}
      </View>
      <TextInput
        label="药量（可选）"
        value={dosage}
        onChangeText={setDosage}
        keyboardType="numeric"
        style={styles.input}
        mode="outlined"
      />
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
      <Portal>
        <Modal
          visible={isImagePickerVisible}
          onDismiss={() => setImagePickerVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            Platform.OS === 'android' && styles.androidModalContainer
          ]}
          style={[
            styles.modal,
            Platform.OS === 'android' && styles.androidModal
          ]}
        >
          <Text style={styles.modalTitle}>选择图片</Text>
          <View style={styles.modalContent}>
            {Platform.OS === 'web' ? (
              <Button mode="contained" onPress={handleFileUpload} style={styles.modalButton} icon="file">
                选择文件
              </Button>
            ) : (
              <>
                <Button mode="contained" onPress={pickImage} style={styles.modalButton} icon="image">
                  从相册选择
                </Button>
                <Button mode="contained" onPress={takePhoto} style={styles.modalButton} icon="camera">
                  拍照
                </Button>
              </>
            )}
            <Button mode="outlined" onPress={() => setImagePickerVisible(false)} style={styles.modalButton} icon="close">
              取消
            </Button>
          </View>
        </Modal>
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
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onCancel} style={styles.button} icon="close">
          取消
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button} icon="check">
          {isEdit ? '保存' : '确认'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: 80,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  imageSection: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  imageButton: {
    marginBottom: 12,
    borderColor: '#1976d2',
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
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
}); 