import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { Play, X } from 'lucide-react';

const SaveImageNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as CanvasNodeData;
  const generatedImageUrl = (nodeData as any).generatedImageUrl;
  const isGenerating = (nodeData as any).isGenerating;
  const error = (nodeData as any).error;
  const onExecute = (nodeData as any).onExecute;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl min-w-[200px]`}
      style={{
        borderColor: selected ? theme.colors.primaryLight : `${theme.colors.primary}60`,
        background: `linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(147, 51, 234, 0.15))`,
        boxShadow: selected ? `0 10px 40px -10px ${theme.colors.glow}` : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 多个输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-creative"
        style={{ top: '25%', backgroundColor: '#3b82f6', borderColor: '#2563eb' }}
        className="!w-4 !h-4 !border-2 hover:!scale-125 transition-transform"
        title="创意库输入"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-image"
        style={{ top: '50%', backgroundColor: '#3b82f6', borderColor: '#1d4ed8' }}
        className="!w-4 !h-4 !border-2 hover:!scale-125 transition-transform"
        title="图片输入"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-prompt"
        style={{ top: '75%', backgroundColor: '#22c55e', borderColor: '#15803d' }}
        className="!w-4 !h-4 !border-2 hover:!scale-125 transition-transform"
        title="提示词输入"
      />

      {/* 节点头部 */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-xl">💾</span>
        <span className="text-sm font-bold text-white flex-1">保存图片</span>
        {/* 执行按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExecute?.();
          }}
          disabled={isGenerating}
          className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          title="执行该节点"
        >
          {isGenerating ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" fill="currentColor" />
          )}
        </button>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-gray-500/30 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 图片预览区域 */}
      <div className="p-4">
        {isGenerating ? (
          <div className="w-full h-32 rounded-xl bg-black/30 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-400">正在生成...</span>
          </div>
        ) : generatedImageUrl ? (
          <div className="relative group">
            <img
              src={generatedImageUrl}
              alt="生成的图片"
              className="w-full h-32 rounded-xl object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">✓ 已保存到桌面</span>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-32 rounded-xl bg-gray-500/10 border border-gray-500/30 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">❌</span>
            <span className="text-sm text-gray-400">{error}</span>
          </div>
        ) : (
          <div className="w-full h-32 rounded-xl bg-black/20 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-xs text-gray-500">连接节点后执行流程</span>
          </div>
        )}
      </div>

      {/* 连接提示 */}
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>创意库 (必选)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>参考图片 (可选)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>提示词 (可选)</span>
          </div>
        </div>
      </div>

      {/* 输出连接点 - 可以作为下一个节点的输入 */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark }}
        className="!w-4 !h-4 !border-2 hover:!scale-125 transition-transform"
        title="输出到下一个节点"
      />
    </div>
  );
};

export default memo(SaveImageNode);
