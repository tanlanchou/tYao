import * as SQLite from 'expo-sqlite';

// 创建数据库连接
export const db = SQLite.openDatabaseSync('medicine_reminder.db');

// 初始化数据库表
export const initDatabase = () => {
  db.transaction(
    (tx) => {
      // 创建闹钟表
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS alarms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          alarm_name TEXT NOT NULL,
          medicine_name TEXT NOT NULL,
          medicine_image TEXT,
          medicine_dosage TEXT,
          reminder_date DATE NOT NULL,
          reminder_times TEXT NOT NULL,  -- 存储为JSON字符串，包含多个时间
          repeat_type TEXT NOT NULL,     -- 'single', 'weekly', 'monthly', 'custom'
          custom_period INTEGER,         -- 自定义重复周期（天数）
          custom_days TEXT,              -- 存储为JSON字符串，包含选中的天数
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
    (error) => {
      console.error('Error initializing database:', error);
    },
    () => {
      console.log('Database initialized successfully');
    }
  );
};

// 测试数据库连接
export const testConnection = () => {
  try {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT 1',
          [],
          (_, result) => {
            console.log('Database connection successful');
            return true;
          },
          (_, error) => {
            console.error('Database connection failed:', error);
            return false;
          }
        );
      },
      (error) => {
        console.error('Database connection failed:', error);
        return false;
      }
    );
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}; 