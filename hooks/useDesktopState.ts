/**
 * 桌面状态管理 Hook
 * 封装桌面 items 的 CRUD 操作和状态
 */

import React, { useState, useCallback } from 'react';
import { DesktopItem, DesktopImageItem, DesktopFolderItem, DesktopStackItem, GenerationHistory } from '../types';
import * as desktopApi from '../services/api/desktop';

export interface UseDesktopStateReturn {
  // 状态
  desktopItems: DesktopItem[];
  desktopSelectedIds: string[];
  openFolderId: string | null;
  openStackId: string | null;
  
  // 设置方法
  setDesktopItems: React.Dispatch<React.SetStateAction<DesktopItem[]>>;
  setDesktopSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setOpenFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setOpenStackId: React.Dispatch<React.SetStateAction<string | null>>;
  
  // 操作方法
  loadDesktopItems: (history?: GenerationHistory[]) => Promise<DesktopItem[]>;
  saveDesktopItems: (items: DesktopItem[]) => Promise<void>;
  handleDesktopItemsChange: (items: DesktopItem[]) => void;
  addToDesktop: (item: DesktopImageItem) => void;
  findNextFreePosition: () => { x: number; y: number };
  renameItem: (id: string, newName: string) => void;
}

const GRID_SIZE = 100;
const MAX_COLS = 8;

export const useDesktopState = (): UseDesktopStateReturn => {
  const [desktopItems, setDesktopItems] = useState<DesktopItem[]>([]);
  const [desktopSelectedIds, setDesktopSelectedIds] = useState<string[]>([]);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [openStackId, setOpenStackId] = useState<string | null>(null);
  
  // 安全保存桌面状态到后端
  const saveDesktopItems = useCallback(async (items: DesktopItem[]) => {
    try {
      // 清理 base64 数据，只保留本地文件 URL
      const itemsForStorage = items.map(item => {
        if (item.type === 'image') {
          const imageItem = item as DesktopImageItem;
          // base64 数据不保存，会从历史记录恢复
          if (imageItem.imageUrl?.startsWith('data:')) {
            return { ...imageItem, imageUrl: '' };
          }
          // 本地文件 URL 保留
          if (imageItem.imageUrl?.startsWith('/files/')) {
            return imageItem;
          }
        }
        return item;
      });
      await desktopApi.saveDesktopItems(itemsForStorage);
    } catch (e) {
      console.error('Failed to save desktop items:', e);
    }
  }, []);
  
  // 加载桌面状态
  const loadDesktopItems = useCallback(async (history?: GenerationHistory[]): Promise<DesktopItem[]> => {
    try {
      const result = await desktopApi.getDesktopItems();
      if (result.success && result.data) {
        // 恢复图片 URL
        const restoredItems = result.data.map(item => {
          if (item.type === 'image') {
            const imageItem = item as DesktopImageItem;
            // 如果 imageUrl 为空且有 historyId，从历史记录恢复
            if ((!imageItem.imageUrl || imageItem.imageUrl === '') && imageItem.historyId && history) {
              const historyEntry = history.find(h => h.id === imageItem.historyId);
              if (historyEntry) {
                return { ...imageItem, imageUrl: historyEntry.imageUrl };
              }
            }
          }
          return item;
        });
        setDesktopItems(restoredItems);
        return restoredItems;
      } else {
        console.warn('加载桌面状态失败:', result.error);
        setDesktopItems([]);
        return [];
      }
    } catch (e) {
      console.error('加载桌面状态失败:', e);
      setDesktopItems([]);
      return [];
    }
  }, []);
  
  // 处理桌面项目变更
  const handleDesktopItemsChange = useCallback((items: DesktopItem[]) => {
    setDesktopItems(items);
    saveDesktopItems(items);
  }, [saveDesktopItems]);
  
  // 查找桌面空闲位置
  const findNextFreePosition = useCallback((): { x: number; y: number } => {
    const occupiedPositions = new Set(
      desktopItems
        .filter(item => {
          // 排除文件夹内的项目
          const isInFolder = desktopItems.some(
            other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(item.id)
          );
          // 排除叠放内的项目
          const isInStack = desktopItems.some(
            other => other.type === 'stack' && (other as DesktopStackItem).itemIds.includes(item.id)
          );
          return !isInFolder && !isInStack;
        })
        .map(item => `${Math.round(item.position.x / GRID_SIZE)},${Math.round(item.position.y / GRID_SIZE)}`)
    );
    
    // 从左上角开始找空位
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < MAX_COLS; x++) {
        const key = `${x},${y}`;
        if (!occupiedPositions.has(key)) {
          return { x: x * GRID_SIZE, y: y * GRID_SIZE };
        }
      }
    }
    return { x: 0, y: 0 };
  }, [desktopItems]);
  
  // 添加图片到桌面
  const addToDesktop = useCallback((item: DesktopImageItem) => {
    setDesktopItems(prevItems => {
      // 在最新状态上查找空闲位置
      const occupiedPositions = new Set(
        prevItems
          .filter(existingItem => {
            // 排除文件夹内的项目
            const isInFolder = prevItems.some(
              other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(existingItem.id)
            );
            // 排除叠放内的项目
            const isInStack = prevItems.some(
              other => other.type === 'stack' && (other as DesktopStackItem).itemIds.includes(existingItem.id)
            );
            return !isInFolder && !isInStack;
          })
          .map(existingItem => `${Math.round(existingItem.position.x / GRID_SIZE)},${Math.round(existingItem.position.y / GRID_SIZE)}`)
      );
      
      // 从第0列、第0行开始找空位
      let freePos = { x: 0, y: 0 };
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < MAX_COLS; x++) {
          const key = `${x},${y}`;
          if (!occupiedPositions.has(key)) {
            freePos = { x: x * GRID_SIZE, y: y * GRID_SIZE };
            break;
          }
        }
        const foundKey = `${Math.round(freePos.x / GRID_SIZE)},${Math.round(freePos.y / GRID_SIZE)}`;
        if (!occupiedPositions.has(foundKey)) break;
      }
      
      const itemWithPosition = { ...item, position: freePos };
      const newItems = [...prevItems, itemWithPosition];
      
      // 延迟保存到后端
      setTimeout(() => saveDesktopItems(newItems), 0);
      
      return newItems;
    });
  }, [saveDesktopItems]);
  
  // 重命名项目
  const renameItem = useCallback((id: string, newName: string) => {
    setDesktopItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === id ? { ...item, name: newName } : item
      );
      saveDesktopItems(updatedItems);
      return updatedItems;
    });
  }, [saveDesktopItems]);
  
  return {
    // 状态
    desktopItems,
    desktopSelectedIds,
    openFolderId,
    openStackId,
    
    // 设置方法
    setDesktopItems,
    setDesktopSelectedIds,
    setOpenFolderId,
    setOpenStackId,
    
    // 操作方法
    loadDesktopItems,
    saveDesktopItems,
    handleDesktopItemsChange,
    addToDesktop,
    findNextFreePosition,
    renameItem,
  };
};
