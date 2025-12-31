/**
 * 桌面交互管理 Hook
 * 处理拖拽、选择框、键盘操作、右键菜单等交互
 */

import React, { useState, useCallback, useEffect, RefObject } from 'react';
import { DesktopItem, DesktopPosition, DesktopFolderItem, DesktopImageItem } from '../types';
import { ICON_SIZE, TOP_OFFSET, PADDING } from './useDesktopLayout';

// 拖拽阈值
const DRAG_THRESHOLD = 5;

// 剪贴板状态类型
export interface ClipboardState {
  items: DesktopItem[];
  action: 'copy' | 'cut';
}

// 右键菜单状态
export interface ContextMenuState {
  x: number;
  y: number;
  itemId?: string;
}

export interface UseDesktopInteractionProps {
  containerRef: RefObject<HTMLDivElement>;
  items: DesktopItem[];
  currentItems: DesktopItem[];
  selectedIds: string[];
  gridSize: number;
  maxX: number;
  maxY: number;
  horizontalPadding: number;
  onItemsChange: (items: DesktopItem[]) => void;
  onSelectionChange: (ids: string[]) => void;
  snapToGrid: (pos: DesktopPosition) => DesktopPosition;
  findNearestFreePosition: (pos: DesktopPosition, excludeId?: string) => DesktopPosition;
}

export interface UseDesktopInteractionReturn {
  // 拖拽状态
  isDragging: boolean;
  dragStartPos: DesktopPosition | null;
  dragCurrentPos: DesktopPosition | null;
  dragItemId: string | null;
  dropTargetFolderId: string | null;
  
  // 选择框状态
  isSelecting: boolean;
  selectionBox: { start: DesktopPosition; end: DesktopPosition } | null;
  
  // 右键菜单状态
  contextMenu: ContextMenuState | null;
  setContextMenu: (menu: ContextMenuState | null) => void;
  
  // 编辑状态
  editingItemId: string | null;
  editingName: string;
  setEditingItemId: (id: string | null) => void;
  setEditingName: (name: string) => void;
  
  // 剪贴板
  clipboard: ClipboardState | null;
  setClipboard: (state: ClipboardState | null) => void;
  
  // 文件拖放状态
  isFileDragging: boolean;
  setIsFileDragging: (dragging: boolean) => void;
  
  // 预览状态
  showPreview: boolean;
  
  // 事件处理器
  handleItemMouseDown: (e: React.MouseEvent, itemId: string) => void;
  handleContainerMouseDown: (e: React.MouseEvent) => void;
  handleContextMenu: (e: React.MouseEvent, itemId?: string) => void;
  
  // 剪贴板操作
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  
  // 选择操作
  handleSelectAll: () => void;
}

