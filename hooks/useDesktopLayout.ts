/**
 * 桌面布局管理 Hook
 * 处理网格布局、空位查找、位置计算等
 */

import { useCallback, useMemo } from 'react';
import { DesktopItem, DesktopPosition, DesktopFolderItem, DesktopStackItem } from '../types';

// 布局常量
export const GRID_SIZE = 100;
export const ICON_SIZE = 80;
export const TOP_OFFSET = 100;
export const PADDING = 24;

export interface UseDesktopLayoutProps {
  items: DesktopItem[];
  containerWidth: number;
  containerHeight: number;
  gridSize?: number;
  openFolderId: string | null;
  openStackId: string | null;
}

export interface UseDesktopLayoutReturn {
  // 计算值
  maxX: number;
  maxY: number;
  horizontalPadding: number;
  
  // 当前显示的项目
  currentItems: DesktopItem[];
  
  // 布局方法
  snapToGrid: (pos: DesktopPosition) => DesktopPosition;
  isPositionOccupied: (pos: DesktopPosition, excludeId?: string) => boolean;
  findNearestFreePosition: (pos: DesktopPosition, excludeId?: string) => DesktopPosition;
  findNextFreePosition: () => DesktopPosition;
  
  // 过滤方法
  filterItemsBySearch: (items: DesktopItem[], searchQuery: string) => DesktopItem[];
}

export const useDesktopLayout = ({
  items,
  containerWidth,
  containerHeight,
  gridSize = GRID_SIZE,
  openFolderId,
  openStackId,
}: UseDesktopLayoutProps): UseDesktopLayoutReturn => {
  
  // 动态计算最大边界
  const maxX = useMemo(() => 
    Math.max(0, Math.floor((containerWidth - PADDING * 2 - ICON_SIZE) / gridSize) * gridSize),
    [containerWidth, gridSize]
  );
  
  const maxY = useMemo(() =>
    Math.max(0, Math.floor((containerHeight - TOP_OFFSET - ICON_SIZE - PADDING) / gridSize) * gridSize),
    [containerHeight, gridSize]
  );
  
  const horizontalPadding = PADDING;
  
  // 获取当前显示的项目（根据是否在文件夹或叠放内）
  const currentItems = useMemo(() => {
    if (openFolderId) {
      const folder = items.find(i => i.id === openFolderId) as DesktopFolderItem | undefined;
      return items.filter(item => folder?.itemIds.includes(item.id));
    }
    
    if (openStackId) {
      const stack = items.find(i => i.id === openStackId) as DesktopStackItem | undefined;
      return items.filter(item => stack?.itemIds.includes(item.id));
    }
    
    // 只显示不在任何文件夹或叠放内的项目
    return items.filter(item => {
      const isInFolder = items.some(
        other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(item.id)
      );
      const isInStack = items.some(
        other => other.type === 'stack' && (other as DesktopStackItem).itemIds.includes(item.id)
      );
      return !isInFolder && !isInStack;
    });
  }, [items, openFolderId, openStackId]);
  
  // 吸附到网格
  const snapToGrid = useCallback((pos: DesktopPosition): DesktopPosition => {
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    };
  }, [gridSize]);
  
  // 检查位置是否被占用
  const isPositionOccupied = useCallback((pos: DesktopPosition, excludeId?: string): boolean => {
    return currentItems.some(item => {
      if (item.id === excludeId) return false;
      const snappedPos = snapToGrid(item.position);
      return snappedPos.x === pos.x && snappedPos.y === pos.y;
    });
  }, [currentItems, snapToGrid]);
  
  // 找到最近的空闲位置（螺旋搜索）
  const findNearestFreePosition = useCallback((pos: DesktopPosition, excludeId?: string): DesktopPosition => {
    const snapped = snapToGrid(pos);
    if (!isPositionOccupied(snapped, excludeId)) return snapped;

    // 螺旋搜索空闲位置
    for (let distance = 1; distance < 20; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
          if (Math.abs(dx) === distance || Math.abs(dy) === distance) {
            const testPos = {
              x: snapped.x + dx * gridSize,
              y: snapped.y + dy * gridSize,
            };
            if (testPos.x >= 0 && testPos.y >= 0 && !isPositionOccupied(testPos, excludeId)) {
              return testPos;
            }
          }
        }
      }
    }
    return snapped;
  }, [snapToGrid, isPositionOccupied, gridSize]);
  
  // 找到下一个空闲位置（从左上角开始）
  const findNextFreePosition = useCallback((): DesktopPosition => {
    const maxCols = Math.max(1, Math.floor((containerWidth - PADDING * 2) / gridSize));
    
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < maxCols; x++) {
        const pos = { x: x * gridSize, y: y * gridSize };
        if (!isPositionOccupied(pos)) {
          return pos;
        }
      }
    }
    return { x: 0, y: 0 };
  }, [containerWidth, gridSize, isPositionOccupied]);
  
  // 根据搜索词过滤项目
  const filterItemsBySearch = useCallback((itemsToFilter: DesktopItem[], searchQuery: string): DesktopItem[] => {
    if (!searchQuery.trim()) return itemsToFilter;
    
    const query = searchQuery.toLowerCase();
    return itemsToFilter.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.type === 'image' && (item as any).prompt?.toLowerCase().includes(query))
    );
  }, []);
  
  return {
    maxX,
    maxY,
    horizontalPadding,
    currentItems,
    snapToGrid,
    isPositionOccupied,
    findNearestFreePosition,
    findNextFreePosition,
    filterItemsBySearch,
  };
};
