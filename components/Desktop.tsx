import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { DesktopItem, DesktopImageItem, DesktopFolderItem, DesktopStackItem, DesktopPosition, GenerationHistory } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Trash2 as TrashIcon, 
  ZoomIn as ZoomInIcon, 
  Download as DownloadIcon, 
  Edit as EditIcon, 
  RefreshCw as RefreshIcon, 
  Folder as FolderIcon, 
  FolderOpen as FolderOpenIcon, 
  Layers as StackIcon, 
  Maximize2 as StackExpandIcon, 
  Ungroup as UnstackIcon, 
  Search as SearchIcon, 
  Eye as EyeIcon, 
  EyeOff as EyeOffIcon, 
  Copy as CopyIcon, 
  Scissors as ScissorsIcon, 
  Clipboard as ClipboardIcon, 
  ChevronLeft as ChevronLeftIcon, 
  Package as PackageIcon, 
  MoveRight as MoveOutIcon, 
  Type as RenameIcon, 
  Library as LibraryIcon, 
  LayoutGrid as LayersIcon,
  PlusSquare as AddToCanvasIcon
} from 'lucide-react';
// JSZip 导出逻辑已迁移到 services/export/desktopExporter.ts
import { exportAsZip, batchDownloadImages, downloadSingleImage } from '../services/export';
import { normalizeImageUrl, getThumbnailUrl, parseErrorMessage, extractErrorCode } from '../utils/image';
import { mergeImages } from '../services/api/imageOps';

interface DesktopProps {
  items: DesktopItem[];
  onItemsChange: (items: DesktopItem[]) => void;
  onImageDoubleClick: (item: DesktopImageItem) => void;
  onFolderDoubleClick: (item: DesktopFolderItem) => void;
  onStackDoubleClick?: (item: DesktopStackItem) => void; // 叠放双击打开
  openFolderId: string | null;
  onFolderClose: () => void;
  openStackId: string | null; // 当前打开的叠放 ID
  onStackClose: () => void; // 关闭叠放
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  gridSize?: number;
  onRenameItem?: (id: string, newName: string) => void;
  // 图片操作回调
  onImagePreview?: (item: DesktopImageItem) => void;
  onImageEditAgain?: (item: DesktopImageItem) => void;
  onImageRegenerate?: (item: DesktopImageItem) => void;
  // 历史记录（用于自动叠放等功能）
  history?: GenerationHistory[];
  // 创意库（用于显示名称）
  creativeIdeas?: { id: number; title: string }[];
  // 拖放文件回调（从电脑拖拽图片到桌面）
  onFileDrop?: (files: FileList) => void;
  // 从图片创建创意库
  onCreateCreativeIdea?: (imageUrl: string, prompt?: string, aspectRatio?: string, resolution?: string) => void;
  // 桌面是否处于活动状态（用于快捷键作用域控制）
  isActive?: boolean;
  // 添加图片到画布
  onAddToCanvas?: (imageUrl: string, imageName?: string) => void;
}

const GRID_SIZE = 100; // 网格大小
const ICON_SIZE = 80; // 图标大小
const DRAG_THRESHOLD = 5; // 拖拽阈值，超过此距离才认为是拖拽
export const TOP_OFFSET = 100; // 顶部偏移（搜索框+工具栏）- 增加避免套叠
const PADDING = 24; // 桌面内边距
// 不再使用固定行列，改为动态计算

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// 剪贴板状态类型
interface ClipboardState {
  items: DesktopItem[];
  action: 'copy' | 'cut';
}

