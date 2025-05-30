declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    transaction: (
      callback: (tx: SQLiteTransaction) => void,
      errorCallback?: (error: Error) => void,
      successCallback?: () => void
    ) => void;
  }

  export interface SQLiteTransaction {
    executeSql: (
      sqlStatement: string,
      args?: any[],
      callback?: (tx: SQLiteTransaction, result: SQLiteResult) => void,
      errorCallback?: (tx: SQLiteTransaction, error: Error) => void
    ) => void;
  }

  export interface SQLiteResult {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item: (index: number) => any;
      _array: any[];
    };
  }

  export function openDatabaseSync(name: string): SQLiteDatabase;
} 