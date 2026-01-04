import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { X } from 'lucide-react';

const PromptNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as CanvasNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(nodeData.promptText || '');

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    nodeData.onEdit?.(id, { promptText });
  }, [id, promptText, nodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setPromptText(nodeData.promptText || '');
    }
    e.stopPropagation();
  }, [nodeData.promptText]);

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl min-w-[220px] max-w-[300px]`}
      style={{
        borderColor: selected ? '#4ade80' : 'rgba(34, 197, 94, 0.4)',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.1))',
        boxShadow: selected ? '0 10px 40px -10px rgba(34, 197, 94, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-blue-600 hover:!scale-125 transition-transform"
      />

      {/* 节点头部 */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-lg">✍️</span>
        <span className="text-sm font-bold text-blue-300 flex-1">提示词</span>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-gray-500/30 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 提示词输入 */}
      <div className="p-4">
        {isEditing ? (
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full h-24 bg-black/40 border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="输入提示词..."
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="w-full min-h-[80px] bg-black/20 rounded-xl p-3 text-sm text-gray-300 cursor-text hover:bg-black/30 transition-colors border-2 border-dashed border-transparent hover:border-blue-500/30"
          >
            {promptText || <span className="text-gray-500 italic">点击输入提示词...</span>}
          </div>
        )}
      </div>

      {/* 字数统计 */}
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-500 flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
          <span>{promptText.length} 字符</span>
          {promptText.length > 0 && (
            <span className="text-blue-400">✓ 已输入</span>
          )}
        </div>
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-blue-600 hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(PromptNode);
