import React, { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { Play, X, Settings, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getAIAppInfo, RHAIAppInfo, RHAIAppNodeInfoItem } from '../../../services/api/runninghub';

// RH 节点扩展数据
export interface RHNodeExtendedData extends CanvasNodeData {
  webappId?: string;
  appInfo?: RHAIAppInfo;
  nodeInputs?: Record<string, string>; // 用户输入的节点值
  isLoading?: boolean; // 加载应用信息中
  isExecuting?: boolean; // 执行中
  error?: string;
  outputUrl?: string; // 生成的输出 URL
  outputType?: string; // 输出类型 (image/video)
  onExecute?: () => void;
}

const RHNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as RHNodeExtendedData;
  
  const [webappIdInput, setWebappIdInput] = useState(nodeData.webappId || '');
  const [isEditing, setIsEditing] = useState(!nodeData.webappId);
  const [appInfo, setAppInfo] = useState<RHAIAppInfo | null>(nodeData.appInfo || null);
  const [nodeInputs, setNodeInputs] = useState<Record<string, string>>(nodeData.nodeInputs || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(nodeData.error || null);

  // 加载应用信息
  const loadAppInfo = useCallback(async (webappId: string) => {
    if (!webappId.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getAIAppInfo(webappId.trim());
      if (result.success && result.data) {
        setAppInfo(result.data);
        // 初始化默认输入值
        const defaults: Record<string, string> = {};
        result.data.nodeInfoList?.forEach(node => {
          if (node.fieldValue) {
            defaults[`${node.nodeId}_${node.fieldName}`] = node.fieldValue;
          }
        });
        setNodeInputs(defaults);
        // 保存到节点数据
        nodeData.onEdit?.(id, { 
          webappId: webappId.trim(), 
          appInfo: result.data,
          nodeInputs: defaults,
          error: undefined
        });
        setIsEditing(false);
      } else {
        setError(result.error || '获取应用信息失败');
      }
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [id, nodeData]);

  // 处理输入变化
  const handleInputChange = useCallback((nodeId: string, fieldName: string, value: string) => {
    const key = `${nodeId}_${fieldName}`;
    const newInputs = { ...nodeInputs, [key]: value };
    setNodeInputs(newInputs);
    nodeData.onEdit?.(id, { nodeInputs: newInputs });
  }, [id, nodeData, nodeInputs]);

  // 获取字段类型图标
  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'IMAGE': return '🖼️';
      case 'VIDEO': return '🎬';
      case 'AUDIO': return '🎵';
      case 'STRING': return '✏️';
      case 'LIST': return '📋';
      default: return '📝';
    }
  };

  // 渲染输入字段
  const renderInputField = (node: RHAIAppNodeInfoItem) => {
    const key = `${node.nodeId}_${node.fieldName}`;
    const value = nodeInputs[key] || '';
    
    // 图片类型显示提示，实际上传通过连接处理
    if (node.fieldType === 'IMAGE' || node.fieldType === 'VIDEO' || node.fieldType === 'AUDIO') {
      return (
        <div key={key} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/10">
          <span className="text-sm">{getFieldTypeIcon(node.fieldType)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 truncate">{node.description || node.fieldName}</div>
            <div className="text-[9px] text-emerald-400/70">从左侧连接输入</div>
          </div>
        </div>
      );
    }
    
    // LIST 类型
    if (node.fieldType === 'LIST' && node.fieldData) {
      try {
        const options = JSON.parse(node.fieldData);
        if (Array.isArray(options)) {
          return (
            <div key={key} className="space-y-1">
              <label className="text-[10px] text-gray-400 flex items-center gap-1">
                {getFieldTypeIcon(node.fieldType)}
                <span className="truncate">{node.description || node.fieldName}</span>
              </label>
              <select
                value={value}
                onChange={(e) => handleInputChange(node.nodeId, node.fieldName, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-md text-white focus:border-emerald-500/50 focus:outline-none"
              >
                {options.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }
      } catch {}
    }
    
    // 默认文本输入
    return (
      <div key={key} className="space-y-1">
        <label className="text-[10px] text-gray-400 flex items-center gap-1">
          {getFieldTypeIcon(node.fieldType)}
          <span className="truncate">{node.description || node.fieldName}</span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(node.nodeId, node.fieldName, e.target.value)}
          placeholder={node.fieldValue || '输入...'}
          className="w-full px-2 py-1.5 text-[10px] bg-black/40 border border-white/10 rounded-md text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
    );
  };

  const isExecuting = nodeData.isExecuting;
  const outputUrl = nodeData.outputUrl;
  const outputType = nodeData.outputType;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl min-w-[220px] max-w-[300px]`}
      style={{
        borderColor: selected ? '#10b981' : 'rgba(16, 185, 129, 0.4)',
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9), rgba(4, 47, 46, 0.9))',
        boxShadow: selected ? '0 10px 40px -10px rgba(16, 185, 129, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-media"
        style={{ top: '50%', backgroundColor: '#10b981', borderColor: '#059669' }}
        className="!w-4 !h-4 !border-2 hover:!scale-125 transition-transform"
        title="媒体输入 (图片/视频)"
      />

      {/* 节点头部 */}
      <div 
        className="px-3 py-2.5 flex items-center gap-2 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
      >
        {/* R 图标 */}
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <span className="text-white font-black text-sm">R</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-emerald-300 block truncate">
            {appInfo?.webappName || 'RunningHub'}
          </span>
          {nodeData.webappId && (
            <span className="text-[9px] text-gray-500 font-mono">ID: {nodeData.webappId.slice(-8)}</span>
          )}
        </div>
        {/* 执行按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            nodeData.onExecute?.();
          }}
          disabled={isExecuting || !appInfo}
          className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
          title="执行"
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" fill="currentColor" />
          )}
        </button>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-3 space-y-3">
        {/* 编辑模式：输入 webappId */}
        {isEditing ? (
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400">AI 应用 ID (webappId)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webappIdInput}
                onChange={(e) => setWebappIdInput(e.target.value)}
                placeholder="输入 webappId..."
                className="flex-1 px-2 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none"
              />
              <button
                onClick={() => loadAppInfo(webappIdInput)}
                disabled={isLoading || !webappIdInput.trim()}
                className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '...' : '加载'}
              </button>
            </div>
            <a
              href="https://www.runninghub.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-emerald-400/70 hover:text-emerald-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              从 RunningHub 获取应用 ID
            </a>
          </div>
        ) : (
          <>
            {/* 显示应用封面 */}
            {appInfo?.covers?.[0]?.url && (
              <div className="relative rounded-lg overflow-hidden aspect-video bg-black/30">
                <img
                  src={appInfo.covers[0].thumbnailUri || appInfo.covers[0].url}
                  alt={appInfo.webappName}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  title="更换应用"
                >
                  <Settings className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* 输入字段 */}
            {appInfo?.nodeInfoList && appInfo.nodeInfoList.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                {appInfo.nodeInfoList.map(renderInputField)}
              </div>
            )}
          </>
        )}

        {/* 错误提示 */}
        {(error || nodeData.error) && (
          <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-[10px] text-red-300">{error || nodeData.error}</span>
          </div>
        )}

        {/* 执行状态 */}
        {isExecuting && (
          <div className="flex items-center gap-2 p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
            <span className="text-[10px] text-emerald-300">正在调用 RunningHub...</span>
          </div>
        )}

        {/* 输出预览 */}
        {outputUrl && !isExecuting && (
          <div className="relative rounded-lg overflow-hidden bg-black/30">
            {outputType === 'video' || outputUrl.includes('.mp4') || outputUrl.includes('.webm') ? (
              <video
                src={outputUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: '150px' }}
              />
            ) : (
              <img
                src={outputUrl}
                alt="生成结果"
                className="w-full rounded-lg object-cover"
                style={{ maxHeight: '150px' }}
              />
            )}
            <div className="absolute bottom-1 right-1 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/80 rounded text-[9px] text-white">
              <CheckCircle className="w-3 h-3" />
              完成
            </div>
          </div>
        )}
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
        className="!w-4 !h-4 !border-2 hover:!scale-125 transition-transform"
        title="输出 (图片/视频)"
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default memo(RHNode);
