import React from 'react';
import { GenerationHistory } from '../types';
import { Clock as ClockIcon, Trash2 as TrashIcon } from 'lucide-react';
import { normalizeImageUrl } from '../utils/image';

interface HistoryPanelProps {
  history: GenerationHistory[];
  onSelect: (item: GenerationHistory) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  onSelect, 
  onDelete,
  onClear 
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <ClockIcon className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-xs">暂无生成记录</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <ClockIcon className="w-3.5 h-3.5" />
          历史记录 ({history.length})
        </span>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
          >
            清空
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
        {history.slice(0, 9).map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500/50 transition-all"
            onClick={() => onSelect(item)}
          >
            <img
              src={normalizeImageUrl(item.imageUrl)}
              alt={`生成于 ${formatTime(item.timestamp)}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 图片加载失败时显示占位符
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDEwIDkgMyAxNSIvPjwvc3ZnPg==';
              }}
            />
            
            {/* 悬停遮罩 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
              <span className="text-[9px] text-white text-center line-clamp-2 px-1">
                {item.prompt.slice(0, 30)}...
              </span>
              <span className="text-[8px] text-gray-400">
                {formatTime(item.timestamp)}
              </span>
            </div>
            
            {/* 模型标识 */}
            <div className="absolute top-1 left-1">
              <span className={`w-2 h-2 rounded-full block ${item.isThirdParty ? 'bg-blue-500' : 'bg-blue-500'}`}></span>
            </div>
            
            {/* 删除按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="absolute top-1 right-1 p-1 bg-gray-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
            >
              <TrashIcon className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
      </div>
      
      {history.length > 9 && (
        <p className="text-[10px] text-center text-gray-500 mt-1">
          还有 {history.length - 9} 条记录
        </p>
      )}
    </div>
  );
};
