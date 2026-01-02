/**
 * IndexedDB 数据库初始化和共享配置
 * 统一管理数据库连接和 store 定义
 */

// 数据库配置
export const DB_NAME = 'PenguinElloDB';
export const DB_VERSION = 3;

// Store 名称
export const STORE_NAMES = {
  CREATIVE_IDEAS: 'creativeIdeas',
  HISTORY: 'generationHistory',
} as const;

/**
 * 打开数据库连接
 * 自动处理数据库升级和 store 创建
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(new Error('Error opening IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建创意库 store
      if (!db.objectStoreNames.contains(STORE_NAMES.CREATIVE_IDEAS)) {
        db.createObjectStore(STORE_NAMES.CREATIVE_IDEAS, { keyPath: 'id' });
      }
      
      // 创建历史记录 store
      if (!db.objectStoreNames.contains(STORE_NAMES.HISTORY)) {
        db.createObjectStore(STORE_NAMES.HISTORY, { keyPath: 'id' });
      }
    };
  });
};

/**
 * 获取只读事务
 */
export const getReadTransaction = async (storeName: string) => {
  const db = await openDB();
  return db.transaction(storeName, 'readonly').objectStore(storeName);
};

/**
 * 获取读写事务
 */
export const getWriteTransaction = async (storeName: string) => {
  const db = await openDB();
  return db.transaction(storeName, 'readwrite').objectStore(storeName);
};
