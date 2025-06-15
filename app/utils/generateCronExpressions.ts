// 生成cron表达式的工具函数
// reminderDate: 起始日期（Date对象）
// reminderTimes: 时间数组（Date对象，取时分即可）
// repeatType: 'single' | 'weekly' | 'monthly' | 'custom'
// customPeriod: 自定义周期天数（仅custom时有效）
// customDays: 自定义周期内的第几天（仅custom时有效）

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

function getWeekDay(date: Date) {
  // JS: 0=周日, 1=周一 ... 6=周六，cron: 0=周日, 1=周一 ... 6=周六
  return date.getDay();
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function generateCronExpressions(
  reminderDate: Date,
  reminderTimes: Date[],
  repeatType: string,
  customPeriod: number | null,
  customDays: number[] | null
): string[] {
  const crons: string[] = [];

  if (!reminderTimes || reminderTimes.length === 0) return crons;

  if (repeatType === 'single') {
    // 单次提醒
    for (const t of reminderTimes) {
      const min = t.getMinutes();
      const hour = t.getHours();
      const day = reminderDate.getDate();
      const month = reminderDate.getMonth() + 1; // cron月份1-12
      crons.push(`${min} ${hour} ${day} ${month} *`);
    }
  } else if (repeatType === 'weekly') {
    // 每周提醒
    const weekDay = getWeekDay(reminderDate); // 0-6
    for (const t of reminderTimes) {
      const min = t.getMinutes();
      const hour = t.getHours();
      crons.push(`${min} ${hour} * * ${weekDay}`);
    }
  } else if (repeatType === 'monthly') {
    // 每月提醒
    const day = reminderDate.getDate();
    for (const t of reminderTimes) {
      const min = t.getMinutes();
      const hour = t.getHours();
      crons.push(`${min} ${hour} ${day} * *`);
    }
  } else if (repeatType === 'custom' && customPeriod && customDays && customDays.length > 0) {
    // 自定义周期提醒，生成未来一年内的所有提醒
    const now = new Date();
    const end = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    let cycleStart = new Date(reminderDate);
    while (cycleStart < end) {
      for (const d of customDays) {
        const remindDate = addDays(cycleStart, d - 1);
        if (remindDate >= now && remindDate < end && remindDate >= reminderDate) {
          const day = remindDate.getDate();
          const month = remindDate.getMonth() + 1;
          for (const t of reminderTimes) {
            const min = t.getMinutes();
            const hour = t.getHours();
            crons.push(`${min} ${hour} ${day} ${month} *`);
          }
        }
      }
      cycleStart = addDays(cycleStart, customPeriod);
    }
  }
  return crons;
} 