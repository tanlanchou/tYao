export type RepeatType = 'single' | 'weekly' | 'monthly' | 'custom' | 'hourly';

export interface ReminderData {
  reminderDate: Date;
  reminderTimes: Date[];
  repeatType: RepeatType;
  customPeriod: number;
  customDays: number[];
  displayData: {
    reminderDateText: string;
    reminderTimesText: string;
    repeatTypeText: string;
    customDaysText: string;
    fullDisplayText: string;
  };
}

export interface CombinedData {
  id?: number;
  name: string;
  image?: string;
  dosage?: string;
  reminder: ReminderData;
}

export interface Alarm {
  id: number;
  name: string;
  reminder_date: string;
  reminder_times: string[];
  repeat_type: RepeatType;
  custom_period: number | null;
  custom_days: number[] | null;
  created_at: string;
  status: number; // 0: 禁用, 1: 启用
  medicines: Array<{
    id: number;
    name: string;
    image?: string;
    dosage?: string;
  }>;
} 