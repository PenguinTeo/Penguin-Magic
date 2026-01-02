/**
 * 创意库 IndexedDB 操作服务
 * 负责创意模板的本地存储 CRUD
 */

import { CreativeIdea } from '../../types';
import { openDB, STORE_NAMES } from './index';

const STORE_NAME = STORE_NAMES.CREATIVE_IDEAS;

/**
 * 获取所有创意
 */
export const getAllIdeas = async (): Promise<CreativeIdea[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(new Error('Error fetching all ideas from DB.'));
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * 保存/更新单个创意
 */
export const saveIdea = async (idea: CreativeIdea): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(idea);
    request.onerror = () => reject(new Error('Error saving idea to DB.'));
    request.onsuccess = () => resolve();
  });
};

/**
 * 删除创意
 */
export const deleteIdea = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(new Error('Error deleting idea from DB.'));
    request.onsuccess = () => resolve();
  });
};

/**
 * 批量导入创意
 * 自动处理 order 字段
 */
export const importIdeas = async (ideas: CreativeIdea[]): Promise<void> => {
  if (ideas.length === 0) return;
  
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Import transaction failed.'));
    
    ideas.forEach(idea => {
      if (idea.order === undefined) {
        idea.order = idea.id;
      }
      store.put(idea);
    });
  });
};

/**
 * 清空所有创意
 */
export const clearAllIdeas = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(new Error('Error clearing ideas from DB.'));
    request.onsuccess = () => resolve();
  });
};