export const useDesktopInteraction = ({
  containerRef,
  items,
  currentItems,
  selectedIds,
  gridSize,
  maxX,
  maxY,
  horizontalPadding,
  onItemsChange,
  onSelectionChange,
  snapToGrid,
  findNearestFreePosition,
}: UseDesktopInteractionProps): UseDesktopInteractionReturn => {
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<DesktopPosition | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<DesktopPosition | null>(null);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
  
  // 选择框状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    start: DesktopPosition;
    end: DesktopPosition;
  } | null>(null);
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  
  // 编辑状态
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // 剪贴板
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
  
  // 文件拖放状态
  const [isFileDragging, setIsFileDragging] = useState(false);
  
  // 预览状态（空格键控制）
  const [showPreview, setShowPreview] = useState(false);
  
  // 处理项目拖拽开始
  const handleItemMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    if (e.button !== 0) return; // 只处理左键
    e.stopPropagation();

    const isSelected = selectedIds.includes(itemId);
    if (!isSelected && !e.shiftKey && !e.ctrlKey) {
      onSelectionChange([itemId]);
    } else if (e.ctrlKey && !isSelected) {
      onSelectionChange([...selectedIds, itemId]);
    } else if (e.ctrlKey && isSelected) {
      onSelectionChange(selectedIds.filter(id => id !== itemId));
      return;
    } else if (!isSelected) {
      onSelectionChange([...selectedIds, itemId]);
    }

    setIsDragging(true);
    setDragItemId(itemId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  }, [selectedIds, onSelectionChange]);
  
  // 处理选区开始
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    
    // 清除选中
    if (!e.shiftKey && !e.ctrlKey) {
      onSelectionChange([]);
    }
    
    // 开始选区
    const rect = containerRef.current!.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsSelecting(true);
    setSelectionBox({ start: pos, end: pos });
  }, [containerRef, onSelectionChange]);
  
  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, itemId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 右键点击项目时自动选中该项目
    if (itemId && !selectedIds.includes(itemId)) {
      onSelectionChange([itemId]);
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId,
    });
  }, [selectedIds, onSelectionChange]);
  
  // 剪贴板操作
  const handleCopy = useCallback(() => {
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    if (selectedItems.length > 0) {
      setClipboard({ items: selectedItems, action: 'copy' });
    }
    setContextMenu(null);
  }, [items, selectedIds]);
  
  const handleCut = useCallback(() => {
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    if (selectedItems.length > 0) {
      setClipboard({ items: selectedItems, action: 'cut' });
    }
    setContextMenu(null);
  }, [items, selectedIds]);
  
  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.items.length === 0) return;
    
    const newItems: DesktopItem[] = [];
    const idsToRemove: string[] = [];
    
    clipboard.items.forEach(item => {
      const freePos = findNearestFreePosition({ x: 0, y: 0 });
      
      if (clipboard.action === 'copy') {
        // 复制：创建新项目
        const newItem = {
          ...item,
          id: Math.random().toString(36).substring(2, 15),
          position: freePos,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newItems.push(newItem);
      } else {
        // 剪切：移动项目
        idsToRemove.push(item.id);
        newItems.push({
          ...item,
          position: freePos,
          updatedAt: Date.now(),
        });
      }
    });
    
    let updatedItems = items;
    if (clipboard.action === 'cut') {
      updatedItems = items.filter(item => !idsToRemove.includes(item.id));
      setClipboard(null);
    }
    
    onItemsChange([...updatedItems, ...newItems]);
    setContextMenu(null);
  }, [clipboard, items, onItemsChange, findNearestFreePosition]);
  
  // 全选
  const handleSelectAll = useCallback(() => {
    onSelectionChange(currentItems.map(item => item.id));
    setContextMenu(null);
  }, [currentItems, onSelectionChange]);
  
  // 处理拖拽移动和释放
  useEffect(() => {
    if (!isDragging || !dragStartPos || !dragItemId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setDragCurrentPos(newPos);
      
      // 检测是否拖动到文件夹上
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + containerRef.current.scrollLeft;
        const mouseY = e.clientY - rect.top + containerRef.current.scrollTop;
        
        // 查找鼠标下的文件夹
        const targetFolder = currentItems.find(item => {
          if (item.type !== 'folder' || selectedIds.includes(item.id)) return false;
          const folderX = horizontalPadding + item.position.x;
          const folderY = TOP_OFFSET + item.position.y;
          return mouseX >= folderX && mouseX <= folderX + ICON_SIZE &&
                 mouseY >= folderY && mouseY <= folderY + ICON_SIZE;
        });
        
        setDropTargetFolderId(targetFolder?.id || null);
      }
    };

    const handleMouseUp = () => {
      // 如果有目标文件夹，将选中项目移入文件夹
      if (dropTargetFolderId && selectedIds.length > 0) {
        const updatedItems = items.map(item => {
          if (item.id === dropTargetFolderId && item.type === 'folder') {
            const folder = item as DesktopFolderItem;
            const newItemIds = [...folder.itemIds];
            selectedIds.forEach(id => {
              const selectedItem = items.find(i => i.id === id);
              if (selectedItem && selectedItem.type !== 'folder' && !newItemIds.includes(id)) {
                newItemIds.push(id);
              }
            });
            return { ...folder, itemIds: newItemIds, updatedAt: Date.now() };
          }
          return item;
        });
        onItemsChange(updatedItems);
        onSelectionChange([]);
      } else if (dragStartPos && dragCurrentPos) {
        const deltaX = dragCurrentPos.x - dragStartPos.x;
        const deltaY = dragCurrentPos.y - dragStartPos.y;

        const baseItem = items.find(i => i.id === dragItemId);
        if (baseItem) {
          // 单个项目拖拽
          if (selectedIds.length === 1) {
            const targetPos = {
              x: Math.min(maxX, Math.max(0, baseItem.position.x + deltaX)),
              y: Math.min(maxY, Math.max(0, baseItem.position.y + deltaY)),
            };
            const freePos = findNearestFreePosition(targetPos, baseItem.id);
            freePos.x = Math.min(maxX, Math.max(0, freePos.x));
            freePos.y = Math.min(maxY, Math.max(0, freePos.y));
            
            const updatedItems = items.map(item => {
              if (item.id === baseItem.id) {
                return { ...item, position: freePos, updatedAt: Date.now() };
              }
              return item;
            });
            onItemsChange(updatedItems);
          } else {
            // 多选拖动
            const baseNewPos = snapToGrid({
              x: Math.min(maxX, Math.max(0, baseItem.position.x + deltaX)),
              y: Math.min(maxY, Math.max(0, baseItem.position.y + deltaY)),
            });
            
            const actualDeltaX = baseNewPos.x - baseItem.position.x;
            const actualDeltaY = baseNewPos.y - baseItem.position.y;
            
            const updatedItems = items.map(item => {
              if (selectedIds.includes(item.id)) {
                const newPos = snapToGrid({
                  x: Math.min(maxX, Math.max(0, item.position.x + actualDeltaX)),
                  y: Math.min(maxY, Math.max(0, item.position.y + actualDeltaY)),
                });
                return { ...item, position: newPos, updatedAt: Date.now() };
              }
              return item;
            });
            onItemsChange(updatedItems);
          }
        }
      }

      setIsDragging(false);
      setDragStartPos(null);
      setDragCurrentPos(null);
      setDragItemId(null);
      setDropTargetFolderId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartPos, dragCurrentPos, dragItemId, selectedIds, items, onItemsChange, currentItems, dropTargetFolderId, containerRef, horizontalPadding, maxX, maxY, snapToGrid, findNearestFreePosition, onSelectionChange]);
  
  // 处理选区移动和释放
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSelectionBox(prev => prev ? {
        ...prev,
        end: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      } : null);
    };

    const handleMouseUp = () => {
      if (selectionBox && containerRef.current) {
        const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
        const selMaxX = Math.max(selectionBox.start.x, selectionBox.end.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
        const selMaxY = Math.max(selectionBox.start.y, selectionBox.end.y);

        const selectedInBox = currentItems.filter(item => {
          const centerX = horizontalPadding + item.position.x + ICON_SIZE / 2;
          const centerY = TOP_OFFSET + item.position.y + ICON_SIZE / 2;
          return centerX >= minX && centerX <= selMaxX && centerY >= minY && centerY <= selMaxY;
        }).map(item => item.id);

        onSelectionChange(selectedInBox);
      }
      setIsSelecting(false);
      setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, selectionBox, currentItems, onSelectionChange, containerRef, horizontalPadding]);
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 空格键预览
      if (e.code === 'Space' && selectedIds.length > 0 && !editingItemId) {
        e.preventDefault();
        setShowPreview(true);
      }
      
      // Ctrl+A 全选
      if (e.ctrlKey && e.key === 'a' && !editingItemId) {
        e.preventDefault();
        handleSelectAll();
      }
      
      // Ctrl+C 复制
      if (e.ctrlKey && e.key === 'c' && !editingItemId) {
        handleCopy();
      }
      
      // Ctrl+X 剪切
      if (e.ctrlKey && e.key === 'x' && !editingItemId) {
        handleCut();
      }
      
      // Ctrl+V 粘贴
      if (e.ctrlKey && e.key === 'v' && !editingItemId) {
        handlePaste();
      }
      
      // Escape 取消选择/关闭菜单
      if (e.key === 'Escape') {
        setContextMenu(null);
        if (editingItemId) {
          setEditingItemId(null);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setShowPreview(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, editingItemId, handleSelectAll, handleCopy, handleCut, handlePaste]);
  
  return {
    // 拖拽状态
    isDragging,
    dragStartPos,
    dragCurrentPos,
    dragItemId,
    dropTargetFolderId,
    
    // 选择框状态
    isSelecting,
    selectionBox,
    
    // 右键菜单状态
    contextMenu,
    setContextMenu,
    
    // 编辑状态
    editingItemId,
    editingName,
    setEditingItemId,
    setEditingName,
    
    // 剪贴板
    clipboard,
    setClipboard,
    
    // 文件拖放状态
    isFileDragging,
    setIsFileDragging,
    
    // 预览状态
    showPreview,
    
    // 事件处理器
    handleItemMouseDown,
    handleContainerMouseDown,
    handleContextMenu,
    
    // 剪贴板操作
    handleCopy,
    handleCut,
    handlePaste,
    
    // 选择操作
    handleSelectAll,
  };
};
