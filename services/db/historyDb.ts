/**
 * 生成历史 IndexedDB 操作服务
 * 负责历史记录的本地存储 CRUD
 */

import { GenerationHistory } from '../../types';
import { openDB, STORE_NAMES } from './index';

const STORE_NAME = STORE_NAMES.HISTORY;

/**
 * 获取所有历史记录
 */
export const getAllHistory = async (): Promise<GenerationHistory[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(new Error('Error fetching history from DB.'));
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * 保存/更新历史记录
 */
export const saveHistoryItem = async (item: GenerationHistory): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);
    request.onerror = () => reject(new Error('Error saving history to DB.'));
    request.onsuccess = () => resolve();
  });
};

/**
 * 删除历史记录
 */
export const deleteHistoryItem = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(new Error('Error deleting history from DB.'));
    request.onsuccess = () => resolve();
  });
};

/**
 * 清空所有历史记录
 */
export const clearAllHistory = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(new Error('Error clearing history from DB.'));
    request.onsuccess = () => resolve();
  });
};

/**
 * 批量保存历史记录
 */
export const saveMultipleHistory = async (items: GenerationHistory[]): Promise<void> => {
  if (items.length === 0) return;
  
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Batch save history failed.'));
    
    items.forEach(item => {
      store.put(item);
    });
  });
};
