import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { normalizeImageUrl } from '../../../utils/image';
import { X } from 'lucide-react';

const CreativeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as CanvasNodeData;
  const idea = nodeData.creativeIdea;
  
  // BP变量输入值
  const [bpInputs, setBpInputs] = useState<Record<string, string>>({});

  // 处理变量输入变化
  const handleInputChange = useCallback((fieldId: string, value: string) => {
    setBpInputs(prev => ({ ...prev, [fieldId]: value }));
    // 同步到节点数据
    nodeData.onEdit?.(id, { bpInputValues: { ...bpInputs, [fieldId]: value } });
  }, [id, nodeData, bpInputs]);

  // 判断是否为BP模式
  const isBPMode = idea?.isBP;

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all backdrop-blur-xl`}
      style={{
        width: isBPMode ? undefined : '180px',
        minWidth: isBPMode ? '220px' : undefined,
        maxWidth: isBPMode ? '300px' : undefined,
        borderColor: selected ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))',
        boxShadow: selected ? '0 10px 40px -10px rgba(59, 130, 246, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-blue-400 !border-2 !border-blue-600 hover:!scale-125 transition-transform"
      />

      {/* 节点头部 */}
      <div 
        className="px-2.5 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-sm">🎨</span>
        <span className="text-xs font-bold text-blue-300 flex-1">创意库</span>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-5 h-5 rounded-md bg-white/10 hover:bg-gray-500/30 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* 创意库信息 */}
      {idea && (
        <div className="p-2.5">
          {/* 图片和标题区域 - 普通模式采用类似创意库的卡片布局 */}
          {!isBPMode ? (
            // 普通模式：与创意库一致的布局
            <div className="flex flex-col">
              {/* 图片区域 */}
              {idea.imageUrl && (
                <div className="relative mb-2 rounded-lg overflow-hidden aspect-square bg-black/20">
                  <img
                    src={normalizeImageUrl(idea.imageUrl)}
                    alt={idea.title}
                    className="w-full h-full object-contain p-0.5"
                  />
                  {/* 标签角标 */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                    {idea.isWorkflow && (
                      <span 
                        className="px-1.5 py-0.5 text-[9px] font-bold rounded-full backdrop-blur-sm shadow-lg"
                        style={{ backgroundColor: '#a855f7', color: '#fff' }}
                      >
                        📊 工作流
                      </span>
                    )}
                    {idea.author && (
                      <span 
                        className="px-1.5 py-0.5 text-[9px] font-medium rounded-full backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                      >
                        @{idea.author}
                      </span>
                    )}
                    {idea.cost !== undefined && idea.cost > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-500/90 text-white text-[8px] font-bold rounded-full backdrop-blur-sm flex items-center gap-0.5">
                        <span>🪨</span>
                        <span>{idea.cost}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
              {/* 标题 */}
              <div className="text-xs font-semibold text-white truncate mb-1.5">{idea.title}</div>
              {/* 提示词预览 - 与创意库一致 */}
              {idea.allowViewPrompt !== false && idea.prompt && (
                <div className="text-[10px] text-zinc-300 bg-black/30 rounded-lg p-2 line-clamp-3 leading-relaxed">
                  {idea.prompt.slice(0, 100)}{idea.prompt.length > 100 ? '...' : ''}
                </div>
              )}
              {/* 工作流模式：展示输入字段 */}
              {idea.isWorkflow && idea.workflowInputs && idea.workflowInputs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {idea.workflowInputs.slice(0, 4).map((input, i) => (
                    <span key={i} className="text-[9px] text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded">
                      {input.label}
                    </span>
                  ))}
                  {idea.workflowInputs.length > 4 && (
                    <span className="text-[9px] text-zinc-400">+{idea.workflowInputs.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            // BP模式：原有布局
            <>
              <div className="flex items-center gap-2.5 mb-2.5">
                {idea.imageUrl && (
                  <img
                    src={normalizeImageUrl(idea.imageUrl)}
                    alt={idea.title}
                    className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{idea.title}</div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: '#eed16d', color: '#1a1a2e' }}>BP</span>
                    {idea.isSmartPlus && <span className="px-1 py-0.5 bg-blue-500/30 rounded-md text-blue-300 text-[9px]">S+</span>}
                    {idea.isSmart && <span className="px-1 py-0.5 bg-blue-500/30 rounded-md text-blue-300 text-[9px]">Smart</span>}
                    {idea.cost !== undefined && idea.cost > 0 && <span className="text-blue-400 flex items-center gap-0.5 text-[9px]">🪨 {idea.cost}</span>}
                  </div>
                </div>
              </div>

              {/* 建议参数显示 */}
              {(idea.suggestedAspectRatio || idea.suggestedResolution) && (
                <div className="flex gap-1.5 mb-2.5 flex-wrap">
                  {idea.suggestedAspectRatio && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 rounded-md border border-blue-500/30">
                      <span className="text-[10px]">🖼️</span>
                      <span className="text-[10px] text-blue-300">{idea.suggestedAspectRatio}</span>
                    </div>
                  )}
                  {idea.suggestedResolution && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-500/20 rounded-md border border-gray-500/30">
                      <span className="text-[10px]">📷</span>
                      <span className="text-[10px] text-gray-300">{idea.suggestedResolution}</span>
                    </div>
                  )}
                </div>
              )}

              {/* BP模式变量槽 */}
              {idea.bpFields && idea.bpFields.length > 0 && (
                <div className="mb-2.5 space-y-1.5">
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <span>⚙️</span>
                    <span>变量输入</span>
                  </div>
                  {idea.bpFields.filter(f => f.type === 'input').map(field => (
                    <div key={field.id} className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-gray-400">{field.label}</label>
                      <input
                        type="text"
                        value={bpInputs[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={`输入${field.label}...`}
                        className="w-full px-2 py-1.5 text-[10px] bg-black/40 border border-white/10 rounded-md text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  ))}
                  {/* 显示智能体字段（只读） */}
                  {idea.bpFields.filter(f => f.type === 'agent').length > 0 && (
                    <div className="text-[10px] text-blue-400/70 flex items-center gap-1 mt-0.5">
                      <span>🤖</span>
                      <span>{idea.bpFields.filter(f => f.type === 'agent').length} 个智能体字段</span>
                    </div>
                  )}
                </div>
              )}

              {/* BP模式也展示变量标签（类似创意库hover效果） */}
              {idea.bpFields && idea.bpFields.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {idea.bpFields.slice(0, 4).map((field, i) => (
                    <span key={i} className="text-[9px] text-zinc-300 bg-white/10 px-1.5 py-0.5 rounded">
                      {field.label}
                    </span>
                  ))}
                  {idea.bpFields.length > 4 && (
                    <span className="text-[9px] text-zinc-400">+{idea.bpFields.length - 4}</span>
                  )}
                </div>
              )}

              {/* 提示词预览 */}
              {idea.allowViewPrompt !== false && idea.prompt && (
                <div className="text-[10px] text-zinc-300 bg-black/30 rounded-lg p-2 line-clamp-2 leading-relaxed">
                  {idea.prompt.slice(0, 100)}{idea.prompt.length > 100 ? '...' : ''}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-blue-400 !border-2 !border-blue-600 hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(CreativeNode);
