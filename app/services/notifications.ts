import * as Notifications from 'expo-notifications';
import { isBrowser } from './browserNotifications';

// 配置通知处理程序
if (!isBrowser) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// 请求通知权限
export async function requestNotificationPermissions() {
  // 在浏览器环境中，权限请求由browserNotifications模块处理
  if (isBrowser) {
    return;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    throw new Error('需要通知权限才能设置闹钟提醒！');
  }
}

// 生成通知ID
function generateNotificationId(alarmId: number, date: Date): string {
  return `alarm_${alarmId}_${date.getTime()}`;
}

// 注册通知
export async function scheduleNotification(
  alarmId: number,
  alarmName: string,
  date: Date,
  medicines: Array<{ name: string; dosage?: string }>
): Promise<string> {
  const notificationId = generateNotificationId(alarmId, date);
  
  // 构建通知内容
  const medicineList = medicines
    .map(med => `${med.name}${med.dosage ? ` (${med.dosage})` : ''}`)
    .join('\n');
  
  const content = {
    title: `服药提醒: ${alarmName}`,
    body: `该吃药了！\n${medicineList}`,
    data: { alarmId },
    sound: 'default',
  };

  // 添加调试信息
  console.log('正在调度通知:', {
    '闹钟ID': alarmId,
    '闹钟名称': alarmName,
    '通知时间': date.toLocaleString(),
    '药品列表': medicines.map(m => m.name)
  });

  try {
    // 浏览器环境下不需要立即调度通知，由定时器处理
    if (isBrowser) {
      console.log('浏览器环境下，通知将由定时器触发');
      return notificationId;
    }
    
    // 注意: 使用正确的 trigger 格式
    const trigger = { 
      channelId: 'default',
      date: date 
    };

    console.log('通知触发器设置:', {
      '触发时间': date.toLocaleString(),
      '是否重复': false
    });
    
    await Notifications.scheduleNotificationAsync({
      content,
      trigger
    });

    console.log('通知调度成功');
    return notificationId;
  } catch (error) {
    console.error('调度通知时出错:', error);
    throw error;
  }
}

// 取消通知
export async function cancelNotification(notificationId: string) {
  // 浏览器环境下不需要取消通知，由定时器处理
  if (isBrowser) {
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// 取消所有与闹钟相关的通知
export async function cancelAlarmNotifications(alarmId: number) {
  // 浏览器环境下不需要取消通知，由定时器处理
  if (isBrowser) {
    return;
  }
  
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const alarmNotifications = scheduledNotifications.filter(
    notification => notification.content.data?.alarmId === alarmId
  );
  
  await Promise.all(
    alarmNotifications.map(notification => 
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

// 为闹钟设置未来三天的所有通知
export async function scheduleAlarmNotifications(
  alarmId: number,
  alarmName: string,
  reminderDate: Date,
  reminderTimes: Date[],
  repeatType: 'single' | 'weekly' | 'monthly' | 'custom' | 'hourly',
  customPeriod: number | null,
  customDays: number[] | null,
  medicines: Array<{ name: string; dosage?: string }>
): Promise<string[]> { 
  const notificationIds: string[] = [];
  
  // 浏览器环境下，只需返回通知ID，实际调度由定时器处理
  if (isBrowser) {
    console.log('浏览器环境下，使用定时器进行闹钟检查');
    
    // 生成所有可能的通知ID（仅用于标识，不实际调度）
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3); // 设置结束日期为3天后
    
    const dates = generateNotificationDates(
      reminderDate,
      endDate,
      repeatType,
      customPeriod,
      customDays
    );
    
    for (const date of dates) {
      for (const time of reminderTimes) {
        const notificationDate = new Date(date);
        notificationDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
        
        if (notificationDate > new Date()) {
          const notificationId = generateNotificationId(alarmId, notificationDate);
          notificationIds.push(notificationId);
        }
      }
    }
    
    return notificationIds;
  }
  
  // 非浏览器环境，使用Expo通知
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 3); // 设置结束日期为3天后

  // 根据重复类型生成所有需要通知的日期
  const dates = generateNotificationDates(
    reminderDate,
    endDate,
    repeatType,
    customPeriod,
    customDays
  );

  console.log('生成的通知日期:', dates.map(date => date.toLocaleString()));
  console.log('提醒时间:', reminderTimes.map(time => time.toLocaleString()));

  // 为每个日期和时间点设置通知
  for (const date of dates) {
    for (const time of reminderTimes) {
      const notificationDate = new Date(date);
      notificationDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
      
      // 添加调试信息
      console.log('处理通知:', {
        '原始日期': date.toLocaleString(),
        '提醒时间': time.toLocaleString(),
        '最终通知时间': notificationDate.toLocaleString()
      });

      // 只设置未来的通知
      if (notificationDate > new Date()) {
        console.log('调度未来通知:', {
          '当前时间': new Date().toLocaleString(),
          '通知时间': notificationDate.toLocaleString()
        });

        const notificationId = await scheduleNotification(
          alarmId,
          alarmName,
          notificationDate,
          medicines
        );
        notificationIds.push(notificationId);
      } else {
        console.log('跳过过去的通知:', notificationDate.toLocaleString());
      }
    }
  }

  console.log('所有通知调度完成:', notificationIds);
  return notificationIds;
}

// 生成通知日期
function generateNotificationDates(
  startDate: Date,
  endDate: Date,
  repeatType: 'single' | 'weekly' | 'monthly' | 'custom' | 'hourly',
  customPeriod: number | null,
  customDays: number[] | null
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  switch (repeatType) {
    case 'single':
      dates.push(new Date(startDate));
      break;

    case 'weekly':
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
      break;

    case 'monthly':
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;

    case 'custom':
      if (customPeriod && customDays) {
        while (currentDate <= endDate) {
          for (const day of customDays) {
            const customDate = new Date(currentDate);
            customDate.setDate(customDate.getDate() + day - 1);
            if (customDate <= endDate) {
              dates.push(customDate);
            }
          }
          currentDate.setDate(currentDate.getDate() + customPeriod);
        }
      }
      break;

    case 'hourly':
      if (customPeriod) {
        let currentTime = new Date(startDate);
        while (currentTime <= endDate) {
          dates.push(new Date(currentTime));
          // 增加指定的小时数
          currentTime = new Date(currentTime.getTime() + customPeriod * 60 * 60 * 1000);
        }
      }
      break;
  }

  return dates;
} 