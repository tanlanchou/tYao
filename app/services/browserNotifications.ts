import { Platform } from 'react-native';
import { getAllAlarms } from './database';

// 检查是否为浏览器环境
export const isBrowser = Platform.OS === 'web';

// 检查浏览器是否支持通知
export const isBrowserNotificationSupported = isBrowser && typeof window !== 'undefined' && 'Notification' in window;

// 通知检查间隔（毫秒）
const CHECK_INTERVAL = 60000; // 1分钟

// 用于存储定时器的变量
let notificationInterval: ReturnType<typeof setInterval> | null = null;

// 检查浏览器通知权限状态
export function getBrowserNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!isBrowserNotificationSupported) {
    return 'unsupported';
  }
  
  return Notification.permission;
}

// 请求浏览器通知权限
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported) {
    console.warn('当前浏览器不支持通知功能');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('请求通知权限时出错:', error);
      return false;
    }
  }
  
  return false;
}

// 显示浏览器通知
export function showBrowserNotification(title: string, body: string, data?: any) {
  if (!isBrowserNotificationSupported || Notification.permission !== 'granted') {
    return;
  }
  
  try {
    const notification = new Notification(title, {
      body,
      icon: '/icon.png', // 应用图标路径
      data
    });
    
    // 添加点击事件
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  } catch (error) {
    console.error('显示通知时出错:', error);
    return null;
  }
}

// 检查是否有需要触发的闹钟
async function checkForDueAlarms() {
  try {
    const alarms = await getAllAlarms();
    const now = new Date();
    
    for (const alarm of alarms) {
      const reminderDate = new Date(alarm.reminder_date);
      const reminderTimes = alarm.reminder_times.map((timeStr: string) => new Date(timeStr));
      
      // 根据重复类型判断今天是否应该提醒
      const shouldNotifyToday = shouldNotifyOnDate(reminderDate, now, alarm.repeat_type, alarm.custom_period, alarm.custom_days);
      
      if (shouldNotifyToday) {
        // 检查是否有在当前时间附近的提醒
        for (const reminderTime of reminderTimes) {
          const reminderDateTime = new Date(now);
          reminderDateTime.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);
          
          // 检查是否在当前分钟内
          const diff = Math.abs(now.getTime() - reminderDateTime.getTime());
          if (diff < CHECK_INTERVAL) {
            // 构建药品列表
            const medicineList = alarm.medicines
              .map((med: any) => `${med.name}${med.dosage ? ` (${med.dosage})` : ''}`)
              .join('\n');
            
            // 显示通知
            showBrowserNotification(
              `服药提醒: ${alarm.name}`,
              `该吃药了！\n${medicineList}`,
              { alarmId: alarm.id }
            );
            
            console.log('浏览器通知已触发:', {
              '闹钟ID': alarm.id,
              '闹钟名称': alarm.name,
              '提醒时间': reminderDateTime.toLocaleString()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('检查闹钟通知时出错:', error);
  }
}

// 判断指定日期是否应该通知
function shouldNotifyOnDate(
  reminderDate: Date,
  currentDate: Date,
  repeatType: string,
  customPeriod: number | null,
  customDays: number[] | null
): boolean {
  // 日期格式化为YYYY-MM-DD以便比较
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const reminderDateStr = formatDate(reminderDate);
  const currentDateStr = formatDate(currentDate);
  
  switch (repeatType) {
    case 'single':
      // 单次提醒，日期必须匹配
      return reminderDateStr === currentDateStr;
      
    case 'weekly':
      // 每周提醒，星期几必须匹配
      if (reminderDate > currentDate) return false;
      return reminderDate.getDay() === currentDate.getDay();
      
    case 'monthly':
      // 每月提醒，日期必须匹配
      if (reminderDate > currentDate) return false;
      return reminderDate.getDate() === currentDate.getDate();
      
    case 'custom':
      if (!customPeriod || !customDays) return false;
      
      // 对于自定义周期，需要计算当前日期与开始日期之间的天数
      const diffTime = Math.abs(currentDate.getTime() - reminderDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // 计算当前日期是否在周期内的指定天数
      const dayInCycle = diffDays % customPeriod;
      return customDays.includes(dayInCycle + 1); // +1 因为customDays从1开始

    case 'hourly':
      if (!customPeriod) return false;
      
      // 对于小时重复，需要计算从开始时间到现在的小时数
      const hoursSinceStart = Math.floor((currentDate.getTime() - reminderDate.getTime()) / (1000 * 60 * 60));
      
      // 如果还没到开始时间，返回false
      if (hoursSinceStart < 0) return false;
      
      // 检查是否是间隔小时的整数倍
      return hoursSinceStart % customPeriod === 0;
      
    default:
      return false;
  }
}

// 启动浏览器通知检查定时器
export function startBrowserNotificationService() {
  if (!isBrowserNotificationSupported || Notification.permission !== 'granted') {
    console.warn('浏览器通知不可用，无法启动通知服务');
    return;
  }
  
  console.log('启动浏览器通知服务');
  
  // 停止已有的定时器（如果存在）
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  // 立即执行一次检查
  checkForDueAlarms();
  
  // 设置定时检查
  notificationInterval = setInterval(checkForDueAlarms, CHECK_INTERVAL);
}

// 停止浏览器通知服务
export function stopBrowserNotificationService() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('浏览器通知服务已停止');
  }
} 