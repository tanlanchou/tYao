import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键
const ALARMS_KEY = '@medicine_reminder_alarms';
const MEDICINES_KEY = '@medicine_reminder_medicines';

// 存储接口
interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

// 统一用 AsyncStorage 持久化
const storage: Storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 检查是否已经初始化
    const alarms = await storage.getItem(ALARMS_KEY);
    const medicines = await storage.getItem(MEDICINES_KEY);

    if (!alarms) {
      await storage.setItem(ALARMS_KEY, JSON.stringify([]));
    }
    if (!medicines) {
      await storage.setItem(MEDICINES_KEY, JSON.stringify([]));
    }

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// 保存闹钟和药品数据
export const saveAlarmWithMedicines = async (
  alarmName: string,
  reminderDate: Date,
  reminderTimes: Date[],
  repeatType: string,
  customPeriod: number | null,
  customDays: number[] | null,
  notification_ids: string[],
  medicines: Array<{
    name: string;
    image?: string;
    dosage?: string;
  }>
) => {
  try {
    // 获取现有数据
    const alarmsStr = await storage.getItem(ALARMS_KEY);
    const medicinesStr = await storage.getItem(MEDICINES_KEY);
    const alarms = JSON.parse(alarmsStr || '[]');
    const existingMedicines = JSON.parse(medicinesStr || '[]');

    // 创建新闹钟
    const newAlarm = {
      id: alarms.length + 1,
      name: alarmName,
      reminder_date: reminderDate.toISOString(),
      reminder_times: JSON.stringify(reminderTimes.map(time => time.toISOString())),
      repeat_type: repeatType,
      custom_period: customPeriod,
      custom_days: customDays ? JSON.stringify(customDays) : null,
      notification_ids: JSON.stringify(notification_ids),
      created_at: new Date().toISOString()
    };

    // 添加新闹钟
    alarms.push(newAlarm);
    await storage.setItem(ALARMS_KEY, JSON.stringify(alarms));

    // 添加新药品
    const newMedicines = medicines.map(medicine => ({
      id: existingMedicines.length + 1,
      alarm_id: newAlarm.id,
      name: medicine.name,
      image: medicine.image || '',
      dosage: medicine.dosage || '',
      created_at: new Date().toISOString()
    }));

    existingMedicines.push(...newMedicines);
    await storage.setItem(MEDICINES_KEY, JSON.stringify(existingMedicines));

    console.log('Alarm and medicines saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving alarm and medicines:', error);
    throw error;
  }
};

// 获取所有闹钟数据
export const getAllAlarms = async () => {
  try {
    const alarmsStr = await storage.getItem(ALARMS_KEY);
    const medicinesStr = await storage.getItem(MEDICINES_KEY);
    const alarms = JSON.parse(alarmsStr || '[]');
    const medicines = JSON.parse(medicinesStr || '[]');

    // 处理闹钟数据
    const processedAlarms = alarms.map((alarm: any) => {
      const alarmMedicines = medicines.filter((m: any) => m.alarm_id === alarm.id);
      return {
        ...alarm,
        reminder_times: JSON.parse(alarm.reminder_times),
        custom_days: alarm.custom_days ? JSON.parse(alarm.custom_days) : null,
        notification_ids: JSON.parse(alarm.notification_ids || '[]'),
        medicines: alarmMedicines.map((medicine: any) => ({
          id: medicine.id,
          name: medicine.name,
          image: medicine.image || null,
          dosage: medicine.dosage || null
        }))
      };
    });

    return processedAlarms;
  } catch (error) {
    console.error('Error getting alarms:', error);
    throw error;
  }
};

// 删除闹钟及其关联的药品
export const deleteAlarm = async (alarmId: number) => {
  try {
    const alarmsStr = await storage.getItem(ALARMS_KEY);
    const medicinesStr = await storage.getItem(MEDICINES_KEY);
    const alarms = JSON.parse(alarmsStr || '[]');
    const medicines = JSON.parse(medicinesStr || '[]');

    // 删除闹钟
    const newAlarms = alarms.filter((a: any) => a.id !== alarmId);
    await storage.setItem(ALARMS_KEY, JSON.stringify(newAlarms));

    // 删除关联的药品
    const newMedicines = medicines.filter((m: any) => m.alarm_id !== alarmId);
    await storage.setItem(MEDICINES_KEY, JSON.stringify(newMedicines));

    return true;
  } catch (error) {
    console.error('Error deleting alarm:', error);
    throw error;
  }
};

// 更新闹钟和药品数据
export const updateAlarmWithMedicines = async (
  alarmId: number,
  alarmName: string,
  reminderDate: Date,
  reminderTimes: Date[],
  repeatType: string,
  customPeriod: number | null,
  customDays: number[] | null,
  notification_ids: string[],
  medicines: Array<{
    id?: number;
    name: string;
    image?: string;
    dosage?: string;
  }>
) => {
  try {
    const alarmsStr = await storage.getItem(ALARMS_KEY);
    const medicinesStr = await storage.getItem(MEDICINES_KEY);
    const alarms = JSON.parse(alarmsStr || '[]');
    const existingMedicines = JSON.parse(medicinesStr || '[]');

    // 更新闹钟
    const alarmIndex = alarms.findIndex((a: any) => a.id === alarmId);
    if (alarmIndex !== -1) {
      alarms[alarmIndex] = {
        ...alarms[alarmIndex],
        name: alarmName,
        reminder_date: reminderDate.toISOString(),
        reminder_times: JSON.stringify(reminderTimes.map(time => time.toISOString())),
        repeat_type: repeatType,
        custom_period: customPeriod,
        custom_days: customDays ? JSON.stringify(customDays) : null,
        notification_ids: JSON.stringify(notification_ids)
      };
      await storage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    }

    // 删除旧的药品
    const newMedicines = existingMedicines.filter((m: any) => m.alarm_id !== alarmId);

    // 添加新的药品
    const updatedMedicines = medicines.map(medicine => ({
      id: existingMedicines.length + 1,
      alarm_id: alarmId,
      name: medicine.name,
      image: medicine.image || '',
      dosage: medicine.dosage || '',
      created_at: new Date().toISOString()
    }));

    newMedicines.push(...updatedMedicines);
    await storage.setItem(MEDICINES_KEY, JSON.stringify(newMedicines));

    console.log('Alarm and medicines updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating alarm and medicines:', error);
    throw error;
  }
}; 