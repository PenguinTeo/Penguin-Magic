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
  
  const thumbnailUrl = getThumbnailUrl(imageUrl);
  const originalUrl = normalizeImageUrl(imageUrl);
  const shouldUseThumbnail = useThumbnail && imageUrl?.startsWith('/files/');
  
  const handleError = () => {
    if (shouldUseThumbnail && useThumbnail) {
      setUseThumbnail(false);
    } else {
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

/**
 * 加载中状态组件 - 进度条动画
 */
const LoadingOverlay = memo(() => (
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
));

LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * 错误状态组件 - 显示错误信息
 */
const ErrorOverlay = memo<{ error: string }>(({ error }) => {
  const shortError = error.length > 30 ? error.slice(0, 30) + '...' : error;
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-900/80 to-gray-900 p-2">
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-[9px] text-red-300 text-center leading-tight font-medium">{shortError}</p>
      <p className="mt-1 text-[8px] text-gray-500">右键重新生成</p>
    </div>
  );
});

ErrorOverlay.displayName = 'ErrorOverlay';

/**
 * 数据丢失状态组件
 */
const MissingDataOverlay = memo(() => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-900/60 to-gray-900 p-2">
    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mb-1">
      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="text-[9px] text-yellow-300 text-center leading-tight font-medium">图片已丢失</p>
    <p className="mt-1 text-[8px] text-gray-500">可删除此项</p>
  </div>
));

MissingDataOverlay.displayName = 'MissingDataOverlay';

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
 * 渲染图片内容 - 根据状态显示不同内容
 */
const renderImageContent = (imageItem: DesktopImageItem, itemName: string) => {
  // 加载中状态
  if (imageItem.isLoading) {
    return <LoadingOverlay />;
  }
  // 错误状态
  if (imageItem.loadingError) {
    return <ErrorOverlay error={imageItem.loadingError} />;
  }
  // 数据丢失状态（无图片URL且无历史记录ID）
  if (!imageItem.imageUrl && !imageItem.historyId) {
    return <MissingDataOverlay />;
  }
  // 正常显示图片
  return <ThumbnailImage imageUrl={imageItem.imageUrl} alt={itemName} />;
};

/**
 * 使用 React.memo 包装的桌面项目组件
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
          renderImageContent(item as DesktopImageItem, item.name)
        ) : item.type === 'stack' ? (
          <StackPreview stack={item as DesktopStackItem} allItems={allItems} />
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
const StackPreview = memo<{ stack: DesktopStackItem; allItems: DesktopItem[] }>(({ stack, allItems }) => {
  const stackImages = stack.itemIds
    .slice(0, 4)
    .map(id => allItems.find(i => i.id === id) as DesktopImageItem)
    .filter(Boolean);
  
  return (
    <div className="w-full h-full relative">
      {stackImages.map((img, idx) => {
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
              if (shouldUseThumbnail && (e.target as HTMLImageElement).src === thumbnailUrl) {
                (e.target as HTMLImageElement).src = originalUrl;
              }
            }}
          />
        );
      })}
      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
        {stack.itemIds.length}
      </div>
    </div>
  );
});

StackPreview.displayName = 'StackPreview';
