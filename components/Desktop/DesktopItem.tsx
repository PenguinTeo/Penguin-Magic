/**
 * 桌面项目子组件
 * 使用 React.memo 优化，减少不必要的重新渲染
 */

import React, { memo, useState } from 'react';
import { DesktopItem, DesktopImageItem, DesktopFolderItem, DesktopStackItem } from '../../types';
import { normalizeImageUrl, getThumbnailUrl } from '../../utils/image';
import { FolderIcon } from '../icons/FolderIcon';

// 默认占位图
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0NDQ0NDQiIHN0cm9rZS13aWR0aD0iMSI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjwvc3ZnPg==';

/**
 * 缩略图组件
 * 优先加载缩略图，失败时回退到原图
 */
const ThumbnailImage = memo<{ imageUrl: string; alt: string }>(({ imageUrl, alt }) => {
  const [useThumbnail, setUseThumbnail] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // 缩略图URL
  const thumbnailUrl = getThumbnailUrl(imageUrl);
  // 原图URL
  const originalUrl = normalizeImageUrl(imageUrl);
  
  // 如果不是本地文件路径，直接使用原图
  const shouldUseThumbnail = useThumbnail && imageUrl?.startsWith('/files/');
  
  const handleError = () => {
    if (shouldUseThumbnail && useThumbnail) {
      // 缩略图加载失败，回退到原图
      console.log('[Thumbnail] 加载失败，回退到原图:', thumbnailUrl);
      setUseThumbnail(false);
    } else {
      // 原图也加载失败，显示占位图
      setHasError(true);
    }
  };
  
  return (
    <img
      src={hasError ? PLACEHOLDER_IMAGE : (shouldUseThumbnail ? thumbnailUrl : originalUrl)}
      alt={alt}
      className="w-full h-full object-cover"
      draggable={false}
      onError={handleError}
      loading="lazy"
    />
  );
});

ThumbnailImage.displayName = 'ThumbnailImage';

interface DesktopItemProps {
  item: DesktopItem;
  isSelected: boolean;
  isDropTarget: boolean;
  isDragging: boolean;
  offset: { x: number; y: number };
  horizontalPadding: number;
  topOffset: number;
  iconSize: number;
  hideFileNames: boolean;
  editingItemId: string | null;
  editingName: string;
  theme: any;
  allItems: DesktopItem[];
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onDoubleClick: (item: DesktopItem) => void;
  onContextMenu: (e: React.MouseEvent, itemId: string) => void;
  onEditingNameChange: (name: string) => void;
  onEditingComplete: (itemId: string, newName: string) => void;
  onEditingCancel: () => void;
}

/**
 * 使用 React.memo 包装的桌面项目组件
 * 仅在 props 变化时才重新渲染
 */
export const DesktopItemComponent = memo<DesktopItemProps>(({
  item,
  isSelected,
  isDropTarget,
  isDragging,
  offset,
  horizontalPadding,
  topOffset,
  iconSize,
  hideFileNames,
  editingItemId,
  editingName,
  theme,
  allItems,
  onMouseDown,
  onDoubleClick,
  onContextMenu,
  onEditingNameChange,
  onEditingComplete,
  onEditingCancel,
}) => {
  const isEditing = editingItemId === item.id;
  
  return (
    <div
      className={`absolute select-none cursor-pointer transition-transform ${
        isDragging && isSelected ? 'z-50' : 'z-10'
      }`}
      style={{
        left: horizontalPadding + item.position.x + offset.x,
        top: topOffset + item.position.y + offset.y,
        width: iconSize,
      }}
      onMouseDown={(e) => onMouseDown(e, item.id)}
      onDoubleClick={() => onDoubleClick(item)}
      onContextMenu={(e) => onContextMenu(e, item.id)}
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
          <ThumbnailImage
            imageUrl={(item as DesktopImageItem).imageUrl}
            alt={item.name}
          />
        ) : item.type === 'stack' ? (
          <StackPreview 
            stack={item as DesktopStackItem} 
            allItems={allItems} 
          />
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
      
      {/* 名称标签 */}
      {isEditing ? (
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={() => {
            if (editingName.trim()) {
              onEditingComplete(item.id, editingName.trim());
            }
            onEditingCancel();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editingName.trim()) {
                onEditingComplete(item.id, editingName.trim());
              }
              onEditingCancel();
            } else if (e.key === 'Escape') {
              onEditingCancel();
            }
          }}
          autoFocus
          className="mt-1 w-full text-xs text-center bg-black/60 border border-white/30 rounded px-1 py-0.5 outline-none focus:border-blue-500"
          style={{ color: theme.colors.textPrimary }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
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
}, (prevProps, nextProps) => {
  // 自定义比较函数，只有关键属性变化时才重新渲染
  return (
    prevProps.item === nextProps.item &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDropTarget === nextProps.isDropTarget &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.offset.x === nextProps.offset.x &&
    prevProps.offset.y === nextProps.offset.y &&
    prevProps.hideFileNames === nextProps.hideFileNames &&
    prevProps.editingItemId === nextProps.editingItemId &&
    prevProps.editingName === nextProps.editingName
  );
});

DesktopItemComponent.displayName = 'DesktopItemComponent';

/**
 * 叠放预览组件
 */
const StackPreview = memo<{ stack: DesktopStackItem; allItems: DesktopItem[] }>(({ 
  stack, 
  allItems 
}) => {
  const stackImages = stack.itemIds
    .slice(0, 4)
    .map(id => allItems.find(i => i.id === id) as DesktopImageItem)
    .filter(Boolean);
  
  return (
    <div className="w-full h-full relative">
      {stackImages.map((img, idx) => {
        // 使用缩略图
        const thumbnailUrl = getThumbnailUrl(img.imageUrl);
        const originalUrl = normalizeImageUrl(img.imageUrl);
        const shouldUseThumbnail = img.imageUrl?.startsWith('/files/');
        
        return (
          <img
            key={img.id}
            src={shouldUseThumbnail ? thumbnailUrl : originalUrl}
            alt={img.name}
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
            loading="lazy"
            onError={(e) => {
              // 缩略图失败时回退到原图
              if (shouldUseThumbnail && (e.target as HTMLImageElement).src === thumbnailUrl) {
                (e.target as HTMLImageElement).src = originalUrl;
              }
            }}
          />
        );
      })}
      {/* 叠放数量标记 */}
      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
        {stack.itemIds.length}
      </div>
    </div>
  );
});

StackPreview.displayName = 'StackPreview';