export const Desktop: React.FC<DesktopProps> = ({
  items,
  onItemsChange,
  onImageDoubleClick,
  onFolderDoubleClick,
  onStackDoubleClick,
  openFolderId,
  onFolderClose,
  openStackId,
  onStackClose,
  selectedIds,
  onSelectionChange,
  gridSize = GRID_SIZE,
  onRenameItem,
  onImagePreview,
  onImageEditAgain,
  onImageRegenerate,
  history = [],
  creativeIdeas = [],
  onFileDrop,
  onCreateCreativeIdea,
  isActive = true,
  onAddToCanvas,
}) => {
  const { theme, themeName } = useTheme();
  const isLight = themeName === 'light';
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<DesktopPosition | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<DesktopPosition | null>(null);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    start: DesktopPosition;
    end: DesktopPosition;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId?: string;
  } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideFileNames, setHideFileNames] = useState(false); // 是否隐藏文件名
  const [isExporting, setIsExporting] = useState(false); // 导出中状态
  const [showPreview, setShowPreview] = useState(false); // 是否显示预览（空格键控制）
  const [isFileDragging, setIsFileDragging] = useState(false); // 是否有文件被拖拽到桌面

  // 获取当前显示的项目（根据是否在文件夹或叠放内）- 使用 useMemo 优化
  const baseItems = useMemo(() => {
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

  // 根据搜索词过滤 - 使用 useMemo 优化
  const currentItems = useMemo(() => {
    if (!searchQuery.trim()) return baseItems;
    const query = searchQuery.toLowerCase();
    return baseItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.type === 'image' && (item as DesktopImageItem).prompt?.toLowerCase().includes(query))
    );
  }, [baseItems, searchQuery]);

  // 监听容器尺寸变化（响应式布局）
  const [needsLayoutRefresh, setNeedsLayoutRefresh] = useState(false); // 是否需要刷新布局
  const prevSizeRef = useRef({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        
        // 检测是否是分辨率变小（可能导致图标超出边界）
        if (prevSizeRef.current.width > 0 && prevSizeRef.current.height > 0) {
          const widthReduced = newWidth < prevSizeRef.current.width - gridSize;
          const heightReduced = newHeight < prevSizeRef.current.height - gridSize;
          if (widthReduced || heightReduced) {
            setNeedsLayoutRefresh(true);
          }
        }
        
        prevSizeRef.current = { width: newWidth, height: newHeight };
        setContainerWidth(newWidth);
        setContainerHeight(newHeight);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [gridSize]);

  // 动态计算最大边界，不再固定行列
  const maxX = Math.max(0, Math.floor((containerWidth - PADDING * 2 - ICON_SIZE) / gridSize) * gridSize);
  const maxY = Math.max(0, Math.floor((containerHeight - TOP_OFFSET - ICON_SIZE - PADDING) / gridSize) * gridSize);
  
  // 左右边距，简单的固定边距
  const horizontalPadding = PADDING;

  // 检测图标是否有重叠或超出边界
  const hasLayoutIssues = useMemo(() => {
    if (!openFolderId && !openStackId && maxX > 0 && maxY > 0) {
      // 获取顶层项目
      const topLevelItems = items.filter(item => {
        const isInFolder = items.some(
          other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(item.id)
        );
        const isInStack = items.some(
          other => other.type === 'stack' && (other as DesktopStackItem).itemIds.includes(item.id)
        );
        return !isInFolder && !isInStack;
      });
      
      // 检查是否有超出边界的图标
      const hasOutOfBounds = topLevelItems.some(item => 
        item.position.x > maxX || item.position.y > maxY
      );
      
      // 检查是否有重叠的图标
      const positionSet = new Set<string>();
      let hasOverlap = false;
      for (const item of topLevelItems) {
        const posKey = `${Math.round(item.position.x / gridSize)},${Math.round(item.position.y / gridSize)}`;
        if (positionSet.has(posKey)) {
          hasOverlap = true;
          break;
        }
        positionSet.add(posKey);
      }
      
      return hasOutOfBounds || hasOverlap;
    }
    return false;
  }, [items, maxX, maxY, gridSize, openFolderId, openStackId]);

  // 当检测到布局问题时，设置提示标记
  useEffect(() => {
    if (hasLayoutIssues || needsLayoutRefresh) {
      setNeedsLayoutRefresh(true);
    }
  }, [hasLayoutIssues]);

  // 吸附到网格
  const snapToGrid = (pos: DesktopPosition): DesktopPosition => {
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    };
  };

  // 检查位置是否被占用（增强版：支持自定义占用集合）
  const isPositionOccupied = (pos: DesktopPosition, excludeId?: string, customOccupied?: Set<string>): boolean => {
    // 如果提供了自定义占用集合，优先使用
    if (customOccupied) {
      const posKey = `${Math.round(pos.x / gridSize)},${Math.round(pos.y / gridSize)}`;
      return customOccupied.has(posKey);
    }
    return currentItems.some(item => {
      if (item.id === excludeId) return false;
      const snappedPos = snapToGrid(item.position);
      return snappedPos.x === pos.x && snappedPos.y === pos.y;
    });
  };

  // 找到最近的空闲位置（增强版：确保在边界内且不重叠）
  const findNearestFreePosition = (pos: DesktopPosition, excludeId?: string, customOccupied?: Set<string>): DesktopPosition => {
    // 确保初始位置在边界内
    const clampedPos = {
      x: Math.min(Math.max(0, pos.x), maxX > 0 ? maxX : 0),
      y: Math.min(Math.max(0, pos.y), maxY > 0 ? maxY : 0),
    };
    const snapped = snapToGrid(clampedPos);
    
    // 确保吸附后仍在边界内
    snapped.x = Math.min(Math.max(0, snapped.x), maxX > 0 ? maxX : 0);
    snapped.y = Math.min(Math.max(0, snapped.y), maxY > 0 ? maxY : 0);
    
    if (!isPositionOccupied(snapped, excludeId, customOccupied)) return snapped;

    // 螺旋搜索空闲位置（确保在边界内）
    const maxDistance = Math.max(20, Math.ceil(Math.max(maxX, maxY) / gridSize));
    for (let distance = 1; distance < maxDistance; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
          if (Math.abs(dx) === distance || Math.abs(dy) === distance) {
            const testPos = {
              x: snapped.x + dx * gridSize,
              y: snapped.y + dy * gridSize,
            };
            // 确保在边界内
            if (testPos.x >= 0 && testPos.y >= 0 && 
                testPos.x <= (maxX > 0 ? maxX : 0) && 
                testPos.y <= (maxY > 0 ? maxY : 0) && 
                !isPositionOccupied(testPos, excludeId, customOccupied)) {
              return testPos;
            }
          }
        }
      }
    }
    // 如果螺旋搜索失败，从左上角顺序查找
    for (let y = 0; y <= (maxY > 0 ? maxY : 0); y += gridSize) {
      for (let x = 0; x <= (maxX > 0 ? maxX : 0); x += gridSize) {
        const testPos = { x, y };
        if (!isPositionOccupied(testPos, excludeId, customOccupied)) {
          return testPos;
        }
      }
    }
    return snapped;
  };

  // 处理项目拖拽开始
  const handleItemMouseDown = (e: React.MouseEvent, itemId: string) => {
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
  };

  // 处理拖拽移动 - 支持拖入文件夹
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
        
        // 查找鼠标下的文件夹（排除已选中的项目）
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

    const handleMouseUp = (e: MouseEvent) => {
      // 如果有目标文件夹，将选中项目移入文件夹
      if (dropTargetFolderId && selectedIds.length > 0) {
        const updatedItems = items.map(item => {
          if (item.id === dropTargetFolderId && item.type === 'folder') {
            const folder = item as DesktopFolderItem;
            // 添加选中的非文件夹项目到文件夹
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

        // 找到拖动的基准项目（被点击的那个）
        const baseItem = items.find(i => i.id === dragItemId);
        if (baseItem) {
          // 使用动态计算的边界
          const fixedMaxX = maxX;
          const fixedMaxY = maxY;
          
          // 单个项目拖拽：使用 findNearestFreePosition 避免重叠
          if (selectedIds.length === 1) {
            const targetPos = {
              x: Math.min(fixedMaxX, Math.max(0, baseItem.position.x + deltaX)),
              y: Math.min(fixedMaxY, Math.max(0, baseItem.position.y + deltaY)),
            };
            // 找到最近的空闲位置（排除自己）
            const freePos = findNearestFreePosition(targetPos, baseItem.id);
            // 确保在边界内
            freePos.x = Math.min(fixedMaxX, Math.max(0, freePos.x));
            freePos.y = Math.min(fixedMaxY, Math.max(0, freePos.y));
            
            const updatedItems = items.map(item => {
              if (item.id === baseItem.id) {
                return {
                  ...item,
                  position: freePos,
                  updatedAt: Date.now(),
                };
              }
              return item;
            });
            onItemsChange(updatedItems);
          } else {
            // 多选拖动：保持相对位置，逐个检查并避免重叠
            const baseNewPos = {
              x: Math.min(fixedMaxX, Math.max(0, baseItem.position.x + deltaX)),
              y: Math.min(fixedMaxY, Math.max(0, baseItem.position.y + deltaY)),
            };
            const baseSnappedPos = snapToGrid(baseNewPos);
            baseSnappedPos.x = Math.min(fixedMaxX, Math.max(0, baseSnappedPos.x));
            baseSnappedPos.y = Math.min(fixedMaxY, Math.max(0, baseSnappedPos.y));
            
            const actualDeltaX = baseSnappedPos.x - baseItem.position.x;
            const actualDeltaY = baseSnappedPos.y - baseItem.position.y;

            // 计算所有选中项目的新位置
            const newPositions: Map<string, DesktopPosition> = new Map();
            const occupiedPositions: Set<string> = new Set();
            
            // 先记录所有未选中项目的位置
            currentItems.forEach(item => {
              if (!selectedIds.includes(item.id)) {
                const pos = snapToGrid(item.position);
                occupiedPositions.add(`${pos.x},${pos.y}`);
              }
            });
            
            // 为每个选中项目找到不重叠的位置
            selectedIds.forEach(id => {
              const item = items.find(i => i.id === id);
              if (!item) return;
              
              let targetPos = {
                x: Math.min(fixedMaxX, Math.max(0, item.position.x + actualDeltaX)),
                y: Math.min(fixedMaxY, Math.max(0, item.position.y + actualDeltaY)),
              };
              targetPos = snapToGrid(targetPos);
              targetPos.x = Math.min(fixedMaxX, Math.max(0, targetPos.x));
              targetPos.y = Math.min(fixedMaxY, Math.max(0, targetPos.y));
              
              // 检查是否与已占用位置冲突
              let posKey = `${targetPos.x},${targetPos.y}`;
              if (occupiedPositions.has(posKey)) {
                // 寻找最近的空闲位置
                for (let distance = 1; distance < 20; distance++) {
                  let found = false;
                  for (let dx = -distance; dx <= distance && !found; dx++) {
                    for (let dy = -distance; dy <= distance && !found; dy++) {
                      if (Math.abs(dx) === distance || Math.abs(dy) === distance) {
                        const testPos = {
                          x: Math.min(fixedMaxX, Math.max(0, targetPos.x + dx * gridSize)),
                          y: Math.min(fixedMaxY, Math.max(0, targetPos.y + dy * gridSize)),
                        };
                        const testKey = `${testPos.x},${testPos.y}`;
                        if (!occupiedPositions.has(testKey)) {
                          targetPos = testPos;
                          posKey = testKey;
                          found = true;
                        }
                      }
                    }
                  }
                  if (found) break;
                }
              }
              
              newPositions.set(id, targetPos);
              occupiedPositions.add(posKey);
            });
            
            // 更新所有选中项目的位置
            const updatedItems = items.map(item => {
              const newPos = newPositions.get(item.id);
              if (newPos) {
                return {
                  ...item,
                  position: newPos,
                  updatedAt: Date.now(),
                };
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
  }, [isDragging, dragStartPos, dragCurrentPos, dragItemId, selectedIds, items, onItemsChange, currentItems, dropTargetFolderId]);

  // 处理双击
  const handleItemDoubleClick = (item: DesktopItem) => {
    if (item.type === 'image') {
      onImageDoubleClick(item as DesktopImageItem);
    } else if (item.type === 'stack') {
      // 叠放双击打开，类似文件夹
      onStackDoubleClick?.(item as DesktopStackItem);
    } else {
      onFolderDoubleClick(item as DesktopFolderItem);
    }
  };

  // 处理选区开始
  const handleContainerMouseDown = (e: React.MouseEvent) => {
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
  };

  // 处理选区移动
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
        // 计算选区内的项目
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
  }, [isSelecting, selectionBox, currentItems, onSelectionChange]);

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, itemId?: string) => {
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
  };

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // 新建文件夹 - 将右键菜单坐标转换为相对于网格的坐标
  const handleCreateFolder = () => {
    let pos = { x: 0, y: 0 };
    
    if (contextMenu && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // 将屏幕坐标转换为相对于容器的坐标，再减去边距和顶部偏移
      const relativeX = contextMenu.x - rect.left - horizontalPadding;
      const relativeY = contextMenu.y - rect.top - TOP_OFFSET;
      
      pos = {
        x: Math.min(maxX, Math.max(0, relativeX)),
        y: Math.min(maxY, Math.max(0, relativeY)),
      };
    }
    
    const snappedPos = findNearestFreePosition(pos);
    // 再次确保在可视边界内
    snappedPos.x = Math.min(maxX, Math.max(0, snappedPos.x));
    snappedPos.y = Math.min(maxY, Math.max(0, snappedPos.y));
    
    const newFolder: DesktopFolderItem = {
      id: generateId(),
      type: 'folder',
      name: '新建文件夹',
      position: snappedPos,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemIds: [],
      color: theme.colors.accent,
    };
    
    onItemsChange([...items, newFolder]);
    setContextMenu(null);
  };

  // 自动叠放：按创意库分组图片
  const handleAutoStackByCreative = useCallback(() => {
    // 获取所有不在文件夹/叠放内的图片
    const topLevelImages = items.filter(item => {
      if (item.type !== 'image') return false;
      const isInFolder = items.some(
        other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(item.id)
      );
      const isInStack = items.some(
        other => other.type === 'stack' && (other as DesktopStackItem).itemIds.includes(item.id)
      );
      return !isInFolder && !isInStack;
    }) as DesktopImageItem[];
    
    // 按创意库 ID 分组
    const groupByCreative: Map<string, { name: string; imageIds: string[]; firstPos: DesktopPosition }> = new Map();
    
    topLevelImages.forEach(img => {
      if (!img.historyId) return;
      const historyItem = history.find(h => h.id === img.historyId);
      if (!historyItem?.creativeTemplateId) return;
      
      const key = `creative_${historyItem.creativeTemplateId}`;
      if (!groupByCreative.has(key)) {
        // 查找创意库名称
        const creative = creativeIdeas.find(c => c.id === historyItem.creativeTemplateId);
        groupByCreative.set(key, {
          name: creative?.title || `创意库 ${historyItem.creativeTemplateId}`,
          imageIds: [img.id],
          firstPos: img.position,
        });
      } else {
        groupByCreative.get(key)!.imageIds.push(img.id);
      }
    });
    
    // 只对有2张及以上图片的组创建叠放
    const groupsToStack = Array.from(groupByCreative.values()).filter(g => g.imageIds.length >= 2);
    
    if (groupsToStack.length === 0) {
      alert('没有找到可以按创意库叠放的图片（需要至少2张同创意库的图片）');
      return;
    }
    
    // 创建叠放
    let newItems = [...items];
    groupsToStack.forEach(group => {
      const newStack: DesktopStackItem = {
        id: generateId(),
        type: 'stack',
        name: `${group.name} (${group.imageIds.length})`,
        position: group.firstPos,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        itemIds: group.imageIds,
        isExpanded: false,
      };
      newItems.push(newStack);
    });
    
    onItemsChange(newItems);
    const stackCount = groupsToStack.length;
    const imageCount = groupsToStack.reduce((sum, g) => sum + g.imageIds.length, 0);
    alert(`已创建 ${stackCount} 个叠放，包含 ${imageCount} 张图片`);
  }, [items, history, creativeIdeas, onItemsChange]);

  // 一键刷新布局：重新排列所有框外图标，确保不重叠且在可视区域内
  const handleReorganizeLayout = useCallback(() => {
    if (openFolderId || openStackId) {
      alert('请先返回主桌面再执行刷新布局');
      return;
    }
    
    // 获取当前可用的最大列数
    const effectiveMaxX = maxX > 0 ? maxX : 0;
    const effectiveMaxY = maxY > 0 ? maxY : 0;
    const maxCols = Math.max(1, Math.floor((effectiveMaxX / gridSize) + 1));
    
    // 获取需要重新排列的项目（不在文件夹/叠放内的项目）
    const topLevelItems = items.filter(item => {
      const isInFolder = items.some(
        other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(item.id)
      );
      const isInStack = items.some(
        other => other.type === 'stack' && (other as DesktopStackItem).itemIds.includes(item.id)
      );
      return !isInFolder && !isInStack;
    });
    
    // 按类型分组：文件夹和叠放优先，然后是图片
    const folders = topLevelItems.filter(i => i.type === 'folder');
    const stacks = topLevelItems.filter(i => i.type === 'stack');
    const images = topLevelItems.filter(i => i.type === 'image');
    const sortedItems = [...folders, ...stacks, ...images];
    
    // 使用 Set 跟踪已占用位置
    const occupiedPositions = new Set<string>();
    
    // 为每个项目分配新位置
    const updatedItems = items.map(item => {
      // 检查是否需要重新布局
      const needsRelayout = sortedItems.some(si => si.id === item.id);
      if (!needsRelayout) return item;
      
      // 找到下一个空闲位置
      let foundPos: DesktopPosition | null = null;
      for (let y = 0; y <= effectiveMaxY; y += gridSize) {
        for (let x = 0; x <= effectiveMaxX; x += gridSize) {
          const posKey = `${x / gridSize},${y / gridSize}`;
          if (!occupiedPositions.has(posKey)) {
            foundPos = { x, y };
            occupiedPositions.add(posKey);
            break;
          }
        }
        if (foundPos) break;
      }
      
      // 如果没找到空闲位置，继续往下排列（超出可视区域但可滚动）
      if (!foundPos) {
        const nextY = (occupiedPositions.size + 1) * gridSize;
        foundPos = { x: 0, y: nextY };
        occupiedPositions.add(`0,${nextY / gridSize}`);
      }
      
      return {
        ...item,
        position: foundPos,
        updatedAt: Date.now(),
      };
    });
    
    onItemsChange(updatedItems);
    onSelectionChange([]);
  }, [items, maxX, maxY, gridSize, openFolderId, openStackId, onItemsChange, onSelectionChange]);

  // 创建叠放（将选中的图片叠放在一起）
  const handleCreateStack = () => {
    // 只能叠放图片
    const imageIds = selectedIds.filter(id => {
      const item = items.find(i => i.id === id);
      return item?.type === 'image';
    });
    
    if (imageIds.length < 2) {
      setContextMenu(null);
      return;
    }
    
    // 找到第一个选中项目的位置作为叠放位置
    const firstItem = items.find(i => i.id === imageIds[0]);
    const stackPos = firstItem ? firstItem.position : { x: 100, y: 100 };
    
    const newStack: DesktopStackItem = {
      id: generateId(),
      type: 'stack',
      name: `叠放 (${imageIds.length})`,
      position: stackPos,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemIds: imageIds,
      isExpanded: false,
    };
    
    onItemsChange([...items, newStack]);
    onSelectionChange([newStack.id]);
    setContextMenu(null);
  };

  // 展开/收起叠放
  const handleToggleStack = (stackId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === stackId && item.type === 'stack') {
        return {
          ...item,
          isExpanded: !(item as DesktopStackItem).isExpanded,
          updatedAt: Date.now(),
        };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  // 解散叠放
  const handleUnstack = (stackId: string) => {
    const stack = items.find(i => i.id === stackId) as DesktopStackItem | undefined;
    if (!stack) return;
    
    // 为叠放中的项目分配新位置
    let newItems = items.filter(i => i.id !== stackId);
    let offsetX = 0;
    let offsetY = 0;
    
    stack.itemIds.forEach((itemId, index) => {
      const basePos = { x: stack.position.x + offsetX, y: stack.position.y + offsetY };
      const freePos = findNearestFreePosition(basePos, itemId);
      
      newItems = newItems.map(item => 
        item.id === itemId 
          ? { ...item, position: freePos, updatedAt: Date.now() }
          : item
      );
      
      offsetX += gridSize;
      if (offsetX >= gridSize * 3) {
        offsetX = 0;
        offsetY += gridSize;
      }
    });
    
    onItemsChange(newItems);
    onSelectionChange([]);
    setContextMenu(null);
  };

  // 删除选中项目
  const handleDeleteSelected = () => {
    const updatedItems = items.filter(item => !selectedIds.includes(item.id));
    // 同时从文件夹中移除引用
    const cleanedItems = updatedItems.map(item => {
      if (item.type === 'folder') {
        return {
          ...item,
          itemIds: (item as DesktopFolderItem).itemIds.filter(id => !selectedIds.includes(id)),
        };
      }
      return item;
    });
    onItemsChange(cleanedItems);
    onSelectionChange([]);
    setContextMenu(null);
  };

  // 复制选中项目
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    setClipboard({ items: selectedItems, action: 'copy' });
  }, [selectedIds, items]);

  // 剪切选中项目
  const handleCut = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    setClipboard({ items: selectedItems, action: 'cut' });
  }, [selectedIds, items]);

  // 粘贴项目 - 修正坐标转换
  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.items.length === 0) return;
    
    let pastePos = { x: 0, y: 0 };
    if (contextMenu && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = contextMenu.x - rect.left - horizontalPadding;
      const relativeY = contextMenu.y - rect.top - TOP_OFFSET;
      pastePos = {
        x: Math.min(maxX, Math.max(0, relativeX)),
        y: Math.min(maxY, Math.max(0, relativeY)),
      };
    }
    
    let newItems = [...items];
    let offsetX = 0;
    let offsetY = 0;
    
    clipboard.items.forEach((item, index) => {
      const basePos = { x: pastePos.x + offsetX, y: pastePos.y + offsetY };
      const freePos = findNearestFreePosition(basePos);
      
      if (clipboard.action === 'copy') {
        // 复制：创建新项目
        const newItem: DesktopItem = {
          ...item,
          id: generateId(),
          name: item.name + ' - 副本',
          position: freePos,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newItems.push(newItem);
      } else {
        // 剪切：移动项目位置
        newItems = newItems.map(i => 
          i.id === item.id 
            ? { ...i, position: freePos, updatedAt: Date.now() } 
            : i
        );
      }
      
      offsetX += gridSize;
      if (offsetX >= gridSize * 3) {
        offsetX = 0;
        offsetY += gridSize;
      }
    });
    
    onItemsChange(newItems);
    
    // 剪切后清空剪贴板
    if (clipboard.action === 'cut') {
      setClipboard(null);
    }
    
    setContextMenu(null);
  }, [clipboard, items, contextMenu, gridSize, findNearestFreePosition, onItemsChange]);

  // 从文件夹中移出项目
  const handleMoveOutOfFolder = useCallback(() => {
    if (!openFolderId || selectedIds.length === 0) return;
    
    const updatedItems = items.map(item => {
      if (item.id === openFolderId && item.type === 'folder') {
        const folder = item as DesktopFolderItem;
        return {
          ...folder,
          itemIds: folder.itemIds.filter(id => !selectedIds.includes(id)),
          updatedAt: Date.now(),
        };
      }
      return item;
    });
    
    onItemsChange(updatedItems);
    onSelectionChange([]);
    setContextMenu(null);
  }, [openFolderId, selectedIds, items, onItemsChange, onSelectionChange]);

  // 从叠放中移出项目
  const handleMoveOutOfStack = useCallback(() => {
    if (!openStackId || selectedIds.length === 0) return;
    
    const updatedItems = items.map(item => {
      if (item.id === openStackId && item.type === 'stack') {
        const stack = item as DesktopStackItem;
        const remainingIds = stack.itemIds.filter(id => !selectedIds.includes(id));
        return {
          ...stack,
          itemIds: remainingIds,
          name: `叠放 (${remainingIds.length})`,
          updatedAt: Date.now(),
        };
      }
      return item;
    });
    
    onItemsChange(updatedItems);
    onSelectionChange([]);
    setContextMenu(null);
  }, [openStackId, selectedIds, items, onItemsChange, onSelectionChange]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果桌面不活动（如在画布模式），不响应任何快捷键
      if (!isActive) return;
      
      // 检查当前焦点是否在输入框、文本域或其他可编辑元素中
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement ||
                            activeElement instanceof HTMLTextAreaElement ||
                            activeElement?.getAttribute('contenteditable') === 'true' ||
                            activeElement?.closest('[contenteditable="true"]');
      
      // 如果焦点在输入框中，不处理桌面快捷键
      if (isInputFocused) return;
      
      // 检查焦点是否在桌面区域内（或者没有特定焦点）
      const isDesktopFocused = !activeElement || 
                               activeElement === document.body ||
                               containerRef.current?.contains(activeElement);
      
      if (!isDesktopFocused) return;
      
      // 如果正在编辑名称，只处理 Escape
      if (editingItemId) {
        if (e.key === 'Escape') {
          setEditingItemId(null);
        }
        return;
      }
      
      // Delete 删除
      if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        handleDeleteSelected();
      }
      
      // F2 重命名
      if (e.key === 'F2' && selectedIds.length === 1) {
        e.preventDefault();
        const item = items.find(i => i.id === selectedIds[0]);
        if (item) {
          setEditingItemId(item.id);
          setEditingName(item.name);
        }
      }
      
      // Ctrl+C 复制
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      
      // Ctrl+X 剪切
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        handleCut();
      }
      
      // Ctrl+V 粘贴
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      
      // Ctrl+A 全选
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        onSelectionChange(currentItems.map(item => item.id));
      }
      
      // Escape 取消选中和关闭预览
      if (e.key === 'Escape') {
        setShowPreview(false);
        onSelectionChange([]);
      }
      
      // 空格键显示预览
      if (e.key === ' ' && selectedIds.length === 1) {
        e.preventDefault();
        setShowPreview(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // 空格键松开时隐藏预览
      if (e.key === ' ') {
        setShowPreview(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, items, editingItemId, handleCopy, handleCut, handlePaste, currentItems, onSelectionChange, isActive]);

  // 计算拖拽偏移
  const getDragOffset = () => {
    if (!isDragging || !dragStartPos || !dragCurrentPos) return { x: 0, y: 0 };
    return {
      x: dragCurrentPos.x - dragStartPos.x,
      y: dragCurrentPos.y - dragStartPos.y,
    };
  };

  const dragOffset = getDragOffset();

  // 获取当前选中的单个图片项目（只有按空格键时才显示预览）
  const selectedImageItem = (() => {
    if (!showPreview || selectedIds.length !== 1 || isDragging || isSelecting) return null;
    const item = currentItems.find(i => i.id === selectedIds[0]);
    if (item?.type !== 'image') return null;
    return item as DesktopImageItem;
  })();

  // 下载图片
  const handleDownloadImage = async (imageItem: DesktopImageItem) => {
    const url = imageItem.imageUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${imageItem.name}-${timestamp}.png`;
    
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // 获取文件夹/叠放内的所有图片
  const getImagesFromContainer = (containerId: string): DesktopImageItem[] => {
    const container = items.find(i => i.id === containerId);
    if (!container) return [];
    
    const itemIds = (container as DesktopFolderItem | DesktopStackItem).itemIds || [];
    return itemIds
      .map(id => items.find(i => i.id === id))
      .filter((item): item is DesktopImageItem => item?.type === 'image');
  };

  // 批量下载（使用导出服务）
  const handleBatchDownload = async (imageItems: DesktopImageItem[]) => {
    if (imageItems.length === 0) return;
    setIsExporting(true);
    
    await batchDownloadImages(imageItems);
    
    setIsExporting(false);
    setContextMenu(null);
  };

  // 压缩包导出（使用导出服务）
  const handleExportAsZip = async (containerName: string, imageItems: DesktopImageItem[]) => {
    if (imageItems.length === 0) return;
    setIsExporting(true);
    
    const success = await exportAsZip(containerName, imageItems);
    if (!success) {
      alert('导出失败，请稍后重试');
    }
    
    setIsExporting(false);
    setContextMenu(null);
  };

  // 导出选中的所有图片
  const handleExportSelected = async (asZip: boolean) => {
    const selectedImages = selectedIds
      .map(id => items.find(i => i.id === id))
      .filter((item): item is DesktopImageItem => item?.type === 'image');
    
    if (selectedImages.length === 0) {
      alert('没有选中任何图片');
      return;
    }
    
    if (asZip) {
      await handleExportAsZip('批量导出', selectedImages);
    } else {
      await handleBatchDownload(selectedImages);
    }
  };

  // 处理文件拖放事件（从电脑拖拽图片到桌面）
  const handleFileDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 检查是否有文件
    if (e.dataTransfer.types.includes('Files')) {
      setIsFileDragging(true);
    }
  }, []);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有离开容器时才取消拖拽状态
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setIsFileDragging(false);
      }
    }
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(false);
    
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer.items || dataTransfer.items.length === 0) return;
    
    // 检查是否有文件夹
    const entries: FileSystemEntry[] = [];
    const dataItems = Array.from(dataTransfer.items) as DataTransferItem[];
    
    for (const item of dataItems) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          entries.push(entry);
        }
      }
    }
    
    if (entries.length === 0) return;
    
    // 处理所有条目 - 全部放到产品桌面上
    for (const entry of entries) {
      if (entry.isDirectory) {
        // 文件夹 -> 创建文件夹并导入图片
        await processDirectoryEntry(entry as FileSystemDirectoryEntry);
      } else if (entry.isFile) {
        // 单个文件 -> 直接添加到桌面
        const file = await getFileFromEntry(entry as FileSystemFileEntry);
        if (file && file.type.startsWith('image/')) {
          await addImageToDesktop(file);
        }
      }
    }
  }, [items, onItemsChange]);
  
  // 从FIleSystemFileEntry获取File对象
  const getFileFromEntry = (entry: FileSystemFileEntry): Promise<File | null> => {
    return new Promise((resolve) => {
      entry.file(
        (file) => resolve(file),
        () => resolve(null)
      );
    });
  };
  
  // 读取目录中的所有条目
  const readDirectoryEntries = (dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    return new Promise((resolve) => {
      const allEntries: FileSystemEntry[] = [];
      const readBatch = () => {
        dirReader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve(allEntries);
          } else {
            allEntries.push(...entries);
            readBatch(); // 继续读取（可能有多批）
          }
        }, () => resolve(allEntries));
      };
      readBatch();
    });
  };
  
  // 处理文件夹条目
  const processDirectoryEntry = async (dirEntry: FileSystemDirectoryEntry) => {
    const folderName = dirEntry.name;
    const dirReader = dirEntry.createReader();
    const entries = await readDirectoryEntries(dirReader);
    
    // 收集文件夹内的所有图片
    const imageFiles: File[] = [];
    
    for (const entry of entries) {
      if (entry.isFile) {
        const file = await getFileFromEntry(entry as FileSystemFileEntry);
        if (file && file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }
      // 更深的嵌套文件夹暂不处理，可以扩展
    }
    
    if (imageFiles.length === 0) return;
    
    // 创建文件夹
    const folderId = generateId();
    const folderPosition = findNextFreePosition();
    const now = Date.now();
    
    // 创建图片项目
    const imageItems: DesktopImageItem[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const imageUrl = await fileToDataUrl(file);
      const imageId = generateId();
      
      imageItems.push({
        id: imageId,
        type: 'image',
        name: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
        imageUrl,
        position: { x: 0, y: 0 }, // 在文件夹内，位置不重要
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // 创建文件夹对象
    const folder: DesktopFolderItem = {
      id: folderId,
      type: 'folder',
      name: folderName,
      position: folderPosition,
      createdAt: now,
      updatedAt: now,
      itemIds: imageItems.map(img => img.id),
    };
    
    // 更新items
    onItemsChange([...items, ...imageItems, folder]);
  };
  
  // 添加单个图片到桌面
  const addImageToDesktop = async (file: File) => {
    const imageUrl = await fileToDataUrl(file);
    const imageId = generateId();
    const position = findNextFreePosition();
    const now = Date.now();
    
    const newImage: DesktopImageItem = {
      id: imageId,
      type: 'image',
      name: file.name.replace(/\.[^/.]+$/, ''),
      imageUrl,
      position,
      createdAt: now,
      updatedAt: now,
    };
    
    onItemsChange([...items, newImage]);
  };
  
  // File转DataURL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };
  
  // 找到下一个空闲位置
  const findNextFreePosition = (): DesktopPosition => {
    for (let y = 0; y <= maxY; y += gridSize) {
      for (let x = 0; x <= maxX; x += gridSize) {
        const pos = { x, y };
        if (!isPositionOccupied(pos)) {
          return pos;
        }
      }
    }
    return { x: 0, y: 0 };
  };

  // 图片合并处理函数
  const handleMergeImages = useCallback(async (layout: 'horizontal' | 'vertical') => {
    const selectedImages = selectedIds
      .map(id => items.find(i => i.id === id) as DesktopImageItem)
      .filter(i => i && i.type === 'image');
      
    if (selectedImages.length < 2) {
      alert('请选中至少 2 张图片进行合并');
      return;
    }
      
    const imagePaths = selectedImages.map(img => img.imageUrl);
      
    try {
      setIsExporting(true);
      const result = await mergeImages({
        imagePaths,
        layout,
        spacing: 10,
        backgroundColor: '#FFFFFF',
      });
        
      if (result.success) {
        // 在桌面上创建新图片
        const newImage: DesktopImageItem = {
          id: generateId(),
          type: 'image',
          name: `合并图片_${Date.now()}`,
          imageUrl: result.data.imageUrl,
          position: findNextFreePosition(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        onItemsChange([...items, newImage]);
        onSelectionChange([newImage.id]);
        alert(`图片合并成功！尺寸: ${result.data.width}x${result.data.height}`);
      } else {
        // result.success === false
        // @ts-ignore - TypeScript doesn't narrow the union type correctly in else branch
        alert(`合并失败: ${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('图片合并失败:', error);
      alert(`合并失败: ${error.message || '未知错误'}`);
    } finally {
      setIsExporting(false);
      setContextMenu(null);
    }
  }, [selectedIds, items, onItemsChange, onSelectionChange, maxX, maxY, gridSize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: theme.colors.bgPrimary,
        backgroundImage: `radial-gradient(${theme.colors.border} 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        WebkitUserSelect: 'none',
        userSelect: 'none',
        padding: '24px', // 边距扩大
      }}
      onMouseDown={handleContainerMouseDown}
      onContextMenu={(e) => handleContextMenu(e)}
      onDragStart={(e) => e.preventDefault()}
      onDragEnter={handleFileDragEnter}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* 文件拖放提示遮罩 */}
      {isFileDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 rounded-xl" />
          <div className="relative flex flex-col items-center gap-4 p-8 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20">
            <div className="w-20 h-20 rounded-2xl bg-blue-500 flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">拖放图片或文件夹到这里</p>
              <p className="text-sm text-gray-400 mt-1">文件夹会自动创建并导入图片</p>
            </div>
          </div>
        </div>
      )}
      {/* 技术支持信息 - 右上角 */}
      <div 
        className="absolute top-3 right-6 z-20 flex items-center gap-3 text-[10px]"
        style={{ color: isLight ? '#94a3b8' : '#52525b' }}
      >
        <span>Q群：854266067</span>
        <span>·</span>
        <span>微信：Lovexy_0222</span>
        <span>·</span>
        <span className="text-blue-400/60">特别鸣谢 T8、无我、大熊</span>
      </div>
      {/* 搜索框 + 自动叠放 + 隐藏文件名按钮 - 右上角，留出中间标签空间 */}
      <div className="absolute top-14 right-6 z-20 flex items-center gap-2">
        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-44 px-3 py-2 pl-8 text-xs backdrop-blur-xl border rounded-lg transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:w-64"
            style={{
              background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(18,18,26,0.95)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              color: isLight ? '#0f172a' : 'white'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <SearchIcon 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" 
            style={{ color: isLight ? '#94a3b8' : '#71717a' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: isLight ? '#64748b' : '#9ca3af' }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleAutoStackByCreative}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg backdrop-blur-xl border transition-all hover:scale-105"
          style={{
            background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(18,18,26,0.95)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            color: isLight ? '#475569' : '#a1a1aa'
          }}
          title="将同创意库生成的图片自动叠放在一起"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <LayersIcon className="w-3.5 h-3.5" />
          <span>自动叠放</span>
        </button>
        <button
          onClick={() => setHideFileNames(!hideFileNames)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg backdrop-blur-xl border transition-all hover:scale-105 ${
            hideFileNames
              ? 'bg-blue-500/20 border-blue-500/30'
              : ''
          }`}
          style={!hideFileNames ? {
            background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(18,18,26,0.95)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            color: isLight ? '#475569' : '#a1a1aa'
          } : { color: '#a5b4fc' }}
          title={hideFileNames ? '显示文件名' : '隐藏文件名'}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {hideFileNames ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
          <span>{hideFileNames ? '显示名称' : '隐藏名称'}</span>
        </button>
        {/* 一键刷新按钮 */}
        <button
          onClick={() => {
            handleReorganizeLayout();
            setNeedsLayoutRefresh(false);
          }}
          className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg backdrop-blur-xl border transition-all hover:scale-105 ${
            needsLayoutRefresh 
              ? 'bg-orange-500/20 border-orange-500/50 animate-pulse' 
              : 'hover:bg-green-500/10 hover:border-green-500/30'
          }`}
          style={!needsLayoutRefresh ? {
            background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(18,18,26,0.95)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            color: isLight ? '#475569' : '#a1a1aa'
          } : { color: '#fb923c' }}
          title={needsLayoutRefresh 
            ? '检测到布局问题（重叠或超出边界），点击刷新以修复' 
            : '重新排列所有图标，解决重叠问题或分辨率变化后的布局问题'
          }
          onMouseDown={(e) => e.stopPropagation()}
        >
          {needsLayoutRefresh && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
          )}
          {needsLayoutRefresh && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full" />
          )}
          <RefreshIcon className={`w-3.5 h-3.5 ${needsLayoutRefresh ? 'animate-spin' : ''}`} style={needsLayoutRefresh ? { animationDuration: '2s' } : {}} />
          <span>一键刷新</span>
        </button>
      </div>
      {/* 面包屑导航（在文件夹或叠放内时显示） */}
      {(openFolderId || openStackId) && (
        <div 
          className="absolute top-5 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl border"
          style={{
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(18,18,26,0.95)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
          }}
        >
          <button
            onClick={openFolderId ? onFolderClose : onStackClose}
            className="text-[13px] transition-colors flex items-center gap-1.5 hover:text-blue-400"
            style={{ color: isLight ? '#475569' : '#a1a1aa' }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>返回</span>
          </button>
          <span style={{ color: isLight ? '#cbd5e1' : '#52525b' }}>/</span>
          <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: isLight ? '#0f172a' : 'white' }}>
            {openFolderId ? <FolderOpenIcon className="w-4 h-4 text-blue-500" /> : <StackIcon className="w-4 h-4 text-blue-400" />}
            {openFolderId 
              ? (items.find(i => i.id === openFolderId)?.name || '文件夹')
              : (items.find(i => i.id === openStackId)?.name || '叠放')
            }
          </span>
        </div>
      )}

      {/* 桌面项目 */}
      {currentItems.map(item => {
        const isSelected = selectedIds.includes(item.id);
        const offset = isSelected && isDragging ? dragOffset : { x: 0, y: 0 };
        const isDropTarget = dropTargetFolderId === item.id;
        
        return (
          <div
            key={item.id}
            className={`absolute select-none cursor-pointer transition-transform ${
              isDragging && isSelected ? 'z-50' : 'z-10'
            }`}
            style={{
              left: horizontalPadding + item.position.x + offset.x,
              top: TOP_OFFSET + item.position.y + offset.y,
              width: ICON_SIZE,
            }}
            onMouseDown={(e) => handleItemMouseDown(e, item.id)}
            onDoubleClick={() => handleItemDoubleClick(item)}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
          >
            {/* 图标容器 */}
            <div
              className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-transparent shadow-xl scale-105'
                  : isDropTarget
                  ? 'ring-2 ring-blue-500 scale-110 shadow-2xl'
                  : 'hover:scale-105 hover:shadow-lg'
              }`}
              style={{
                backgroundColor: item.type === 'folder' 
                  ? isDropTarget 
                    ? 'rgba(34, 197, 94, 0.3)' 
                    : `${(item as DesktopFolderItem).color || theme.colors.accent}20`
                  : 'rgba(0,0,0,0.4)',
                borderColor: isSelected ? theme.colors.primary : isDropTarget ? '#22c55e' : 'transparent',
                ringColor: isSelected ? theme.colors.primary : 'transparent',
              }}
            >
              {item.type === 'image' ? (
                // 检查是否正在加载中
                (item as DesktopImageItem).isLoading ? (
                  // Loading 状态：进度条动画
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-12 h-12 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="14"
                          fill="none"
                          stroke="url(#progressGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="60 28"
                          className="animate-spin"
                          style={{ animationDuration: '1.5s', transformOrigin: 'center' }}
                        />
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400 font-medium">生成中...</p>
                  </div>
                ) : (item as DesktopImageItem).loadingError ? (
                  // 错误状态：统一简洁格式，按空格查看详情
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-900/80 to-gray-900 p-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
                      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-[9px] text-red-300 text-center font-medium">
                      生成失败{extractErrorCode((item as DesktopImageItem).loadingError) ? ` (${extractErrorCode((item as DesktopImageItem).loadingError)})` : ''}
                    </p>
                    <p className="mt-1 text-[8px] text-gray-500">右键重新生成</p>
                  </div>
                ) : !((item as DesktopImageItem).imageUrl) ? (
                  // 图片丢失状态：统一格式
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-900/60 to-gray-900 p-2">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
                      <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-[9px] text-yellow-300 text-center font-medium line-clamp-2 px-1">图片已丢失</p>
                    <p className="mt-1 text-[8px] text-gray-500">可删除此项</p>
                  </div>
                ) : (
                  // 正常状态：显示图片
                  <img
                    src={getThumbnailUrl((item as DesktopImageItem).imageUrl)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      // 缩略图加载失败，回退到原图
                      const target = e.target as HTMLImageElement;
                      const originalUrl = normalizeImageUrl((item as DesktopImageItem).imageUrl);
                      if (target.src !== originalUrl) {
                        target.src = originalUrl;
                      } else {
                        // 原图也失败，显示占位图
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDEwIDkgMyAxNSIvPjwvc3ZnPg==';
                      }
                    }}
                  />
                )
              ) : item.type === 'stack' ? (
                // Mac风格叠放效果
                <div className="w-full h-full relative">
                  {(() => {
                    const stack = item as DesktopStackItem;
                    const stackImages = stack.itemIds
                      .slice(0, 4) // 最多显示4张
                      .map(id => items.find(i => i.id === id) as DesktopImageItem)
                      .filter(Boolean);
                    
                    return stackImages.map((img, idx) => (
                      <img
                        key={img.id}
                        src={getThumbnailUrl(img.imageUrl)}
                        alt={img.name}
                        onError={(e) => {
                          // 缩略图加载失败，回退到原图
                          const target = e.target as HTMLImageElement;
                          const originalUrl = normalizeImageUrl(img.imageUrl);
                          if (target.src !== originalUrl) {
                            target.src = originalUrl;
                          }
                        }}
                        className="absolute rounded-lg object-cover"
                        style={{
                          width: '70%',
                          height: '70%',
                          left: `${8 + idx * 6}%`,
                          top: `${8 + idx * 6}%`,
                          transform: `rotate(${(idx - 1.5) * 5}deg)`,
                          zIndex: idx,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                        draggable={false}
                      />
                    ));
                  })()}
                  {/* 叠放数量标记 */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
                    {(item as DesktopStackItem).itemIds.length}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FolderIcon className="w-10 h-10 text-blue-500/80" />
                </div>
              )}
              
              {/* 选中标记 */}
              {isSelected && (
                <div 
                  className="absolute inset-0 border-2 rounded-xl pointer-events-none"
                  style={{ borderColor: theme.colors.primary }}
                />
              )}
            </div>
            
            {/* 名称标签 - 支持编辑 */}
            {editingItemId === item.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => {
                  if (editingName.trim() && onRenameItem) {
                    onRenameItem(item.id, editingName.trim());
                  }
                  setEditingItemId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingName.trim() && onRenameItem) {
                      onRenameItem(item.id, editingName.trim());
                    }
                    setEditingItemId(null);
                  } else if (e.key === 'Escape') {
                    setEditingItemId(null);
                  }
                }}
                autoFocus
                className="mt-1 w-full text-xs text-center bg-black/60 border border-white/30 rounded px-1 py-0.5 outline-none focus:border-blue-500"
                style={{ color: theme.colors.textPrimary }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              // 文件夹和叠放始终显示名称，图片根据 hideFileNames 控制
              (item.type === 'folder' || item.type === 'stack' || !hideFileNames) && (
                <p 
                  className="mt-1 text-xs text-center truncate px-1 cursor-default"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.name}
                </p>
              )
            )}
          </div>
        );
      })}

      {/* 选区框 */}
      {isSelecting && selectionBox && (
        <div
          className="absolute border-2 rounded pointer-events-none z-40"
          style={{
            left: Math.min(selectionBox.start.x, selectionBox.end.x),
            top: Math.min(selectionBox.start.y, selectionBox.end.y),
            width: Math.abs(selectionBox.end.x - selectionBox.start.x),
            height: Math.abs(selectionBox.end.y - selectionBox.start.y),
            borderColor: theme.colors.primary,
            backgroundColor: `${theme.colors.primary}20`,
          }}
        />
      )}

      {/* 选中图片时的操作浮层 - 动态方向 */}
      {selectedImageItem && !contextMenu && (() => {
        // 计算浮层显示方向
        const PREVIEW_WIDTH = 320; // 预览卡片宽度
        const PREVIEW_MAX_HEIGHT = 400; // 预览卡片最大高度
        const cWidth = containerRef.current?.clientWidth || 800;
        const cHeight = containerRef.current?.clientHeight || 600;
        const itemX = horizontalPadding + selectedImageItem.position.x;
        const itemY = TOP_OFFSET + selectedImageItem.position.y;
        
        // 计算各方向的可用空间
        const spaceRight = cWidth - (itemX + ICON_SIZE);
        const spaceLeft = itemX;
        const spaceBottom = cHeight - (itemY + ICON_SIZE);
        const spaceTop = itemY;
        
        // 选择最佳方向
        let posStyle: React.CSSProperties = {};
        
        if (spaceRight >= PREVIEW_WIDTH + 20) {
          // 右侧空间足够
          posStyle = {
            left: itemX + ICON_SIZE + 12,
            top: Math.max(8, Math.min(itemY - 60, cHeight - PREVIEW_MAX_HEIGHT - 8)),
          };
        } else if (spaceLeft >= PREVIEW_WIDTH + 20) {
          // 左侧空间足够
          posStyle = {
            left: itemX - PREVIEW_WIDTH - 12,
            top: Math.max(8, Math.min(itemY - 60, cHeight - PREVIEW_MAX_HEIGHT - 8)),
          };
        } else if (spaceBottom >= PREVIEW_MAX_HEIGHT + 20) {
          // 下方空间足够
          posStyle = {
            left: Math.max(8, Math.min(itemX - PREVIEW_WIDTH / 2 + ICON_SIZE / 2, cWidth - PREVIEW_WIDTH - 8)),
            top: itemY + ICON_SIZE + 12,
          };
        } else if (spaceTop >= PREVIEW_MAX_HEIGHT + 20) {
          // 上方空间足够
          posStyle = {
            left: Math.max(8, Math.min(itemX - PREVIEW_WIDTH / 2 + ICON_SIZE / 2, cWidth - PREVIEW_WIDTH - 8)),
            top: itemY - PREVIEW_MAX_HEIGHT - 12,
          };
        } else {
          // 默认右侧，但进行边界纠正
          posStyle = {
            left: Math.min(itemX + ICON_SIZE + 12, cWidth - PREVIEW_WIDTH - 8),
            top: Math.max(8, Math.min(itemY - 60, cHeight - PREVIEW_MAX_HEIGHT - 8)),
          };
        }
        
        return (
          <div
            className="absolute z-30"
            style={{ ...posStyle, width: PREVIEW_WIDTH }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* 毛玻璃背景卡片 */}
            <div 
              className="backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.6)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
              }}
            >
              {/* 错误状态显示完整信息 */}
              {selectedImageItem.loadingError ? (
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1" style={{ color: isLight ? '#dc2626' : '#fca5a5' }}>生成失败</p>
                      <p className="text-xs leading-relaxed break-words" style={{ color: isLight ? '#4b5563' : '#d1d5db' }}>{parseErrorMessage(selectedImageItem.loadingError)}</p>
                    </div>
                  </div>
                  <div className="text-[11px] pt-3" style={{ 
                    color: isLight ? '#6b7280' : '#6b7280',
                    borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    <p>提示：可以右键选择“重新生成”或删除此项</p>
                  </div>
                </div>
              ) : !selectedImageItem.imageUrl ? (
                /* 图片丢失状态 */
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1" style={{ color: isLight ? '#ca8a04' : '#fcd34d' }}>图片丢失</p>
                      <p className="text-xs leading-relaxed" style={{ color: isLight ? '#4b5563' : '#d1d5db' }}>本地文件不存在或已被删除</p>
                    </div>
                  </div>
                  <div className="text-[11px] pt-3" style={{ 
                    color: isLight ? '#6b7280' : '#6b7280',
                    borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    <p>提示：可以删除此项或尝试重新生成</p>
                  </div>
                </div>
              ) : (
                /* 正常图片预览 */
                <>
                  <div 
                    className="relative cursor-pointer group flex items-center justify-center p-4"
                    onClick={() => onImagePreview?.(selectedImageItem)}
                  >
                    <img
                      src={normalizeImageUrl(selectedImageItem.imageUrl)}
                      alt={selectedImageItem.name}
                      className="rounded-lg"
                      style={{
                        maxWidth: PREVIEW_WIDTH - 32,
                        maxHeight: 300,
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                      draggable={false}
                      onError={(e) => {
                        // 图片加载失败时显示错误提示
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errorDiv = target.parentElement?.querySelector('.load-error');
                        if (errorDiv) (errorDiv as HTMLElement).style.display = 'flex';
                      }}
                    />
                    {/* 图片加载失败时显示 */}
                    <div className="load-error hidden flex-col items-center justify-center text-center py-8" style={{display: 'none'}}>
                      <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-sm">图片加载失败</p>
                      <p className="text-gray-500 text-xs mt-1">文件可能已被移动或删除</p>
                    </div>
                    {/* 悬浮放大提示 */}
                    <div className="absolute inset-4 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <ZoomInIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* 底部操作按钮 */}
                  <div className="px-4 pb-4 flex items-center justify-center gap-2 flex-wrap">
                    {/* 下载 */}
                    <button
                      onClick={() => handleDownloadImage(selectedImageItem)}
                      className="flex items-center gap-1.5 px-3 py-2 font-medium rounded-lg text-xs transition-colors hover:opacity-90"
                      style={{ 
                        backgroundColor: isLight ? '#2563eb' : '#004097', 
                        color: '#ffffff' 
                      }}
                      title="下载图片"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      <span>下载</span>
                    </button>
                    {/* 再编辑 */}
                    {onImageEditAgain && (
                      <button
                        onClick={() => onImageEditAgain(selectedImageItem)}
                        className="flex items-center gap-1.5 px-3 py-2 font-medium rounded-lg text-xs transition-colors hover:opacity-90"
                        style={{ 
                          backgroundColor: isLight ? '#475569' : '#3b3c50', 
                          color: '#ffffff' 
                        }}
                        title="再次编辑"
                      >
                        <EditIcon className="w-4 h-4" />
                        <span>编辑</span>
                      </button>
                    )}
                    {/* 重新生成 */}
                    {onImageRegenerate && (
                      <button
                        onClick={() => onImageRegenerate(selectedImageItem)}
                        className="flex items-center gap-1.5 px-3 py-2 font-medium rounded-lg text-xs transition-colors hover:opacity-90"
                        style={{ 
                          backgroundColor: isLight ? '#475569' : '#3b3c50', 
                          color: '#ffffff' 
                        }}
                        title="重新生成"
                      >
                        <RefreshIcon className="w-4 h-4" />
                        <span>重生成</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] py-1.5 rounded-xl shadow-2xl border backdrop-blur-xl"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(18,18,26,0.95)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          }}
        >
          {/* 无项目时的菜单 */}
          {!contextMenu.itemId && (
            <>
              <button
                onClick={handleCreateFolder}
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                style={{ color: theme.colors.textPrimary }}
              >
                <FolderIcon className="w-4 h-4 text-blue-500" />
                <span>新建文件夹</span>
              </button>
              {/* 选中多个图片时可以叠放 */}
              {selectedIds.length >= 2 && selectedIds.every(id => items.find(i => i.id === id)?.type === 'image') && (
                <button
                  onClick={handleCreateStack}
                  className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                  style={{ color: theme.colors.textPrimary }}
                >
                  <LayersIcon className="w-4 h-4 text-blue-400" />
                  <span>叠放选中图片 ({selectedIds.length})</span>
                </button>
              )}
              {clipboard && clipboard.items.length > 0 && (
                <button
                  onClick={handlePaste}
                  className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                  style={{ color: theme.colors.textPrimary }}
                >
                  <ClipboardIcon className="w-4 h-4 text-blue-400" />
                  <span>粘贴 ({clipboard.items.length})</span>
                </button>
              )}
            </>
          )}
          
          {/* 有选中项目时的菜单 */}
          {contextMenu.itemId && (
            <>
              {/* 叠放特有选项 */}
              {items.find(i => i.id === contextMenu.itemId)?.type === 'stack' ? (
                <>
                  <button
                    onClick={() => {
                      // 展开叠放改为双击打开叠放
                      const stack = items.find(i => i.id === contextMenu.itemId) as DesktopStackItem;
                      if (stack && onStackDoubleClick) {
                        onStackDoubleClick(stack);
                      }
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <StackExpandIcon className="w-4 h-4 text-blue-400" /><span>打开叠放</span>
                  </button>
                  <button
                    onClick={() => handleUnstack(contextMenu.itemId!)}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <UnstackIcon className="w-4 h-4 text-blue-400" />
                    <span>解散叠放</span>
                  </button>
                  <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
                  {/* 叠放导出选项 */}
                  <button
                    onClick={async () => {
                      const images = getImagesFromContainer(contextMenu.itemId!);
                      const container = items.find(i => i.id === contextMenu.itemId);
                      await handleExportAsZip(container?.name || '叠放', images);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <PackageIcon className="w-4 h-4 text-blue-400" />
                    <span>{isExporting ? '导出中...' : '导出压缩包'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      const images = getImagesFromContainer(contextMenu.itemId!);
                      await handleBatchDownload(images);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <DownloadIcon className="w-4 h-4 text-blue-400" />
                    <span>{isExporting ? '下载中...' : '批量下载'}</span>
                  </button>
                  <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
                </>
              ) : items.find(i => i.id === contextMenu.itemId)?.type === 'folder' ? (
                <>
                  <button
                    onClick={() => {
                      const item = items.find(i => i.id === contextMenu.itemId);
                      if (item) handleItemDoubleClick(item);
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <FolderOpenIcon className="w-4 h-4 text-blue-500" />
                    <span>打开</span>
                  </button>
                  <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
                  {/* 文件夹导出选项 */}
                  <button
                    onClick={async () => {
                      const images = getImagesFromContainer(contextMenu.itemId!);
                      const container = items.find(i => i.id === contextMenu.itemId);
                      await handleExportAsZip(container?.name || '文件夹', images);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <PackageIcon className="w-4 h-4 text-blue-400" />
                    <span>{isExporting ? '导出中...' : '导出压缩包'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      const images = getImagesFromContainer(contextMenu.itemId!);
                      await handleBatchDownload(images);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <DownloadIcon className="w-4 h-4 text-blue-400" />
                    <span>{isExporting ? '下载中...' : '批量下载'}</span>
                  </button>
                  <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
                </>
              ) : (
                <>
                  {/* 图片特有选项 */}
                  <button
                    onClick={() => {
                      const item = items.find(i => i.id === contextMenu.itemId);
                      if (item) handleItemDoubleClick(item);
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <EyeIcon className="w-4 h-4 text-cyan-400" />
                    <span>预览</span>
                  </button>
                  {/* 编辑 - 紫色 */}
                  {onImageEditAgain && (
                    <button
                      onClick={() => {
                        const item = items.find(i => i.id === contextMenu.itemId) as DesktopImageItem;
                        if (item) onImageEditAgain(item);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <EditIcon className="w-4 h-4 text-purple-400" />
                      <span>编辑</span>
                    </button>
                  )}
                  {/* 重新生成 - 绿色 */}
                  {onImageRegenerate && (
                    <button
                      onClick={() => {
                        const item = items.find(i => i.id === contextMenu.itemId) as DesktopImageItem;
                        if (item) onImageRegenerate(item);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-emerald-500/10 transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <RefreshIcon className="w-4 h-4 text-emerald-400" />
                      <span>重生成</span>
                    </button>
                  )}
                  {/* 创建创意库 - 蓝色 */}
                  {onCreateCreativeIdea && (
                    <button
                      onClick={() => {
                        const item = items.find(i => i.id === contextMenu.itemId) as DesktopImageItem;
                        if (item && item.imageUrl) {
                          // 传递图片URL和提示词
                          onCreateCreativeIdea(item.imageUrl, item.prompt);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <LibraryIcon className="w-4 h-4 text-blue-400" />
                      <span>创建创意库</span>
                    </button>
                  )}
                  {/* 添加到画布 - 青色 */}
                  {onAddToCanvas && (
                    <button
                      onClick={() => {
                        const item = items.find(i => i.id === contextMenu.itemId) as DesktopImageItem;
                        if (item && item.imageUrl) {
                          onAddToCanvas(item.imageUrl, item.name);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <AddToCanvasIcon className="w-4 h-4 text-cyan-400" />
                      <span>添加到画布</span>
                    </button>
                  )}
                  <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
                </>
              )}
              <button
                onClick={() => {
                  const item = items.find(i => i.id === contextMenu.itemId);
                  if (item) {
                    setEditingItemId(item.id);
                    setEditingName(item.name);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-amber-500/10 transition-colors flex items-center gap-2"
                style={{ color: theme.colors.textPrimary }}
              >
                <RenameIcon className="w-4 h-4 text-amber-400" />
                <span>重命名</span>
              </button>
              <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
            </>
          )}
          
          {/* 选中项目的操作 */}
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => { handleCopy(); setContextMenu(null); }}
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-sky-500/10 transition-colors flex items-center gap-2"
                style={{ color: theme.colors.textPrimary }}
              >
                <CopyIcon className="w-4 h-4 text-sky-400" />
                <span>复制</span>
              </button>
              <button
                onClick={() => { handleCut(); setContextMenu(null); }}
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-orange-500/10 transition-colors flex items-center gap-2"
                style={{ color: theme.colors.textPrimary }}
              >
                <ScissorsIcon className="w-4 h-4 text-orange-400" />
                <span>剪切</span>
              </button>
              {/* 在文件夹内时显示移出选项 */}
              {openFolderId && (
                <button
                  onClick={handleMoveOutOfFolder}
                  className="w-full px-3 py-2 text-left text-[12px] hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                  style={{ color: theme.colors.textPrimary }}
                >
                  <MoveOutIcon className="w-4 h-4 text-rose-400" />
                  <span>移出文件夹</span>
                </button>
              )}
              {/* 在叠放内时显示移出选项 */}
              {openStackId && (
                <button
                  onClick={handleMoveOutOfStack}
                  className="w-full px-3 py-2 text-left text-[12px] hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                  style={{ color: theme.colors.textPrimary }}
                >
                  <MoveOutIcon className="w-4 h-4 text-rose-400" />
                  <span>移出叠放</span>
                </button>
              )}
              {/* 选中多个图片时可以叠放 */}
              {selectedIds.length >= 2 && selectedIds.every(id => items.find(i => i.id === id)?.type === 'image') && (
                <>
                  <button
                    onClick={handleCreateStack}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-indigo-500/10 transition-colors flex items-center gap-2"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <LayersIcon className="w-4 h-4 text-indigo-400" />
                    <span>叠放选中图片 ({selectedIds.length})</span>
                  </button>
                  {/* 图片合并选项 */}
                  <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
                  <button
                    onClick={() => handleMergeImages('horizontal')}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-teal-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-teal-400">↔</span>
                    <span>{isExporting ? '合并中...' : '左右合并图片'}</span>
                  </button>
                  <button
                    onClick={() => handleMergeImages('vertical')}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-teal-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-teal-400">↕</span>
                    <span>{isExporting ? '合并中...' : '上下合并图片'}</span>
                  </button>
                </>
              )}
              {/* 选中图片时的导出选项 */}
              {selectedIds.some(id => items.find(i => i.id === id)?.type === 'image') && (
                <>
                  {/* 批量编辑 - 将所有选中的图片添加到资源素材 */}
                  {onImageEditAgain && (
                    <button
                      onClick={async () => {
                        // 获取所有选中的图片类型项目
                        const selectedImages = selectedIds
                          .map(id => items.find(i => i.id === id))
                          .filter((item): item is DesktopImageItem => item?.type === 'image');
                        
                        // 逐个添加到资源素材
                        for (const img of selectedImages) {
                          await onImageEditAgain(img);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <EditIcon className="w-4 h-4 text-purple-400" />
                      <span>编辑选中图片 ({selectedIds.filter(id => items.find(i => i.id === id)?.type === 'image').length})</span>
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await handleExportSelected(true);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-teal-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <PackageIcon className="w-4 h-4 text-teal-400" />
                    <span>{isExporting ? '导出中...' : '导出压缩包'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      await handleExportSelected(false);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-[12px] hover:bg-blue-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <DownloadIcon className="w-4 h-4 text-blue-400" />
                    <span>{isExporting ? '下载中...' : '批量下载'}</span>
                  </button>
                </>
              )}
              <div className="h-px my-1" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
              <button
                onClick={handleDeleteSelected}
                className="w-full px-3 py-2 text-left text-[12px] hover:bg-red-500/10 transition-colors text-red-400 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>删除 ({selectedIds.length})</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// 工具函数：从历史记录创建桌面图片项目
export const createDesktopItemFromHistory = (
  history: GenerationHistory, 
  position?: DesktopPosition
): DesktopImageItem => {
  return {
    id: `img-${history.id}-${Date.now()}`,
    type: 'image',
    name: history.prompt.slice(0, 20) + (history.prompt.length > 20 ? '...' : ''),
    position: position || { x: 50, y: 50 },
    createdAt: history.timestamp,
    updatedAt: Date.now(),
    imageUrl: history.imageUrl,
    prompt: history.prompt,
    model: history.model,
    isThirdParty: history.isThirdParty,
    historyId: history.id,
  };
};
