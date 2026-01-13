import React from 'react';
import { Icons } from './Icons';

interface CanvasNameBadgeProps {
  canvasName: string;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
}

/**
 * 画布名称标识组件
 * 独立模块，显示当前画布名称
 * 位置：左上角，侧边栏右侧
 */
const CanvasNameBadge: React.FC<CanvasNameBadgeProps> = ({
  canvasName,
  isLoading = false,
  hasUnsavedChanges = false,
}) => {
  return (
    <div className="fixed left-24 top-6 z-30 pointer-events-auto">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
        {/* 画布图标 */}
        <div className="w-5 h-5 flex items-center justify-center">
          {isLoading ? (
            <svg className="w-4 h-4 text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Icons.Layout className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        
        {/* 画布名称 */}
        <span className="text-sm font-medium text-white max-w-[160px] truncate">
          {isLoading ? '加载中...' : canvasName}
        </span>
        
        {/* 未保存标记 */}
        {hasUnsavedChanges && !isLoading && (
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="有未保存的修改" />
        )}
      </div>
    </div>
  );
};

export default CanvasNameBadge;
