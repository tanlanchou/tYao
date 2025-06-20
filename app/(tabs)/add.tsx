import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import DatePicker from 'react-native-date-picker';
import {
    Button,
    Chip,
    Dialog,
    IconButton,
    Modal,
    Portal,
    Switch,
    Text,
    TextInput,
    useTheme
} from "react-native-paper";
import { MedicineData } from "../components/MedicineForm";
import MedicineFormModal from "../components/MedicineFormModal";
import { WebDatePicker, WebTimePicker } from "../components/WebPickers";
import {
    deleteAlarm,
    getAllAlarms,
    initDatabase,
    saveAlarmWithMedicines,
    updateAlarmWithMedicines,
} from "../services/database";
import { isDesktopBrowser } from "../services/deviceDetection";
import { useNotification } from "../services/NotificationContext";
import {
    cancelAlarmNotifications,
    requestNotificationPermissions,
    scheduleAlarmNotifications,
} from "../services/notifications";
import vibrantColors from "../theme/colors"; // 导入vibrantColors
import { Alarm, CombinedData } from "../types";

interface ReminderData {
  reminderDate: Date;
  reminderTimes: Date[];
  repeatType: "single" | "weekly" | "monthly" | "custom";
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

export default function AddScreen() {
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;
  const navigation = useNavigation();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [alarmName, setAlarmName] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [medicines, setMedicines] = useState<CombinedData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const { showNotification } = useNotification();
  
  // 添加药品模态框状态
  const [medicineModalVisible, setMedicineModalVisible] = useState(false);

  // 时间提醒相关状态
  const [reminderDate, setReminderDate] = useState(new Date());
  const [reminderTimes, setReminderTimes] = useState<Date[]>([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);
  const [isRepeatModalVisible, setRepeatModalVisible] = useState(false);
  const [isCustomModalVisible, setCustomModalVisible] = useState(false);
  const [repeatType, setRepeatType] =
    useState<"single" | "weekly" | "monthly" | "custom" | "hourly">("single");
  const [customPeriod, setCustomPeriod] = useState<number>(7);
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [hourlyInterval, setHourlyInterval] = useState<number>(1);

  // 添加 Web 时间选择器状态
  const [isWebTimePickerVisible, setIsWebTimePickerVisible] = useState(false);

  // 添加 Web 日期选择器状态
  const [isWebDatePickerVisible, setIsWebDatePickerVisible] = useState(false);

  // 添加新的状态变量用于备用选择器
  const [showBackupDatePicker, setShowBackupDatePicker] = useState(false);
  const [showBackupTimePicker, setShowBackupTimePicker] = useState(false);
  const [useBackupPicker, setUseBackupPicker] = useState(!isDesktopBrowser()); // 非桌面浏览器使用备用选择器

  // 备用选择器的处理函数
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  // 自定义日期选择器
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempHour, setTempHour] = useState(new Date().getHours());
  const [tempMinute, setTempMinute] = useState(new Date().getMinutes());
  
  // 小时间隔选择器
  const [showHourlyIntervalPicker, setShowHourlyIntervalPicker] = useState(false);
  const [tempHourlyInterval, setTempHourlyInterval] = useState(1);
  const hourlyIntervalScrollRef = useRef<ScrollView>(null);
  
  // 添加ScrollView引用
  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  
  // 初始化临时日期时间并滚动到选中位置
  useEffect(() => {
    if (showCustomDatePicker) {
      const year = reminderDate.getFullYear();
      const month = reminderDate.getMonth() + 1;
      const day = reminderDate.getDate();
      
      setTempYear(year);
      setTempMonth(month);
      setTempDay(day);
      
      // 延迟滚动，确保组件已渲染
      setTimeout(() => {
        const yearIndex = year - (new Date().getFullYear() - 5);
        const monthIndex = month - 1;
        const dayIndex = day - 1;
        
        yearScrollRef.current?.scrollTo({ y: yearIndex * 40, animated: false });
        monthScrollRef.current?.scrollTo({ y: monthIndex * 40, animated: false });
        dayScrollRef.current?.scrollTo({ y: dayIndex * 40, animated: false });
      }, 100);
    }
  }, [showCustomDatePicker, reminderDate]);
  
  useEffect(() => {
    if (showCustomTimePicker && currentTimeIndex < reminderTimes.length) {
      const currentTime = reminderTimes[currentTimeIndex];
      const hour = currentTime.getHours();
      const minute = currentTime.getMinutes();
      
      setTempHour(hour);
      setTempMinute(minute);
      
      // 延迟滚动，确保组件已渲染
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: hour * 40, animated: false });
        minuteScrollRef.current?.scrollTo({ y: minute * 40, animated: false });
      }, 100);
    }
  }, [showCustomTimePicker, currentTimeIndex, reminderTimes]);
  
  const handleYearChange = (year: number) => {
    setTempYear(year);
    yearScrollRef.current?.scrollTo({ y: (year - (new Date().getFullYear() - 5)) * 40, animated: true });
  };
  
  const handleMonthChange = (month: number) => {
    setTempMonth(month);
    monthScrollRef.current?.scrollTo({ y: (month - 1) * 40, animated: true });
  };
  
  const handleDayChange = (day: number) => {
    setTempDay(day);
    dayScrollRef.current?.scrollTo({ y: (day - 1) * 40, animated: true });
  };
  
  const handleHourChange = (hour: number) => {
    setTempHour(hour);
    hourScrollRef.current?.scrollTo({ y: hour * 40, animated: true });
  };
  
  const handleMinuteChange = (minute: number) => {
    setTempMinute(minute);
    minuteScrollRef.current?.scrollTo({ y: minute * 40, animated: true });
  };

  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "编辑药品" : "添加闹钟",
      headerTitleAlign: "center",
    });
  }, [navigation, isEditMode]);

  // 初始化数据库
  useEffect(() => {
    initDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
      showNotification("数据库初始化失败", "error");
    });
  }, []);

  // 如果是编辑模式，加载闹钟数据
  useEffect(() => {
    if (isEditMode) {
      loadAlarm();
    } else {
      // 添加模式，设置默认值
      resetForm();
    }
  }, [id]);

  const resetForm = () => {
    setAlarmName("");
    setStatus(1);
    setMedicines([]);
    
    // 设置默认提醒时间
    const now = new Date();
    setReminderDate(now);
    
    // 设置默认提醒时间点（当前时间后30分钟）
    const defaultTime = new Date();
    defaultTime.setMinutes(defaultTime.getMinutes() + 30);
    setReminderTimes([defaultTime]);
    
    setRepeatType("single");
    setCustomPeriod(7);
    setCustomDays([]);
  };

  const loadAlarm = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const alarms = await getAllAlarms();
      const alarm = alarms.find((a: Alarm) => a.id === Number(id));
      
      if (!alarm) {
        router.replace("/");
        return;
      }
      
      setAlarm(alarm);
      setAlarmName(alarm.name);
      setStatus(alarm.status);
      
      // 设置提醒日期和时间
      setReminderDate(new Date(alarm.reminder_date));
      setReminderTimes(alarm.reminder_times.map((time: string) => new Date(time)));
      
      // 设置重复类型
      setRepeatType(alarm.repeat_type as "single" | "weekly" | "monthly" | "custom" | "hourly");
      
      // 设置自定义重复
      if (alarm.custom_period) {
        setCustomPeriod(alarm.custom_period);
      }
      
      if (alarm.custom_days) {
        setCustomDays(alarm.custom_days);
      }
      
      // 设置药品
      setMedicines(alarm.medicines.map((medicine: any) => ({
        id: medicine.id,
        name: medicine.name,
        image: medicine.image || '',
        dosage: medicine.dosage || '',
        reminder: {
          reminderDate: new Date(alarm.reminder_date),
          reminderTimes: alarm.reminder_times.map((time: string) => new Date(time)),
          repeatType: alarm.repeat_type as "single" | "weekly" | "monthly" | "custom",
          customPeriod: alarm.custom_period,
          customDays: alarm.custom_days,
          displayData: {
            reminderDateText: new Date(alarm.reminder_date).toLocaleDateString(),
            reminderTimesText: alarm.reminder_times.map((time: string) => {
              const date = new Date(time);
              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }).join(', '),
            repeatTypeText: '',
            customDaysText: '',
            fullDisplayText: ''
          }
        }
      })));
    } catch (error) {
      console.error('Failed to load alarm:', error);
      showNotification("加载闹钟数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlarm = async () => {
    try {
      // 检查闹钟名称
      if (!alarmName.trim()) {
        showNotification("请输入闹钟名称", "error");
        return;
      }

      // 检查提醒日期
      if (!(reminderDate instanceof Date) || isNaN(reminderDate.getTime())) {
        showNotification("请选择有效的提醒日期", "error");
        return;
      }

      // 检查时间
      if (reminderTimes.length === 0) {
        showNotification("请至少添加一个提醒时间", "error");
        return;
      }

      // 检查重复类型
      if (!repeatType) {
        showNotification("请选择重复类型", "error");
        return;
      }

      // 检查自定义重复
      if (
        repeatType === "custom" &&
        (!customPeriod || customDays.length === 0)
      ) {
        showNotification("请设置自定义重复周期和天数", "error");
        return;
      }

      // 检查药品
      if (medicines.length === 0) {
        showNotification("请至少添加一个药品", "error");
        return;
      }

      // 请求通知权限
      await requestNotificationPermissions();

      const alarmId = isEditMode ? Number(id) : 0;

      if (isEditMode) {
        // 先取消旧的通知
        await cancelAlarmNotifications(Number(id));
        
        // 如果闹钟启用，则注册新通知
        let notificationIds: string[] = [];
        if (status === 1) {
          notificationIds = await scheduleAlarmNotifications(
            Number(id),
            alarmName,
            reminderDate,
            reminderTimes,
            repeatType,
            repeatType === "custom" ? customPeriod : 
            repeatType === "hourly" ? hourlyInterval : null,
            repeatType === "custom" ? customDays : null,
            medicines.map(medicine => ({
              name: medicine.name,
              dosage: medicine.dosage
            }))
          );
        }
        
        await updateAlarmWithMedicines(
          Number(id),
          alarmName,
          reminderDate,
          reminderTimes,
          repeatType,
          repeatType === "custom" ? customPeriod : 
          repeatType === "hourly" ? hourlyInterval : null,
          repeatType === "custom" ? customDays : null,
          notificationIds,
          medicines.map(medicine => ({
            id: medicine.id,
            name: medicine.name,
            image: medicine.image,
            dosage: medicine.dosage
          })),
          status // 传递状态参数
        );
        showNotification('闹钟更新成功', 'success');
      } else {
        // 如果闹钟启用，则注册通知
        let notificationIds: string[] = [];
        
        // 获取当前所有闹钟，计算新ID
        const allAlarms = await getAllAlarms();
        const newAlarmId = allAlarms.length + 1;
        
        if (status === 1) {
          notificationIds = await scheduleAlarmNotifications(
            newAlarmId, // 使用计算的新闹钟ID
            alarmName,
            reminderDate,
            reminderTimes,
            repeatType,
            repeatType === "custom" ? customPeriod : 
            repeatType === "hourly" ? hourlyInterval : null,
            repeatType === "custom" ? customDays : null,
            medicines.map(medicine => ({
              name: medicine.name,
              dosage: medicine.dosage
            }))
          );
        }
        
        await saveAlarmWithMedicines(
          alarmName,
          reminderDate,
          reminderTimes,
          repeatType,
          repeatType === "custom" ? customPeriod : 
          repeatType === "hourly" ? hourlyInterval : null,
          repeatType === "custom" ? customDays : null,
          notificationIds,
          medicines.map(medicine => ({
            name: medicine.name,
            image: medicine.image,
            dosage: medicine.dosage
          })),
          status // 传递状态参数
        );
        showNotification('闹钟添加成功', 'success');
      }

      // 返回首页并刷新
      router.replace({
        pathname: "/",
        params: { refresh: Date.now() },
      });
    } catch (error) {
      console.error("Failed to save alarm:", error);
      showNotification(
        error instanceof Error ? error.message : "保存失败",
        "error"
      );
    }
  };

  const handleAddMedicine = (data: MedicineData) => {
    if (editingIndex !== null) {
      const newMedicines = [...medicines];
      newMedicines[editingIndex] = {
        ...data,
        id: medicines[editingIndex].id,
        reminder: {
          reminderDate,
          reminderTimes,
          repeatType,
          customPeriod,
          customDays,
          displayData: {
            reminderDateText: reminderDate
              .toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
              .replace(/\//g, "/"),
            reminderTimesText: reminderTimes
              .map((time) => {
                const hours = time.getHours().toString().padStart(2, "0");
                const minutes = time.getMinutes().toString().padStart(2, "0");
                return `${hours}:${minutes}`;
              })
              .join("、"),
            repeatTypeText:
              repeatType === "single"
                ? "单次提醒"
                : repeatType === "weekly"
                ? "每周重复"
                : repeatType === "monthly"
                ? "每月重复"
                : repeatType === "hourly"
                ? `每${hourlyInterval}小时重复`
                : `自定义重复周期(${customPeriod}天)`,
            customDaysText:
              repeatType === "custom" ? `第 ${customDays.join(", ")} 天` : "",
            fullDisplayText: "",
          },
        },
      };
      setMedicines(newMedicines);
      setEditingIndex(null);
      showNotification("编辑成功", "success");
    } else {
      setMedicines([
        ...medicines,
        {
          ...data,
          reminder: {
            reminderDate,
            reminderTimes,
            repeatType,
            customPeriod,
            customDays,
            displayData: {
              reminderDateText: reminderDate
                .toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\//g, "/"),
              reminderTimesText: reminderTimes
                .map((time) => {
                  const hours = time.getHours().toString().padStart(2, "0");
                  const minutes = time.getMinutes().toString().padStart(2, "0");
                  return `${hours}:${minutes}`;
                })
                .join("、"),
              repeatTypeText:
                repeatType === "single"
                  ? "单次提醒"
                  : repeatType === "weekly"
                  ? "每周重复"
                  : repeatType === "monthly"
                  ? "每月重复"
                  : repeatType === "hourly"
                  ? `每${hourlyInterval}小时重复`
                  : `自定义重复周期(${customPeriod}天)`,
              customDaysText:
                repeatType === "custom" ? `第 ${customDays.join(", ")} 天` : "",
              fullDisplayText: "",
            },
          },
        },
      ]);
      showNotification("添加成功", "success");
    }
    setMedicineModalVisible(false);
  };

  const handleStartAdding = () => {
    setEditingIndex(null);
    setMedicineModalVisible(true);
    scrollToBottom();
  };

  const handleEditMedicine = (index: number) => {
    setEditingIndex(index);
    setMedicineModalVisible(true);
    scrollToBottom();
  };

  const handleRequestDeleteMedicine = (index: number) => {
    if (isAdding) {
      showNotification("请先保存或取消当前操作", "warning");
      return;
    }
    setDeleteIndex(index);
  };

  const handleConfirmDeleteMedicine = () => {
    if (deleteIndex !== null) {
      setMedicines(medicines.filter((_, i) => i !== deleteIndex));
      setDeleteIndex(null);
      showNotification("删除成功", "success");
    }
  };

  const handleCancelDeleteMedicine = () => {
    setDeleteIndex(null);
  };

  const handleCancel = () => {
    setMedicineModalVisible(false);
    setEditingIndex(null);
  };

  // 修改日期选择处理函数
  const handleDatePress = () => {
    if (isDesktopBrowser()) {
      // 只有PC端浏览器才使用WebDatePicker
      setIsWebDatePickerVisible(true);
    } else {
      // 移动端（包括手机浏览器）使用自定义日期选择器
      setShowCustomDatePicker(true);
    }
  };

  const handleDateConfirm = (date: Date) => {
    setReminderDate(date);
    setDatePickerVisible(false);
    setIsWebDatePickerVisible(false);
    setShowBackupDatePicker(false);
  };

  // 修改时间选择处理函数
  const handleTimePress = (index: number) => {
    setCurrentTimeIndex(index);
    if (isDesktopBrowser()) {
      // 只有PC端浏览器才使用WebTimePicker
      setIsWebTimePickerVisible(true);
    } else {
      // 移动端（包括手机浏览器）使用自定义时间选择器
      setShowCustomTimePicker(true);
    }
  };

  const handleTimeConfirm = (time: Date) => {
    const newTimes = [...reminderTimes];
    newTimes[currentTimeIndex] = time;
    setReminderTimes(newTimes);
    setTimePickerVisible(false);
    setIsWebTimePickerVisible(false);
    setShowBackupTimePicker(false);
  };

  // 备用选择器的处理函数
  const handleBackupDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleBackupTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempTime(selectedTime);
    }
  };

  const handleBackupDateConfirm = () => {
    if (tempDate) {
      setReminderDate(tempDate);
    }
    setTempDate(null);
    setShowBackupDatePicker(false);
  };

  const handleBackupTimeConfirm = () => {
    if (tempTime) {
      const newTimes = [...reminderTimes];
      newTimes[currentTimeIndex] = tempTime;
      setReminderTimes(newTimes);
    }
    setTempTime(null);
    setShowBackupTimePicker(false);
  };

  const handleBackupCancel = () => {
    setTempDate(null);
    setTempTime(null);
    setShowBackupDatePicker(false);
    setShowBackupTimePicker(false);
  };

  const handleAddTime = () => {
    if (reminderTimes.length < 6) {
      setReminderTimes([...reminderTimes, new Date()]);
    } else {
      showNotification("最多只能添加6个时间", "warning");
    }
  };

  const handleRemoveTime = (index: number) => {
    if (reminderTimes.length > 1) {
      const newTimes = reminderTimes.filter((_, i) => i !== index);
      setReminderTimes(newTimes);
    } else {
      showNotification("至少需要保留一个时间", "warning");
    }
  };

  const handleRepeatTypeSelect = (type: "single" | "weekly" | "monthly" | "custom" | "hourly") => {
    setRepeatType(type);
    setRepeatModalVisible(false);
    if (type === "custom") {
      setCustomModalVisible(true);
    }
  };

  const handleCustomPeriodChange = (text: string) => {
    if (text === "") {
      setCustomPeriod(0);
      setCustomDays([]);
      return;
    }

    const period = parseInt(text, 10);
    if (!isNaN(period) && period >= 1 && period <= 14) {
      setCustomPeriod(period);
      setCustomDays(customDays.filter((day) => day <= period));
    }
  };

  const handleCustomDayToggle = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((d) => d !== day));
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

  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) {
        resetForm();
      }
    }, [isEditMode])
  );

  // 在 handleRepeatTypeSelect 函数后添加
  const handleHourlyIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval > 0) {
      setHourlyInterval(interval);
    }
  };

  // 添加删除闹钟的函数
  const [isDeleteAlarmDialogVisible, setIsDeleteAlarmDialogVisible] = useState(false);

  const handleDeleteAlarmConfirm = () => {
    setIsDeleteAlarmDialogVisible(true);
  };

  const handleDeleteAlarm = async () => {
    try {
      if (id) {
        // 取消所有相关的通知
        await cancelAlarmNotifications(Number(id));
        // 删除闹钟
        await deleteAlarm(Number(id));
        showNotification("闹钟已删除", "success");
        // 跳转到首页
        router.replace({
          pathname: "/(tabs)",
          params: { refresh: Date.now() }
        });
      }
    } catch (error) {
      console.error("Failed to delete alarm:", error);
      showNotification("删除失败，请重试", "error");
    } finally {
      setIsDeleteAlarmDialogVisible(false);
    }
  };

  const handleCancelDeleteAlarm = () => {
    setIsDeleteAlarmDialogVisible(false);
  };

  // 生成年、月、日、时、分的选项
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };
  
  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };
  
  const generateDays = () => {
    const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };
  
  const generateHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };
  
  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };
  
  // 生成小时间隔选项（1-24小时）
  const generateHourlyIntervals = () => {
    return Array.from({ length: 24 }, (_, i) => i + 1);
  };
  
  // 处理小时间隔变更
  const handleHourlyIntervalPickerChange = (interval: number) => {
    setTempHourlyInterval(interval);
    hourlyIntervalScrollRef.current?.scrollTo({ y: (interval - 1) * 40, animated: true });
  };
  
  // 初始化小时间隔选择器并滚动到选中位置
  useEffect(() => {
    if (showHourlyIntervalPicker) {
      setTempHourlyInterval(hourlyInterval);
      
      // 延迟滚动，确保组件已渲染
      setTimeout(() => {
        hourlyIntervalScrollRef.current?.scrollTo({ y: (hourlyInterval - 1) * 40, animated: false });
      }, 100);
    }
  }, [showHourlyIntervalPicker, hourlyInterval]);
  
  const renderPickerItem = (value: number, isSelected: boolean) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.pickerItem,
        isSelected && styles.pickerItemSelected
      ]}
    >
      <Text style={[
        styles.pickerItemText,
        isSelected && styles.pickerItemTextSelected
      ]}>
        {value.toString().padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );

  // 添加预设模板状态
  const [customTemplateType, setCustomTemplateType] = useState<string>('custom');
  
  // 处理预设模板选择
  const handleTemplateSelect = (template: string) => {
    setCustomTemplateType(template);
    
    switch (template) {
      case 'everyday':
        setCustomPeriod(1);
        setCustomDays([1]);
        break;
      case 'everyOtherDay':
        setCustomPeriod(2);
        setCustomDays([1]);
        break;
      case 'everyThirdDay':
        setCustomPeriod(3);
        setCustomDays([1]);
        break;
      case 'workdays':
        setCustomPeriod(7);
        setCustomDays([1, 2, 3, 4, 5]); // 周一到周五
        break;
      case 'weekends':
        setCustomPeriod(7);
        setCustomDays([6, 7]); // 周六和周日
        break;
      case 'custom':
        // 保持当前设置或重置
        break;
    }
  };
  
  // 获取自定义周期的描述文本
  const getCustomPeriodDescription = () => {
    switch (customTemplateType) {
      case 'everyday':
        return '每天';
      case 'everyOtherDay':
        return '每隔一天';
      case 'everyThirdDay':
        return '每隔两天';
      case 'workdays':
        return '工作日（周一至周五）';
      case 'weekends':
        return '周末（周六和周日）';
      case 'custom':
        if (customPeriod > 0 && customDays.length > 0) {
          if (customPeriod === 7 && customDays.length === 1) {
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            return `每周${dayNames[customDays[0]]}`;
          } else {
            return `每${customPeriod}天的第${customDays.join('、')}天`;
          }
        }
        return '自定义';
    }
  };
  
  // 定义更活泼的颜色方案
  const vibrantColors = {
    primary: '#FF6B6B', // 鲜红色
    secondary: '#4ECDC4', // 青绿色
    accent: '#FFD166', // 明黄色
    neutral: '#292F36', // 深灰色
    light: '#F7FFF7', // 浅白色
    success: '#06D6A0', // 绿色
    warning: '#FFD166', // 黄色
    error: '#EF476F', // 粉红色
    info: '#118AB2', // 蓝色
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.basicInfoSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            基本信息
          </Text>
          
          <TextInput
            label="闹钟名称"
            value={alarmName}
            onChangeText={setAlarmName}
            style={[styles.input, styles.nameInput]}
            maxLength={20}
          />
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>闹钟状态</Text>
            <View style={styles.switchContainer}>
              <Text style={status === 1 ? styles.activeStatus : styles.inactiveStatus}>
                {status === 1 ? '已启用' : '已禁用'}
              </Text>
              <Switch
                value={status === 1}
                onValueChange={(value) => setStatus(value ? 1 : 0)}
                color="#1976d2"
              />
            </View>
          </View>
        </View>

        <View style={styles.reminderSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            提醒设置
          </Text>
          <Button
            mode="outlined"
            onPress={handleDatePress}
            style={[styles.input, styles.buttonWithShadow]}
            icon="calendar"
          >
            提醒日期: {reminderDate.toLocaleDateString()}
          </Button>
          <View style={styles.timesContainer}>
            {reminderTimes.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <Button
                  mode="outlined"
                  onPress={() => handleTimePress(index)}
                  style={styles.timeButton}
                  icon="clock"
                >
                  时间 {index + 1}:{" "}
                  {time.toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Button>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleRemoveTime(index)}
                  style={styles.timeDeleteButton}
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
            style={[styles.input, styles.buttonWithShadow]}
            icon="repeat"
          >
            重复类型:{" "}
            {repeatType === "single"
              ? "单次提醒"
              : repeatType === "weekly"
              ? "每周重复"
              : repeatType === "monthly"
              ? "每月重复"
              : repeatType === "hourly"
              ? `每${hourlyInterval}小时重复`
              : "自定义重复周期"}
          </Button>
          {repeatType === "hourly" && (
            <View style={styles.hourlyInputContainer}>
              {isDesktopBrowser() ? (
                <TextInput
                  label="重复间隔（小时）"
                  value={hourlyInterval.toString()}
                  onChangeText={handleHourlyIntervalChange}
                  keyboardType="numeric"
                  style={[styles.hourlyInput, styles.inputWithShadow]}
                />
              ) : (
                <Button
                  mode="outlined"
                  onPress={() => setShowHourlyIntervalPicker(true)}
                  style={[styles.input, styles.buttonWithShadow]}
                  icon="clock"
                >
                  重复间隔（小时）: {hourlyInterval}
                </Button>
              )}
            </View>
          )}
          {repeatType === "custom" && (
            <Button
              mode="outlined"
              onPress={() => setCustomModalVisible(true)}
              style={[styles.input, styles.buttonWithShadow]}
              icon="calendar-clock"
            >
              自定义重复: {getCustomPeriodDescription()}
            </Button>
          )}
        </View>

        {/* 药品列表 */}
        <View style={styles.medicineSection}>
          <Text style={styles.sectionTitle}>药品列表</Text>
          {medicines.length === 0 ? (
            <View style={styles.emptyMedicineList}>
              <Text style={styles.emptyText}>暂无药品，请点击下方按钮添加</Text>
            </View>
          ) : (
            medicines.map((medicine, index) => (
              <View key={index} style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <View style={styles.medicineActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEditMedicine(index)}
                      style={styles.editButton}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleRequestDeleteMedicine(index)}
                      style={styles.deleteIcon}
                    />
                  </View>
                </View>
                {medicine.image && (
                  <Image
                    source={{ uri: medicine.image }}
                    style={styles.medicineImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.medicineInfoRow}>
                  {medicine.dosage && (
                    <Chip style={styles.chip}>
                      <Text style={styles.chipText}>剂量: {medicine.dosage}</Text>
                    </Chip>
                  )}
                </View>
              </View>
            ))
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              icon="plus"
              style={[styles.addButton, styles.actionButton]}
              onPress={handleStartAdding}
            >
              添加药品
            </Button>
            {medicines.length > 0 && (
              <Button
                mode="contained"
                icon="content-save"
                style={[styles.saveButton, styles.actionButton]}
                onPress={handleSaveAlarm}
              >
                {isEditMode ? "保存修改" : "保存闹钟"}
              </Button>
            )}
            {isEditMode && (
              <Button
                mode="contained"
                icon="delete"
                style={[styles.deleteButton, styles.actionButton]}
                onPress={handleDeleteAlarmConfirm}
              >
                删除闹钟
              </Button>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 药品表单模态框 */}
      <MedicineFormModal
        visible={medicineModalVisible}
        onDismiss={handleCancel}
        onSubmit={handleAddMedicine}
        initialData={editingIndex !== null ? medicines[editingIndex] : undefined}
        isEdit={editingIndex !== null}
      />

      <Portal>
        <Dialog
          visible={deleteIndex !== null}
          onDismiss={handleCancelDeleteMedicine}
          style={styles.deleteDialog}
        >
          <Dialog.Title style={styles.deleteDialogTitle}>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.deleteDialogContent}>确定要删除该药品吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.deleteDialogActions}>
            <Button 
              onPress={handleCancelDeleteMedicine}
              mode="outlined"
              style={styles.deleteDialogButton}
            >
              取消
            </Button>
            <Button
              onPress={handleConfirmDeleteMedicine}
              mode="contained"
              buttonColor={vibrantColors.error}
              textColor="#fff"
              style={styles.deleteDialogButton}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={isDeleteAlarmDialogVisible}
          onDismiss={handleCancelDeleteAlarm}
          style={styles.deleteDialog}
        >
          <Dialog.Title style={styles.deleteDialogTitle}>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.deleteDialogContent}>确定要删除这个闹钟吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.deleteDialogActions}>
            <Button 
              onPress={handleCancelDeleteAlarm}
              mode="outlined"
              style={styles.deleteDialogButton}
            >
              取消
            </Button>
            <Button 
              onPress={handleDeleteAlarm}
              mode="contained"
              buttonColor={vibrantColors.error}
              textColor="#fff"
              style={styles.deleteDialogButton}
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Modal
          visible={isRepeatModalVisible}
          onDismiss={() => setRepeatModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            Platform.OS === "android" && styles.androidModalContainer,
          ]}
          style={[
            styles.modal,
            Platform.OS === "android" && styles.androidModal,
          ]}
        >
          <Text style={styles.modalTitle}>请选择重复类型</Text>
          <View style={styles.modalContent}>
            <Button
              mode="contained"
              style={styles.modalButton}
              onPress={() => handleRepeatTypeSelect("single")}
              icon="bell"
            >
              单次提醒
            </Button>
            <Button
              mode="contained"
              style={styles.modalButton}
              onPress={() => handleRepeatTypeSelect("hourly")}
              icon="clock-outline"
            >
              每隔几小时
            </Button>
            <Button
              mode="contained"
              style={styles.modalButton}
              onPress={() => handleRepeatTypeSelect("weekly")}
              icon="calendar-week"
            >
              每周重复
            </Button>
            <Button
              mode="contained"
              style={styles.modalButton}
              onPress={() => handleRepeatTypeSelect("monthly")}
              icon="calendar-month"
            >
              每月重复
            </Button>
            <Button
              mode="contained"
              style={styles.modalButton}
              onPress={() => handleRepeatTypeSelect("custom")}
              icon="calendar-clock"
            >
              自定义重复周期
            </Button>
            <Button
              mode="outlined"
              style={styles.modalButton}
              onPress={() => setRepeatModalVisible(false)}
              icon="close"
            >
              取消
            </Button>
          </View>
        </Modal>
        <Modal
          visible={isCustomModalVisible}
          onDismiss={() => setCustomModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            Platform.OS === "android" && styles.androidModalContainer,
          ]}
          style={[
            styles.modal,
            Platform.OS === "android" && styles.androidModal,
          ]}
        >
          <Text style={styles.modalTitle}>自定义重复周期</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>选择常用模板</Text>
              <View style={styles.templateContainer}>
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    customTemplateType === 'everyday' && styles.selectedTemplateChip,
                    { backgroundColor: customTemplateType === 'everyday' ? vibrantColors.primary : 'rgba(255, 107, 107, 0.1)' }
                  ]}
                  onPress={() => handleTemplateSelect('everyday')}
                >
                  <Text style={[
                    styles.templateChipText,
                    customTemplateType === 'everyday' && styles.selectedTemplateChipText,
                    { color: customTemplateType === 'everyday' ? 'white' : vibrantColors.primary }
                  ]}>每天</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    customTemplateType === 'everyOtherDay' && styles.selectedTemplateChip,
                    { backgroundColor: customTemplateType === 'everyOtherDay' ? vibrantColors.secondary : 'rgba(78, 205, 196, 0.1)' }
                  ]}
                  onPress={() => handleTemplateSelect('everyOtherDay')}
                >
                  <Text style={[
                    styles.templateChipText,
                    customTemplateType === 'everyOtherDay' && styles.selectedTemplateChipText,
                    { color: customTemplateType === 'everyOtherDay' ? 'white' : vibrantColors.secondary }
                  ]}>每隔一天</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    customTemplateType === 'everyThirdDay' && styles.selectedTemplateChip,
                    { backgroundColor: customTemplateType === 'everyThirdDay' ? vibrantColors.accent : 'rgba(255, 209, 102, 0.1)' }
                  ]}
                  onPress={() => handleTemplateSelect('everyThirdDay')}
                >
                  <Text style={[
                    styles.templateChipText,
                    customTemplateType === 'everyThirdDay' && styles.selectedTemplateChipText,
                    { color: customTemplateType === 'everyThirdDay' ? 'white' : vibrantColors.accent }
                  ]}>每隔两天</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    customTemplateType === 'workdays' && styles.selectedTemplateChip,
                    { backgroundColor: customTemplateType === 'workdays' ? vibrantColors.info : 'rgba(17, 138, 178, 0.1)' }
                  ]}
                  onPress={() => handleTemplateSelect('workdays')}
                >
                  <Text style={[
                    styles.templateChipText,
                    customTemplateType === 'workdays' && styles.selectedTemplateChipText,
                    { color: customTemplateType === 'workdays' ? 'white' : vibrantColors.info }
                  ]}>工作日</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    customTemplateType === 'weekends' && styles.selectedTemplateChip,
                    { backgroundColor: customTemplateType === 'weekends' ? vibrantColors.success : 'rgba(6, 214, 160, 0.1)' }
                  ]}
                  onPress={() => handleTemplateSelect('weekends')}
                >
                  <Text style={[
                    styles.templateChipText,
                    customTemplateType === 'weekends' && styles.selectedTemplateChipText,
                    { color: customTemplateType === 'weekends' ? 'white' : vibrantColors.success }
                  ]}>周末</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.templateChip,
                    customTemplateType === 'custom' && styles.selectedTemplateChip,
                    { backgroundColor: customTemplateType === 'custom' ? vibrantColors.error : 'rgba(239, 71, 111, 0.1)' }
                  ]}
                  onPress={() => handleTemplateSelect('custom')}
                >
                  <Text style={[
                    styles.templateChipText,
                    customTemplateType === 'custom' && styles.selectedTemplateChipText,
                    { color: customTemplateType === 'custom' ? 'white' : vibrantColors.error }
                  ]}>自定义</Text>
                </TouchableOpacity>
              </View>
              
              {customTemplateType === 'custom' && (
                <>
                  <Text style={[styles.modalSubtitle, {color: vibrantColors.error}]}>自定义周期设置</Text>
                  <View style={styles.customPeriodContainer}>
                    <Text style={styles.customPeriodLabel}>重复周期：</Text>
                    <View style={styles.customPeriodButtonGroup}>
                      {[1, 2, 3, 4, 5, 6, 7, 14].map((period) => (
                        <TouchableOpacity
                          key={period}
                          style={[
                            styles.periodButton,
                            customPeriod === period && styles.selectedPeriodButton,
                            { backgroundColor: customPeriod === period ? vibrantColors.error : 'rgba(239, 71, 111, 0.1)' }
                          ]}
                          onPress={() => {
                            setCustomPeriod(period);
                            if (!customDays.length || customDays[0] > period) {
                              setCustomDays([1]);
                            } else {
                              setCustomDays(customDays.filter(day => day <= period));
                            }
                          }}
                        >
                          <Text style={[
                            styles.periodButtonText,
                            customPeriod === period && styles.selectedPeriodButtonText,
                            { color: customPeriod === period ? 'white' : vibrantColors.error }
                          ]}>
                            {period === 1 ? '每天' : period === 7 ? '每周' : period === 14 ? '每两周' : `${period}天`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <Text style={[styles.modalSubtitle, {color: vibrantColors.error}]}>选择提醒日</Text>
                  <View style={styles.daysContainer}>
                    {Array.from({ length: customPeriod }, (_, i) => i + 1).map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          customDays.includes(day) && styles.selectedDayButton,
                          { backgroundColor: customDays.includes(day) ? vibrantColors.error : 'rgba(239, 71, 111, 0.1)' }
                        ]}
                        onPress={() => handleCustomDayToggle(day)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          customDays.includes(day) && styles.selectedDayButtonText,
                          { color: customDays.includes(day) ? 'white' : vibrantColors.error }
                        ]}>
                          {customPeriod === 7 ? 
                            ['日', '一', '二', '三', '四', '五', '六'][day % 7 || 7 - 1] : 
                            `${day}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              
              <View style={[styles.summaryContainer, {borderLeftColor: vibrantColors.primary, backgroundColor: 'rgba(255, 107, 107, 0.1)'}]}>
                <Text style={styles.summaryText}>
                  当前设置: {getCustomPeriodDescription()}
                </Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalButtonContainer}>
            <Button
              mode="outlined"
              style={[styles.modalButton, { flex: 1, borderColor: vibrantColors.neutral }]}
              onPress={() => setCustomModalVisible(false)}
              icon="close"
              textColor={vibrantColors.neutral}
            >
              取消
            </Button>
            <Button
              mode="contained"
              style={[styles.modalButton, { flex: 1, backgroundColor: vibrantColors.primary }]}
              onPress={() => setCustomModalVisible(false)}
              icon="check"
            >
              确定
            </Button>
          </View>
        </Modal>
        {/* 原生日期时间选择器，现在只在非Web环境且不使用自定义选择器时显示 */}
        {Platform.OS !== "web" && !showCustomDatePicker && !showCustomTimePicker && (
          <DatePicker
            modal
            open={isDatePickerVisible}
            date={reminderDate}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setDatePickerVisible(false)}
            title="选择日期"
            confirmText="确定"
            cancelText="取消"
            locale="zh"
          />
        )}
        {Platform.OS !== "web" && !showCustomDatePicker && !showCustomTimePicker && (
          <DatePicker
            modal
            open={isTimePickerVisible}
            date={reminderTimes[currentTimeIndex] || new Date()}
            mode="time"
            onConfirm={handleTimeConfirm}
            onCancel={() => setTimePickerVisible(false)}
            title="选择时间"
            confirmText="确定"
            cancelText="取消"
            locale="zh"
          />
        )}
        
        {/* 自定义日期选择器对话框 */}
        <Dialog
          visible={showCustomDatePicker}
          onDismiss={() => setShowCustomDatePicker(false)}
          style={styles.customPickerDialog}
        >
          <Dialog.Title>选择日期</Dialog.Title>
          <Dialog.Content>
            <View style={styles.customPickerContainer}>
              <View style={styles.customPickerColumn}>
                <Text style={styles.customPickerLabel}>年</Text>
                <ScrollView 
                  ref={yearScrollRef}
                  style={styles.customPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContentContainer}
                >
                  {generateYears().map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        year === tempYear && styles.pickerItemSelected
                      ]}
                      onPress={() => handleYearChange(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        year === tempYear && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.customPickerColumn}>
                <Text style={styles.customPickerLabel}>月</Text>
                <ScrollView 
                  ref={monthScrollRef}
                  style={styles.customPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContentContainer}
                >
                  {generateMonths().map(month => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        month === tempMonth && styles.pickerItemSelected
                      ]}
                      onPress={() => handleMonthChange(month)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        month === tempMonth && styles.pickerItemTextSelected
                      ]}>
                        {month.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.customPickerColumn}>
                <Text style={styles.customPickerLabel}>日</Text>
                <ScrollView 
                  ref={dayScrollRef}
                  style={styles.customPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContentContainer}
                >
                  {generateDays().map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        day === tempDay && styles.pickerItemSelected
                      ]}
                      onPress={() => handleDayChange(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        day === tempDay && styles.pickerItemTextSelected
                      ]}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCustomDatePicker(false)}>取消</Button>
            <Button onPress={() => {
              const newDate = new Date(tempYear, tempMonth - 1, tempDay);
              setReminderDate(newDate);
              setShowCustomDatePicker(false);
            }}>确定</Button>
          </Dialog.Actions>
        </Dialog>
        
        {/* 自定义时间选择器对话框 */}
        <Dialog
          visible={showCustomTimePicker}
          onDismiss={() => setShowCustomTimePicker(false)}
          style={styles.customPickerDialog}
        >
          <Dialog.Title>选择时间</Dialog.Title>
          <Dialog.Content>
            <View style={styles.customPickerContainer}>
              <View style={styles.customPickerColumn}>
                <Text style={styles.customPickerLabel}>时</Text>
                <ScrollView 
                  ref={hourScrollRef}
                  style={styles.customPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContentContainer}
                >
                  {generateHours().map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        hour === tempHour && styles.pickerItemSelected
                      ]}
                      onPress={() => handleHourChange(hour)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        hour === tempHour && styles.pickerItemTextSelected
                      ]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.customPickerColumn}>
                <Text style={styles.customPickerLabel}>分</Text>
                <ScrollView 
                  ref={minuteScrollRef}
                  style={styles.customPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContentContainer}
                >
                  {generateMinutes().map(minute => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        minute === tempMinute && styles.pickerItemSelected
                      ]}
                      onPress={() => handleMinuteChange(minute)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        minute === tempMinute && styles.pickerItemTextSelected
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCustomTimePicker(false)}>取消</Button>
            <Button onPress={() => {
              const currentTime = new Date(reminderTimes[currentTimeIndex]);
              const newTime = new Date(
                currentTime.getFullYear(),
                currentTime.getMonth(),
                currentTime.getDate(),
                tempHour,
                tempMinute
              );
              
              const newTimes = [...reminderTimes];
              newTimes[currentTimeIndex] = newTime;
              setReminderTimes(newTimes);
              setShowCustomTimePicker(false);
            }}>确定</Button>
          </Dialog.Actions>
        </Dialog>
        {/* Web端选择器，只在桌面浏览器中显示 */}
        {isDesktopBrowser() && (
          <WebDatePicker
            visible={isWebDatePickerVisible}
            onClose={() => setIsWebDatePickerVisible(false)}
            onConfirm={handleDateConfirm}
            initialDate={reminderDate}
          />
        )}
        {isDesktopBrowser() && (
          <WebTimePicker
            visible={isWebTimePickerVisible}
            onClose={() => setIsWebTimePickerVisible(false)}
            onConfirm={handleTimeConfirm}
            initialTime={reminderTimes[currentTimeIndex] || new Date()}
          />
        )}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: Platform.OS === 'web' ? 20 : 40, // 网页端20px，移动端40px
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  reminderSection: {
    marginBottom: 20,
    backgroundColor: "#e6f7ed",
    padding: 16,
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
  medicineSection: {
    marginBottom: 20,
    backgroundColor: "#f9f0eb",
    padding: 16,
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  emptyMedicineList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    color: "#666",
  },
  medicineCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  medicineName: {
    fontWeight: "bold",
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  medicineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButton: {
    marginHorizontal: 0,
    marginVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    marginLeft: 8,
  },
  medicineImage: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  medicineInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#e3f2fd",
    marginBottom: 4,
    maxWidth: "100%",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipText: {
    color: "#1976d2",
    fontSize: 14,
    flexWrap: "wrap",
    lineHeight: 20,
  },
  addButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#FF8C00", // 橙色，与药品列表背景色调一致
    borderRadius: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#4CAF50", // 绿色，表示保存操作
    borderRadius: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  deleteButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#F44336", // 红色，表示删除操作
    borderRadius: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButton: {
    width: "100%", // 确保按钮宽度占满整个容器
    height: 50, // 增加高度使按钮更加明显
  },
  topNoticeBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: vibrantColors.primary,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 4,
  },
  topNoticeText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timesContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 16,
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
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  timeButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: vibrantColors.primary,
    borderWidth: 1,
  },
  timeDeleteButton: {
    backgroundColor: "#ffebee",
    marginLeft: 8,
  },
  addTimeButton: {
    marginTop: 12,
    backgroundColor: "#e3f2fd",
    borderColor: vibrantColors.primary,
    borderWidth: 1,
  },
  selectedDateText: {
    marginTop: 12,
    color: vibrantColors.primary,
    fontSize: 16,
    fontWeight: "500",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  androidModal: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    margin: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    margin: 20,
    borderRadius: 16,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  androidModalContainer: {
    margin: 30,
    maxWidth: 400,
    alignSelf: "center",
  },
  modalContent: {
    width: "100%",
    paddingBottom: 20,
  },
  modalButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    elevation: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: vibrantColors.primary, // 使用主题色
  },
  hourlyInputContainer: {
    marginTop: 10,
  },
  hourlyInput: {
    backgroundColor: 'transparent',
  },
  basicInfoSection: {
    marginBottom: 20,
    backgroundColor: "#e8f4fd",
    padding: 16,
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
  statusContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeStatus: {
    color: vibrantColors.primary,
    marginRight: 8,
    fontSize: 14,
  },
  inactiveStatus: {
    color: "#757575",
    marginRight: 8,
    fontSize: 14,
  },
  nameInput: {
    backgroundColor: "#fff",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonWithShadow: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputWithShadow: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
    backgroundColor: "#f0f0f0",
    padding: 16,
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
  pickerDialog: {
    backgroundColor: 'white',
    borderRadius: 10,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  picker: {
    width: '100%',
  },
  customPickerDialog: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '80%',
    alignSelf: 'center',
  },
  customPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 200,
  },
  customPickerColumn: {
    alignItems: 'center',
    height: '100%',
    flex: 1,
  },
  customPickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customPickerScroll: {
    height: 150,
    width: '100%',
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pickerItemSelected: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 18,
  },
  pickerItemTextSelected: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  pickerContentContainer: {
    paddingVertical: 55, // 添加上下内边距，使选中项可以居中显示
  },
  templateContainer: {
    marginVertical: 10,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  templateChip: {
    padding: 12,
    borderWidth: 0,
    borderRadius: 12,
    width: '48%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedTemplateChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  templateChipText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedTemplateChipText: {
    fontWeight: 'bold',
  },
  customPeriodContainer: {
    marginBottom: 20,
  },
  customPeriodLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  customPeriodButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  periodButton: {
    padding: 8,
    borderWidth: 0,
    borderRadius: 10,
    minWidth: 70,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedPeriodButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPeriodButtonText: {
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  dayButton: {
    padding: 8,
    borderWidth: 0,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedDayButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedDayButtonText: {
    fontWeight: 'bold',
  },
  summaryContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: vibrantColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: vibrantColors.primary,
    textAlign: 'center',
  },
  modalScrollView: {
    width: '100%',
    maxHeight: Platform.OS === 'android' ? '65%' : '75%',
  },
  modalButtonContainer: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
});
