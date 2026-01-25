import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { normalizeImageUrl } from '../../../utils/image';
import { X, Image as ImageIcon, Plus, Link, Upload } from 'lucide-react';

const ImageNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as CanvasNodeData;
  const imageUrl = nodeData.imageUrl;
  const onUpload = (nodeData as any).onUpload;
  const onEdit = (nodeData as any).onEdit;
  
  // URL 输入状态
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  // 处理 URL 输入
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setUrlError('请输入图片链接');
      return;
    }
    
    // 简单验证 URL 格式
    if (!urlInput.match(/^https?:\/\/.+/i)) {
      setUrlError('请输入有效的图片链接');
      return;
    }
    
    // 调用 onEdit 更新图片
    if (onEdit) {
      onEdit(id, { imageUrl: urlInput.trim() });
    }
    
    setShowUrlInput(false);
    setUrlInput('');
    setUrlError('');
  };

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl min-w-[180px]`}
      style={{
        borderColor: selected ? '#60a5fa' : 'rgba(59, 130, 246, 0.4)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.15))',
        boxShadow: selected ? '0 10px 40px -10px rgba(59, 130, 246, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入连接点 - 固定位置 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: '28px' }}
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-blue-600 hover:!scale-125 transition-transform"
      />

      {/* 节点头部 */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-lg">📷</span>
        <span className="text-sm font-bold text-blue-300 flex-1">IMAGE</span>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-gray-500/30 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 图片预览/上传区域 */}
      <div className="p-3">
        {imageUrl ? (
          <div className="relative group">
            <img
              src={normalizeImageUrl(imageUrl)}
              alt={nodeData.label}
              className="w-full h-28 rounded-xl object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
              <button
                onClick={onUpload}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="上传图片"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setShowUrlInput(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="输入链接"
              >
                <Link className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : showUrlInput ? (
          <div className="space-y-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="输入图片链接..."
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
              autoFocus
            />
            {urlError && <div className="text-[10px] text-red-400">{urlError}</div>}
            <div className="flex gap-2">
              <button
                onClick={handleUrlSubmit}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors"
              >
                确定
              </button>
              <button
                onClick={() => { setShowUrlInput(false); setUrlInput(''); setUrlError(''); }}
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onUpload}
              className="w-full h-20 rounded-xl bg-black/20 border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/10 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Upload className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
              <span className="text-[10px] text-blue-400">上传图片</span>
            </button>
            <button
              onClick={() => setShowUrlInput(true)}
              className="w-full py-2 rounded-xl bg-black/20 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Link className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              <span className="text-[10px] text-blue-400">输入链接</span>
            </button>
          </div>
        )}
      </div>

      {/* 文件名 */}
      {imageUrl && (
        <div className="px-3 pb-3">
          <div className="text-xs text-gray-400 truncate bg-black/20 rounded-lg px-2 py-1.5">
            {nodeData.label || '未命名图片'}
          </div>
        </div>
      )}

      {/* 输出连接点 - 固定位置 */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: '28px' }}
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-blue-600 hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(ImageNode);
