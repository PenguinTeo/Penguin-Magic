
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { CanvasNode, NodeType, getNodeTypeColor } from '../../types/pebblingTypes';
import { Icons } from './Icons';
import { ChevronDown } from 'lucide-react';
import { useRHTaskQueue } from '../../contexts/RHTaskQueueContext';

// 香蕉SVG图标组件
const BananaIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M20.5,10.5c-0.8-0.8-1.9-1.3-3-1.4c0.1-0.5,0.2-1.1,0.2-1.6c0-2.2-1.8-4-4-4c-1.4,0-2.6,0.7-3.3,1.8 C9.6,4.2,8.4,3.5,7,3.5c-2.2,0-4,1.8-4,4c0,0.5,0.1,1.1,0.2,1.6c-1.1,0.1-2.2,0.6-3,1.4c-1.4,1.4-1.4,3.7,0,5.1 c0.7,0.7,1.6,1.1,2.5,1.1c0.9,0,1.8-0.4,2.5-1.1c0.7-0.7,1.1-1.6,1.1-2.5c0-0.9-0.4-1.8-1.1-2.5c-0.2-0.2-0.4-0.4-0.7-0.5 c-0.1-0.4-0.2-0.9-0.2-1.3c0-1.1,0.9-2,2-2s2,0.9,2,2c0,0.5-0.2,0.9-0.5,1.3c-0.5,0.6-0.7,1.3-0.7,2.1c0,0.9,0.4,1.8,1.1,2.5 c0.7,0.7,1.6,1.1,2.5,1.1s1.8-0.4,2.5-1.1c0.7-0.7,1.1-1.6,1.1-2.5c0-0.8-0.3-1.5-0.7-2.1c-0.3-0.4-0.5-0.8-0.5-1.3 c0-1.1,0.9-2,2-2s2,0.9,2,2c0,0.5-0.1,0.9-0.2,1.3c-0.2,0.1-0.5,0.3-0.7,0.5c-0.7,0.7-1.1,1.6-1.1,2.5c0,0.9,0.4,1.8,1.1,2.5 c0.7,0.7,1.6,1.1,2.5,1.1c0.9,0,1.8-0.4,2.5-1.1C21.9,14.2,21.9,11.9,20.5,10.5z"/>
  </svg>
);

// 动态导入 3D 组件以避免影响初始加载
const MultiAngle3D = lazy(() => import('./MultiAngle3D'));

// 自定义下拉选择器组件（替代原生 select，支持深色主题）
const CustomSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (value: string) => void;
  isLightCanvas: boolean;
  themeColors: { textSecondary: string };
}> = ({ options, value, onChange, isLightCanvas, themeColors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  return (
    <div ref={ref} className="relative w-full">
      <div
        className="w-full rounded px-1.5 py-0.5 text-[8px] cursor-pointer flex items-center justify-between"
        style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: themeColors.textSecondary }}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={10} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-0.5 rounded shadow-lg z-50 max-h-40 overflow-y-auto"
          style={{ backgroundColor: isLightCanvas ? '#ffffff' : '#1c1c1e', border: `1px solid ${isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}
        >
          {options.map((opt, i) => (
            <div
              key={i}
              className={`px-2 py-1 text-[8px] cursor-pointer transition-colors ${opt === value ? 'font-bold' : ''}`}
              style={{ 
                backgroundColor: opt === value ? (isLightCanvas ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)') : 'transparent',
                color: opt === value ? '#10b981' : themeColors.textSecondary
              }}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setIsOpen(false); }}
              onMouseEnter={(e) => { (e.target as HTMLDivElement).style.backgroundColor = isLightCanvas ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { (e.target as HTMLDivElement).style.backgroundColor = opt === value ? (isLightCanvas ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)') : 'transparent'; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface CanvasNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  isLightCanvas?: boolean; // 画布浅色主题
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string, count?: number) => void; // count: 批量生成数量
  onStop: (id: string) => void;
  onDownload: (id: string) => void;
  onStartConnection: (nodeId: string, portType: 'in' | 'out', position: { x: number, y: number }) => void;
  onEndConnection: (nodeId: string, portKey?: string) => void; // portKey: rh-config 参数端口标识
  onDragStart: (e: React.MouseEvent, id: string) => void;
  scale: number;
  effectiveColor?: string;
  onCreateToolNode?: (sourceNodeId: string, toolType: NodeType, position: { x: number, y: number }) => void;
  onExtractFrame?: (nodeId: string, position: 'first' | 'last' | number) => void; // 提取视频帧（首帧/尾帧/任意秒数）
  onCreateFrameExtractor?: (sourceVideoNodeId: string) => void; // 创建帧提取器节点
  onExtractFrameFromExtractor?: (nodeId: string, time: number) => void; // 从帧提取器提取帧
  hasDownstream?: boolean; // 是否有下游连接
  incomingConnections?: Array<{ fromNode: string; toPortKey?: string }>; // 连入当前节点的连接
  onRetryVideoDownload?: (nodeId: string) => void; // 重试视频下载
}

const CanvasNodeItem: React.FC<CanvasNodeProps> = ({ 
  node, 
  isSelected,
  isLightCanvas = false,
  onSelect, 
  onUpdate,
  onDelete,
  onExecute,
  onStop,
  onDownload,
  onStartConnection,
  onEndConnection,
  onDragStart,
  scale,
  effectiveColor,
  onCreateToolNode,
  onExtractFrame,
  onCreateFrameExtractor,
  onExtractFrameFromExtractor,
  hasDownstream = false,
  incomingConnections = [],
  onRetryVideoDownload
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(node.content);
  const [localPrompt, setLocalPrompt] = useState(node.data?.prompt || '');
  const [localSystem, setLocalSystem] = useState(node.data?.systemInstruction || '');
  const [localModel, setLocalModel] = useState(node.data?.model || 'gemini-2.5-flash-preview-05-20');
  const [batchCount, setBatchCount] = useState(1); // 批量生成数量
  
  // RH 任务队列状态
  const rhTaskQueue = useRHTaskQueue();
  const nodeTaskStatus = node.type === 'rh-config' ? rhTaskQueue.getNodeTaskStatus(node.id) : null;

  // 主题颜色变量
  const themeColors = {
    nodeBg: isLightCanvas ? '#ffffff' : '#1c1c1e',
    nodeBgAlt: isLightCanvas ? '#f5f5f7' : '#0a0a0f',
    nodeBorder: isLightCanvas ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
    textPrimary: isLightCanvas ? '#1d1d1f' : '#ffffff',
    textSecondary: isLightCanvas ? '#6e6e73' : '#a1a1aa',
    textMuted: isLightCanvas ? '#8e8e93' : '#71717a',
    inputBg: isLightCanvas ? '#f5f5f7' : '#0a0a0f',
    inputBorder: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    headerBg: isLightCanvas ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
    headerBorder: isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
    footerBg: isLightCanvas ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)',
  };
  
  // Resize Node Specific State
  const [resizeMode, setResizeMode] = useState<'longest' | 'shortest' | 'width' | 'height' | 'exact'>(node.data?.resizeMode || 'longest');
  const [resizeWidth, setResizeWidth] = useState<number>(node.data?.resizeWidth || 1024);
  const [resizeHeight, setResizeHeight] = useState<number>(node.data?.resizeHeight || 1024);

  // MultiAngle Node Specific State
  const [angleRotate, setAngleRotate] = useState<number>(node.data?.angleRotate ?? 0);
  const [angleVertical, setAngleVertical] = useState<number>(node.data?.angleVertical ?? 0);
  const [angleZoom, setAngleZoom] = useState<number>(node.data?.angleZoom ?? 5);
  const [angleDetailMode, setAngleDetailMode] = useState<boolean>(node.data?.angleDetailMode ?? true);

  // 媒体信息状态（图片/视频通用）
  const [showMediaInfo, setShowMediaInfo] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [mediaMetadata, setMediaMetadata] = useState<{width: number, height: number, size: string, format: string, duration?: string} | null>(null);
  const [customFrameTime, setCustomFrameTime] = useState<string>(''); // 任意帧提取时间（秒）
  const [videoFallbackToImage, setVideoFallbackToImage] = useState(false); // 视频加载失败时回退到图片

  const [isResizing, setIsResizing] = useState(false);
  const [openSelectKey, setOpenSelectKey] = useState<string | null>(null); // 自定义下拉框状态
  const [rhBatchCount, setRhBatchCount] = useState(1); // rh-config 节点批次数量
  const nodeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalContent(node.content);
    setLocalPrompt(node.data?.prompt || '');
    setLocalSystem(node.data?.systemInstruction || '');
    if (node.data?.resizeMode) setResizeMode(node.data.resizeMode);
    if (node.data?.resizeWidth) setResizeWidth(node.data.resizeWidth);
    if (node.data?.resizeHeight) setResizeHeight(node.data.resizeHeight);
    if (node.data?.angleRotate !== undefined) setAngleRotate(node.data.angleRotate);
    if (node.data?.angleVertical !== undefined) setAngleVertical(node.data.angleVertical);
    if (node.data?.angleZoom !== undefined) setAngleZoom(node.data.angleZoom);
    if (node.data?.angleDetailMode !== undefined) setAngleDetailMode(node.data.angleDetailMode);
    
    // 计算媒体元数据（图片/视频）
    const isLocalFile = node.content && node.content.startsWith('/files/');
    const isImageContent = node.content && (node.content.startsWith('data:image') || (node.content.startsWith('http') && !node.content.includes('.mp4')) || (isLocalFile && !node.content.includes('.mp4')));
    const isVideoContent = node.content && (node.content.startsWith('data:video') || node.content.includes('.mp4'));
    
    if (isImageContent) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        // 计算文件大小
        let size = '未知';
        if (node.content.startsWith('data:image')) {
          const base64str = node.content.split(',')[1] || '';
          const sizeBytes = (base64str.length * 3) / 4;
          if (sizeBytes > 1024 * 1024) {
            size = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
          } else {
            size = `${(sizeBytes / 1024).toFixed(1)} KB`;
          }
        } else if (node.content.startsWith('http') || node.content.startsWith('/files/')) {
          // 尝试通过 fetch 获取网络/本地图片大小
          try {
            const fetchUrl = node.content.startsWith('/files/') ? `http://localhost:8765${node.content}` : node.content;
            const response = await fetch(fetchUrl, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              const sizeBytes = parseInt(contentLength, 10);
              if (sizeBytes > 1024 * 1024) {
                size = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
              } else {
                size = `${(sizeBytes / 1024).toFixed(1)} KB`;
              }
            }
          } catch (e) {
            // 如果 HEAD 请求失败，保持未知
          }
        }
        
        // 获取格式
        let format = '未知';
        if (node.content.includes('data:image/png') || node.content.includes('.png')) format = 'PNG';
        else if (node.content.includes('data:image/jpeg') || node.content.includes('data:image/jpg') || node.content.includes('.jpg') || node.content.includes('.jpeg')) format = 'JPEG';
        else if (node.content.includes('data:image/webp') || node.content.includes('.webp')) format = 'WebP';
        else if (node.content.includes('data:image/gif') || node.content.includes('.gif')) format = 'GIF';
        else format = 'JPEG'; // 默认格式
        
        setMediaMetadata({ width, height, size, format });
      };
      // 本地文件需要添加域名
      img.src = node.content.startsWith('/files/') ? `http://localhost:8765${node.content}` : node.content;
    } else if (isVideoContent) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = async () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration ? `${Math.round(video.duration)}s` : '未知';
        
        // 计算文件大小
        let size = '未知';
        if (node.content.startsWith('data:video')) {
          const base64str = node.content.split(',')[1] || '';
          const sizeBytes = (base64str.length * 3) / 4;
          if (sizeBytes > 1024 * 1024) {
            size = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
          } else {
            size = `${(sizeBytes / 1024).toFixed(1)} KB`;
          }
        } else if (node.content.startsWith('/files/') || node.content.startsWith('http')) {
          // 尝试获取本地/网络视频大小
          try {
            const fetchUrl = node.content.startsWith('/files/') ? `http://localhost:8765${node.content}` : node.content;
            const response = await fetch(fetchUrl, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              const sizeBytes = parseInt(contentLength, 10);
              if (sizeBytes > 1024 * 1024) {
                size = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
              } else {
                size = `${(sizeBytes / 1024).toFixed(1)} KB`;
              }
            }
          } catch (e) {
            // 失败时保持未知
          }
        }
        
        setMediaMetadata({ width, height, size, format: 'MP4', duration });
      };
      // 本地文件需要添加域名
      video.src = node.content.startsWith('/files/') ? `http://localhost:8765${node.content}` : node.content;
    }
  }, [node.content, node.title, node.data, node.type]);

  // Enter Key to Edit shortcut
  useEffect(() => {
      if (isSelected && !isEditing && (node.type === 'text' || node.type === 'idea')) {
          const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  setIsEditing(true);
              }
          };
          window.addEventListener('keydown', handleKeyDown);
          return () => window.removeEventListener('keydown', handleKeyDown);
      }
  }, [isSelected, isEditing, node.type]);

  const handleUpdate = () => {
    onUpdate(node.id, { 
        content: localContent, 
        data: { 
            ...node.data, 
            prompt: localPrompt, 
            systemInstruction: localSystem,
            model: localModel,
            resizeMode: resizeMode,
            resizeWidth: resizeWidth,
            resizeHeight: resizeHeight
        }
    });
  };

  const handleBlur = () => {
        setIsEditing(false);
        handleUpdate();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = node.width;
    const startHeight = node.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = (moveEvent.clientX - startX) / scale;
        const deltaY = (moveEvent.clientY - startY) / scale;
        onUpdate(node.id, {
            width: Math.max(150, startWidth + deltaX),
            height: Math.max(100, startHeight + deltaY)
        });
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePortDown = (e: React.MouseEvent, type: 'in' | 'out') => {
      e.stopPropagation();
      e.preventDefault(); 
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      onStartConnection(node.id, type, { x, y });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  // 🔧 上传图片后立即设置 status 为 completed（关键修复点）
                  onUpdate(node.id, { 
                      content: ev.target.result as string,
                      status: 'completed' // 标记为已完成，避免级联执行时重复生成
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // 计算最大公约数
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  // 计算宽高比
  const getAspectRatio = (width: number, height: number): string => {
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  // Modern Input Style - 根据主题调整
  const inputBaseClass = isLightCanvas 
    ? "w-full bg-gray-100 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 outline-none focus:border-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed placeholder-gray-400"
    : "w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed placeholder-zinc-600";

  // 黑白风格 - 所有节点统一使用灰白色
  const getTypeColor = (type: NodeType) => {
      return 'bg-white/80 border-white/60';
  };

  // 连接点颜色 - 根据主题调整
  const outputPortColor = isLightCanvas 
    ? 'bg-gray-700 border-gray-500' 
    : 'bg-white/80 border-white/60';
  const inputPortColor = isLightCanvas 
    ? 'bg-gray-400 border-gray-500 group-hover/port:bg-gray-700' 
    : 'bg-zinc-600 border-zinc-400 group-hover/port:bg-white';

  // 控件背景色 - 用于按钮组、输入框等
  const controlBg = isLightCanvas ? 'bg-gray-100' : 'bg-black/40';
  // 选中状态背景
  const selectedBg = isLightCanvas ? 'bg-blue-100' : 'bg-blue-500/30';
  const selectedText = isLightCanvas ? 'text-blue-700' : 'text-blue-200';
  // 底部状态栏背景
  const footerBarBg = isLightCanvas ? 'bg-gray-50' : 'bg-black/30';

  const isRelay = node.type === 'relay';
  const isRunning = node.status === 'running';
  const isToolNode = ['edit', 'remove-bg', 'upscale', 'resize'].includes(node.type);
  const showRunningIndicator = isRunning && !isToolNode;

  // --- Renderers ---

  const renderLLMNode = () => {
      // 复制到剪贴板
      const handleCopyContent = (e: React.MouseEvent) => {
          e.stopPropagation();
          // 复制 data.output 的内容
          if (node.data?.output) {
              navigator.clipboard.writeText(node.data.output);
          }
      };

      // 阻止滚轮事件冒泡到画布
      const handleWheel = (e: React.WheelEvent) => {
          e.stopPropagation();
      };

      // LLM节点始终显示配置界面，不根据 content 切换
      const hasOutput = node.data?.output && node.status === 'completed';

      return (
        <div 
          className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg"
          style={{ 
            backgroundColor: themeColors.nodeBg, 
            border: `1px solid ${themeColors.nodeBorder}` 
          }}
        >
            {/* Header */}
            <div 
              className="h-8 flex items-center justify-between px-3"
              style={{ 
                backgroundColor: themeColors.headerBg, 
                borderBottom: `1px solid ${themeColors.headerBorder}` 
              }}
            >
                <div className="flex items-center gap-2">
                    <Icons.Sparkles size={14} style={{ color: themeColors.textSecondary }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>{node.title || "LLM Logic"}</span>
                </div>
                {hasOutput && (
                    <button
                        onClick={handleCopyContent}
                        className="p-1 rounded hover:bg-black/5 transition-colors"
                        style={{ color: themeColors.textMuted }}
                        title="复制输出内容"
                    >
                        <Icons.Copy size={12} />
                    </button>
                )}
            </div>

            <div 
                className="flex-1 flex flex-col p-2 gap-2 overflow-hidden"
                onWheel={handleWheel}
            >
                {/* Model Selection */}
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase px-1" style={{ color: themeColors.textMuted }}>Model</label>
                    <select
                        className={inputBaseClass + " h-7 text-xs"}
                        value={localModel}
                        onChange={(e) => { setLocalModel(e.target.value); onUpdate(node.id, { data: { ...node.data, model: e.target.value } }); }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <option value="gemini-2.5-flash-preview-05-20">Gemini-2.5-Flash</option>
                        <option value="gemini-3-flash-preview">Gemini-3-Flash</option>
                        <option value="gemini-3-pro-preview">Gemini-3-Pro</option>
                        <option value="gemini-2.5-pro-thinking">Gemini-2.5-Thinking</option>
                        <option value="qwen3-vl-235b-a22b">Qwen3-VL-235B</option>
                        <option value="gpt-5.2-pro">GPT-5.2-Pro</option>
                        <option value="gpt-5.2-all">GPT-5.2-All</option>
                        <option value="gpt-5.2">GPT-5.2</option>
                    </select>
                </div>

                {/* System Prompt (Optional) */}
                <div className="flex flex-col gap-1 min-h-[30%]">
                    <label className="text-[9px] font-bold uppercase px-1" style={{ color: themeColors.textMuted }}>System Instruction (Optional)</label>
                    <textarea 
                        className={inputBaseClass + " flex-1 resize-none font-mono"}
                        placeholder="Define behavior (e.g., 'You are a poet')..."
                        value={localSystem}
                        onChange={(e) => setLocalSystem(e.target.value)}
                        onBlur={handleUpdate}
                        onMouseDown={(e) => e.stopPropagation()} 
                    />
                </div>
                
                {/* User Prompt */}
                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[9px] font-bold uppercase px-1" style={{ color: themeColors.textMuted }}>User Prompt (Optional)</label>
                    <textarea 
                        className={inputBaseClass + " flex-1 resize-none"}
                        placeholder="Additional instruction..."
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        onBlur={handleUpdate}
                        onMouseDown={(e) => e.stopPropagation()} 
                    />
                </div>
            </div>
            
            {/* Badges */}
            <div 
              className="h-6 px-2 flex items-center justify-between text-[9px] font-mono"
              style={{ 
                backgroundColor: themeColors.footerBg, 
                borderTop: `1px solid ${themeColors.headerBorder}`,
                color: themeColors.textMuted 
              }}
            >
                <span className={`flex items-center gap-1 ${hasOutput ? 'text-emerald-500' : ''}`}>
                   {hasOutput ? 'COMPLETED' : 'INPUT: AUTO'}
                </span>
                <span className="flex items-center gap-1">
                   OUT: <span style={{ color: themeColors.textSecondary }}>TEXT</span>
                </span>
            </div>

            {isRunning && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
            )}
        </div>
      );
  };

  const renderResizeNode = () => {
    // Determine which inputs are enabled based on mode
    const isWidthEnabled = resizeMode === 'width' || resizeMode === 'exact' || resizeMode === 'longest' || resizeMode === 'shortest';
    const isHeightEnabled = resizeMode === 'height' || resizeMode === 'exact';
    
    const widthLabel = (resizeMode === 'longest' || resizeMode === 'shortest') ? 'Target (px)' : 'Width (px)';

    // 切换到 3D 模式
    const switchTo3D = () => {
      onUpdate(node.id, {
        data: { ...node.data, nodeMode: '3d' }
      });
    };

    // If there's output content, show the result image
    if (node.content && (node.content.startsWith('data:image') || node.content.startsWith('http://') || node.content.startsWith('https://'))) {
        // 图片加载后自动调整节点尺寸以匹配图片比例
        const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget;
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;
            const aspectRatio = imgWidth / imgHeight;
            
            // 保持宽度不变，根据比例计算高度（加上标题栏32px）
            const newHeight = Math.round(node.width / aspectRatio) + 32;
            // 只有当高度差异较大时才更新，避免无限循环
            if (Math.abs(newHeight - node.height) > 10) {
                onUpdate(node.id, { height: newHeight });
            }
        };
        
        return (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                <div className="h-8 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                    <Icons.Resize size={14} style={{ color: themeColors.textSecondary }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>Resized</span>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <img 
                        src={node.content} 
                        alt="Resized" 
                        className="w-full h-full object-contain" 
                        draggable={false}
                        onLoad={handleImageLoad}
                        style={{
                            imageRendering: 'auto',
                            transform: 'translateZ(0)',
                            willChange: 'transform',
                            backfaceVisibility: 'hidden',
                        } as React.CSSProperties}
                    />
                    
                    {/* 信息查询按钮 */}
                    <div 
                      className="absolute top-2 right-2 z-20"
                      onMouseEnter={() => setShowMediaInfo(true)}
                      onMouseLeave={() => setShowMediaInfo(false)}
                    >
                      <div 
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
                        title="图片信息"
                      >
                        <Icons.Info size={14} className="text-white/70" />
                      </div>
                      
                      {/* 信息浮窗 */}
                      {showMediaInfo && mediaMetadata && (
                        <div 
                          className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-white/90 whitespace-nowrap shadow-lg"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-0.5">
                            <div><span className="text-zinc-500">宽度:</span> {mediaMetadata.width} px</div>
                            <div><span className="text-zinc-500">高度:</span> {mediaMetadata.height} px</div>
                            <div><span className="text-zinc-500">比例:</span> {getAspectRatio(mediaMetadata.width, mediaMetadata.height)}</div>
                            <div><span className="text-zinc-500">大小:</span> {mediaMetadata.size}</div>
                            <div><span className="text-zinc-500">格式:</span> {mediaMetadata.format}</div>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
                {isRunning && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
            <div className="h-8 flex items-center justify-between px-3 gap-2 shrink-0" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                <div className="flex items-center gap-2">
                    <Icons.Resize size={14} style={{ color: themeColors.textSecondary }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>Smart Resize</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); switchTo3D(); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-800/40 hover:bg-cyan-700/50 text-cyan-300 transition-colors"
                  title="切换到 3D 视角模式"
                >
                  ↔ 3D
                </button>
            </div>
            <div className="flex-1 p-3 flex flex-col justify-center gap-3">
                 <div className="space-y-1">
                     <label className="text-[9px] font-bold text-zinc-500 uppercase px-1">Resize Mode</label>
                     <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            className={inputBaseClass + " flex items-center justify-between gap-1 cursor-pointer hover:border-blue-500/30"}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenSelectKey(openSelectKey === 'resize-mode' ? null : 'resize-mode');
                            }}
                        >
                            <span className="truncate">
                                {resizeMode === 'longest' ? 'Longest Side' :
                                 resizeMode === 'shortest' ? 'Shortest Side' :
                                 resizeMode === 'width' ? 'Fixed Width' :
                                 resizeMode === 'height' ? 'Fixed Height' : 'Exact (Stretch)'}
                            </span>
                            <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${openSelectKey === 'resize-mode' ? 'rotate-180' : ''}`} />
                        </button>
                        {openSelectKey === 'resize-mode' && (
                            <div className="absolute z-50 w-full mt-1 bg-[#1a1a1e] border border-white/20 rounded-lg shadow-xl overflow-hidden">
                                {[
                                    { value: 'longest', label: 'Longest Side' },
                                    { value: 'shortest', label: 'Shortest Side' },
                                    { value: 'width', label: 'Fixed Width' },
                                    { value: 'height', label: 'Fixed Height' },
                                    { value: 'exact', label: 'Exact (Stretch)' }
                                ].map((opt) => (
                                    <div
                                        key={opt.value}
                                        className={`px-2 py-1.5 text-[10px] cursor-pointer transition-colors ${
                                            resizeMode === opt.value 
                                                ? 'bg-blue-500/20 text-blue-300' 
                                                : 'text-zinc-300 hover:bg-white/10'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newVal = opt.value as any;
                                            setResizeMode(newVal);
                                            onUpdate(node.id, { 
                                                data: { 
                                                    ...node.data, 
                                                    resizeMode: newVal,
                                                    resizeWidth,
                                                    resizeHeight
                                                }
                                            });
                                            setOpenSelectKey(null);
                                        }}
                                    >
                                        {opt.label}
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <label className={`text-[9px] font-bold uppercase px-1 transition-colors ${isWidthEnabled ? 'text-zinc-500' : 'text-zinc-700'}`}>{widthLabel}</label>
                        <input 
                            type="number"
                            value={resizeWidth}
                            disabled={!isWidthEnabled}
                            onChange={(e) => setResizeWidth(parseInt(e.target.value) || 0)}
                            onBlur={handleUpdate}
                            className={inputBaseClass}
                            placeholder="W"
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className={`text-[9px] font-bold uppercase px-1 transition-colors ${isHeightEnabled ? 'text-zinc-500' : 'text-zinc-700'}`}>Height (px)</label>
                        <input 
                            type="number"
                            value={resizeHeight}
                            disabled={!isHeightEnabled}
                            onChange={(e) => setResizeHeight(parseInt(e.target.value) || 0)}
                            onBlur={handleUpdate}
                            className={inputBaseClass}
                            placeholder={isHeightEnabled ? "H" : "Auto"}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                     </div>
                 </div>

            </div>
            <div className="h-6 bg-black/20 border-t border-white/5 px-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1">IN: <span className="text-zinc-300">IMG</span></span>
                <span className="flex items-center gap-1">OUT: <span className="text-zinc-300">IMG</span></span>
            </div>
            {isRunning && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
  };

  // 视角控制辅助函数
  const getHorizontalDirection = (angle: number, detail: boolean): string => {
    const hAngle = angle % 360;
    const suffix = detail ? "" : " quarter";
    if (hAngle < 22.5 || hAngle >= 337.5) return "front view";
    if (hAngle < 67.5) return `front-right${suffix} view`;
    if (hAngle < 112.5) return "right side view";
    if (hAngle < 157.5) return `back-right${suffix} view`;
    if (hAngle < 202.5) return "back view";
    if (hAngle < 247.5) return `back-left${suffix} view`;
    if (hAngle < 292.5) return "left side view";
    return `front-left${suffix} view`;
  };
  const getVerticalDirection = (v: number, detail: boolean): string => {
    if (detail) {
      if (v < -15) return "low angle";
      if (v < 15) return "eye level";
      if (v < 45) return "high angle";
      if (v < 75) return "bird's eye view";
      return "top-down view";
    } else {
      if (v < -15) return "low-angle shot";
      if (v < 15) return "eye-level shot";
      if (v < 75) return "elevated shot";
      return "high-angle shot";
    }
  };
  const getDistanceDesc = (z: number, detail: boolean): string => {
    if (detail) {
      if (z < 2) return "wide shot";
      if (z < 4) return "medium-wide shot";
      if (z < 6) return "medium shot";
      if (z < 8) return "medium close-up";
      return "close-up";
    } else {
      if (z < 2) return "wide shot";
      if (z < 6) return "medium shot";
      return "close-up";
    }
  };
  const getHorizontalLabel = (angle: number): string => {
    const hAngle = angle % 360;
    if (hAngle < 22.5 || hAngle >= 337.5) return "正面";
    if (hAngle < 67.5) return "右前";
    if (hAngle < 112.5) return "右侧";
    if (hAngle < 157.5) return "右后";
    if (hAngle < 202.5) return "背面";
    if (hAngle < 247.5) return "左后";
    if (hAngle < 292.5) return "左侧";
    return "左前";
  };
  const getVerticalLabel = (v: number): string => {
    if (v < -15) return "仰视";
    if (v < 15) return "平视";
    if (v < 45) return "高角度";
    if (v < 75) return "鸟瞰";
    return "俯视";
  };
  const getZoomLabel = (z: number): string => {
    if (z < 2) return "远景";
    if (z < 4) return "中远景";
    if (z < 6) return "中景";
    if (z < 8) return "中近景";
    return "特写";
  };

  const renderMultiAngleNode = () => {
    const hDir = getHorizontalDirection(angleRotate, angleDetailMode);
    const vDir = getVerticalDirection(angleVertical, angleDetailMode);
    const dist = getDistanceDesc(angleZoom, angleDetailMode);
    const anglePrompt = angleDetailMode 
      ? `${hDir}, ${vDir}, ${dist} (horizontal: ${Math.round(angleRotate)}, vertical: ${Math.round(angleVertical)}, zoom: ${angleZoom.toFixed(1)})`
      : `${hDir} ${vDir} ${dist}`;

    // 模式切换: '3d' | 'resize'
    const nodeMode = node.data?.nodeMode || '3d';

    const handleAngleUpdate = (updates: {rotate?: number, vertical?: number, zoom?: number, detail?: boolean}) => {
      const newRotate = updates.rotate ?? angleRotate;
      const newVertical = updates.vertical ?? angleVertical;
      const newZoom = updates.zoom ?? angleZoom;
      const newDetail = updates.detail ?? angleDetailMode;
      
      setAngleRotate(newRotate);
      setAngleVertical(newVertical);
      setAngleZoom(newZoom);
      if (updates.detail !== undefined) setAngleDetailMode(newDetail);
      
      const newHDir = getHorizontalDirection(newRotate, newDetail);
      const newVDir = getVerticalDirection(newVertical, newDetail);
      const newDist = getDistanceDesc(newZoom, newDetail);
      const newPrompt = newDetail 
        ? `${newHDir}, ${newVDir}, ${newDist} (horizontal: ${Math.round(newRotate)}, vertical: ${Math.round(newVertical)}, zoom: ${newZoom.toFixed(1)})`
        : `${newHDir} ${newVDir} ${newDist}`;
      
      onUpdate(node.id, {
        content: newPrompt,
        data: {
          ...node.data,
          angleRotate: newRotate,
          angleVertical: newVertical,
          angleZoom: newZoom,
          angleDetailMode: newDetail,
          anglePrompt: newPrompt
        }
      });
    };

    // 从上游获取图片
    const handleRunLoadImage = () => {
      // 触发完整节点执行流程，让 resolveInputs 获取上游图片
      if (onExecute) {
        onExecute(node.id);
      }
    };

    // 切换模式
    const toggleMode = () => {
      const newMode = nodeMode === '3d' ? 'resize' : '3d';
      onUpdate(node.id, {
        data: { ...node.data, nodeMode: newMode }
      });
    };

    // 原有 Resize 模式
    if (nodeMode === 'resize') {
      return renderResizeNode();
    }

    return (
      <div className="w-full h-full bg-[#080810] flex flex-col border border-cyan-500/30 rounded-xl overflow-hidden relative shadow-lg">
        {/* 标题栏 - 支持拖拽 */}
        <div className="h-7 border-b border-cyan-900/40 flex items-center justify-between px-2 bg-cyan-900/20 shrink-0 cursor-move">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">\uD83D\uDCF7</span>
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">3D 视角</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMode(); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-800/40 hover:bg-cyan-700/50 text-cyan-300 transition-colors"
              title="切换到 Resize 模式"
            >
              ↔ Resize
            </button>
          </div>
        </div>

        {/* 3D 视图 */}
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#080810]">
            <div className="w-6 h-6 border-2 border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
        }>
          <MultiAngle3D
            rotate={angleRotate}
            vertical={angleVertical}
            zoom={angleZoom}
            onChange={handleAngleUpdate}
            imageUrl={node.data?.inputImageUrl || node.data?.previewImage}
            width={node.width - 4}
            height={Math.max(140, node.height - 100)}
            onRun={handleRunLoadImage}
            isRunning={isRunning}
            onExecute={() => onExecute(node.id)}
          />
        </Suspense>
        
        {/* 详细模式开关 & 提示词预览 */}
        <div className="px-2 py-1 space-y-1 bg-[#0a0a14] border-t border-cyan-900/30">
          <label className="flex items-center gap-2 text-[8px] text-zinc-500 cursor-pointer">
            <input
              type="checkbox"
              checked={angleDetailMode}
              onChange={(e) => handleAngleUpdate({detail: e.target.checked})}
              className="w-2.5 h-2.5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
              onMouseDown={(e) => e.stopPropagation()}
            />
            <span>附加详细参数</span>
          </label>
          
          <div className={`rounded ${controlBg} border border-cyan-900/30 px-1.5 py-0.5`}>
            <div className="text-[7px] text-cyan-300/80 leading-relaxed break-words font-mono truncate">
              {anglePrompt}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (node.type === 'relay') {
        return (
            <div className="w-full h-full flex items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                <Icons.Relay size={16} style={{ color: themeColors.textSecondary }} />
            </div>
        );
    }

    // BP节点 - 只展示变量输入和设置，执行后显示图片
    if (node.type === 'bp') {
        const bpTemplate = node.data?.bpTemplate;
        const bpInputs = node.data?.bpInputs || {};
        const bpFields = bpTemplate?.bpFields || [];
        const settings = node.data?.settings || {};
        // 检查是否有有效图片（支持 data:image, http://, https://, // 协议相对URL, /files/ 相对路径）
        // 注意：如果有下游连接，不显示图片（结果应该在下游节点显示）
        const hasImage = !hasDownstream && node.content && node.content.length > 10 && (
            node.content.startsWith('data:image') || 
            node.content.startsWith('http://') || 
            node.content.startsWith('https://') ||
            node.content.startsWith('//') ||
            node.content.startsWith('/files/') ||
            node.content.startsWith('/api/')
        );
        console.log('[BP节点渲染] content:', node.content?.slice(0, 80), 'hasImage:', hasImage);
        
        // 只筛选input类型的字段（变量），不显示agent类型
        const inputFields = bpFields.filter((f: any) => f.type === 'input');
        
        const handleBpInputChange = (fieldName: string, value: string) => {
            const newInputs = { ...bpInputs, [fieldName]: value };
            onUpdate(node.id, {
                data: { ...node.data, bpInputs: newInputs }
            });
        };
        
        const handleSettingChange = (key: string, value: string) => {
            onUpdate(node.id, {
                data: { ...node.data, settings: { ...settings, [key]: value } }
            });
        };
        
        const aspectRatios1 = ['AUTO', '1:1', '2:3', '3:2', '3:4', '4:3'];
        const aspectRatios2 = ['3:5', '5:3', '9:16', '16:9', '21:9'];
        const resolutions = ['1K', '2K', '4K'];
        
        return (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                {/* 头部 */}
                <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)'}`, backgroundColor: isLightCanvas ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center gap-2">
                        <Icons.Sparkles size={12} style={{ color: isLightCanvas ? '#3b82f6' : '#93c5fd' }} />
                        <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: isLightCanvas ? '#2563eb' : '#bfdbfe' }}>
                            {bpTemplate?.title || 'BP 模板'}
                        </span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: isLightCanvas ? '#1d4ed8' : 'rgba(147,197,253,0.6)', backgroundColor: isLightCanvas ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)' }}>BP</span>
                </div>
                
                {hasImage ? (
                    // 有图片：显示结果
                    <div className="flex-1 relative bg-black">
                        <img 
                            src={node.content} 
                            alt="Result" 
                            className="w-full h-full object-contain" 
                            draggable={false}
                            style={{
                                imageRendering: 'auto',
                                transform: 'translateZ(0)',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                            } as React.CSSProperties}
                        />
                    </div>
                ) : (
                    // 无图片：显示输入和设置
                    <>
                        {/* 变量输入 */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-3" onWheel={(e) => e.stopPropagation()}>
                            {inputFields.length === 0 ? (
                                <div className="text-center text-zinc-500 text-xs py-4">
                                    无变量输入
                                </div>
                            ) : (
                                inputFields.map((field: any) => (
                                    <div key={field.id} className="space-y-1">
                                        <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                            {field.label}
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full ${controlBg} border rounded-lg px-3 py-2 text-xs outline-none transition-colors ${isLightCanvas ? 'border-gray-200 text-gray-800 focus:border-blue-400 placeholder-gray-400' : 'border-white/10 text-zinc-200 focus:border-blue-500/50 placeholder-zinc-600'}`}
                                            placeholder={`输入 ${field.label}`}
                                            value={bpInputs[field.name] || ''}
                                            onChange={(e) => handleBpInputChange(field.name, e.target.value)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* 设置区 */}
                        <div className="px-3 pb-3 space-y-1.5">
                            {/* 比例第一行 */}
                            <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                                {aspectRatios1.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${(settings.aspectRatio || 'AUTO') === r ? `${selectedBg} ${selectedText}` : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleSettingChange('aspectRatio', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {/* 比例第二行 */}
                            <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                                {aspectRatios2.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${settings.aspectRatio === r ? `${selectedBg} ${selectedText}` : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleSettingChange('aspectRatio', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {/* 分辨率 */}
                            <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                                {resolutions.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${settings.resolution === r ? `${selectedBg} ${selectedText}` : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleSettingChange('resolution', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {/* 底部状态 */}
                <div className={`h-6 ${footerBarBg} border-t px-3 flex items-center justify-between text-[10px]`} style={{ borderColor: themeColors.headerBorder, color: themeColors.textMuted }}>
                    <span>{hasImage ? '✅ 已生成' : `输入: ${Object.values(bpInputs).filter(v => v).length}/${inputFields.length}`}</span>
                    <span>{settings.aspectRatio || '1:1'} · {settings.resolution || '2K'}</span>
                </div>
                
                {isRunning && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                        <div className="w-8 h-8 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    if (node.type === 'llm') return renderLLMNode();
    if (node.type === 'resize') return renderMultiAngleNode();

    // RunningHub节点 - 调用RunningHub AI应用
    if (node.type === 'runninghub') {
        const webappId = node.data?.webappId || '';
        const appInfo = node.data?.appInfo;
        const nodeInputs = node.data?.nodeInputs || {};
        const outputUrl = node.data?.outputUrl;
        const outputType = node.data?.outputType;
        const errorMsg = node.data?.error;
        
        // 检查是否有输出图片
        const hasOutput = outputUrl && (outputType === 'image' || outputUrl.includes('.png') || outputUrl.includes('.jpg'));
        
        const handleWebappIdChange = (value: string) => {
            onUpdate(node.id, { data: { ...node.data, webappId: value } });
        };
        
        const handleNodeInputChange = (key: string, value: string) => {
            onUpdate(node.id, { data: { ...node.data, nodeInputs: { ...nodeInputs, [key]: value } } });
        };
        
        return (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                {/* 头部 */}
                <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.2)'}`, backgroundColor: isLightCanvas ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">R</span>
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: isLightCanvas ? '#059669' : '#a7f3d0' }}>
                            {appInfo?.title || 'RunningHub'}
                        </span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: isLightCanvas ? '#047857' : 'rgba(110,231,183,0.6)', backgroundColor: isLightCanvas ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)' }}>RH</span>
                </div>
                
                {hasOutput ? (
                    // 有输出：显示结果图片
                    <div className="flex-1 relative bg-black">
                        <img 
                            src={outputUrl} 
                            alt="Result" 
                            className="w-full h-full object-contain" 
                            draggable={false}
                            style={{
                                imageRendering: 'auto',
                                transform: 'translateZ(0)',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                            } as React.CSSProperties}
                        />
                    </div>
                ) : (
                    // 无输出：显示配置界面
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                        {/* WebApp ID 输入 */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: isLightCanvas ? '#059669' : 'rgba(52,211,153,0.8)' }}>AI 应用 ID</label>
                            <input
                                type="text"
                                className="w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors"
                                style={{ backgroundColor: themeColors.inputBg, border: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.2)'}`, color: themeColors.textPrimary }}
                                placeholder="输入 webappId"
                                value={webappId}
                                onChange={(e) => handleWebappIdChange(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        </div>
                        
                        {/* 应用信息加载提示 */}
                        {webappId && !appInfo && (
                            <div className="text-center py-4">
                                <div className="text-[10px] text-zinc-500">输入应用ID后点击执行加载应用信息</div>
                            </div>
                        )}
                        
                        {/* 应用参数输入 */}
                        {appInfo?.nodeInfoList && appInfo.nodeInfoList.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: isLightCanvas ? '#059669' : 'rgba(52,211,153,0.8)' }}>应用参数</label>
                                {appInfo.nodeInfoList.map((info: any, idx: number) => {
                                    const key = `${info.nodeId}_${info.fieldName}`;
                                    return (
                                        <div key={key} className="space-y-1">
                                            <label className="text-[9px]" style={{ color: themeColors.textMuted }}>{info.fieldName}</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg px-2 py-1.5 text-xs outline-none transition-colors"
                                                style={{ backgroundColor: themeColors.inputBg, border: `1px solid ${themeColors.inputBorder}`, color: themeColors.textPrimary }}
                                                placeholder={info.fieldValue || '输入值'}
                                                value={nodeInputs[key] || ''}
                                                onChange={(e) => handleNodeInputChange(key, e.target.value)}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* 错误显示 */}
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-[10px] text-red-300">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                )}
                
                {/* 底部状态 */}
                <div className="h-6 px-3 flex items-center justify-between text-[10px]" style={{ backgroundColor: themeColors.footerBg, borderTop: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)'}`, color: themeColors.textMuted }}>
                    <span>{hasOutput ? '✅ 已生成' : (appInfo ? `参数: ${appInfo.nodeInfoList?.length || 0}` : '待配置')}</span>
                    <span style={{ color: isLightCanvas ? '#059669' : 'rgba(52,211,153,0.6)' }}>{webappId ? webappId.slice(0, 8) + '...' : ''}</span>
                </div>
                
                {isRunning && (
                    <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center z-30" style={{ backgroundColor: isLightCanvas ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                        <div className="w-8 h-8 border-2 border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }
    
    // ============ RH-Main 节点（封面主节点）============
    if (node.type === 'rh-main') {
        const webappId = node.data?.webappId || '';
        const appInfo = node.data?.appInfo;
        const coverUrl = node.data?.coverUrl;
        const appName = (appInfo as any)?.webappName || appInfo?.title || '配置应用';
        const [localBatchCount, setLocalBatchCount] = React.useState(1);
        
        return (
            <div className="w-full h-full flex flex-col gap-2">
                {/* 主体卡片 */}
                <div className="rounded-xl relative shadow-lg overflow-hidden flex-1" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                    {/* 头部 */}
                    <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.2)'}`, backgroundColor: isLightCanvas ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)' }}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-black text-[10px]">R</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold truncate max-w-[180px]" style={{ color: isLightCanvas ? '#059669' : '#a7f3d0' }}>
                                    {appName}
                                </span>
                                <span className="text-[7px] truncate" style={{ color: isLightCanvas ? '#047857' : 'rgba(52,211,153,0.6)' }}>
                                    ID: {webappId.slice(0, 12)}...
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 封面图 */}
                    <div className="w-full flex-1 relative" style={{ minHeight: '150px' }}>
                        {coverUrl ? (
                            <img 
                                src={coverUrl} 
                                alt="Cover" 
                                className="w-full h-full object-cover" 
                                draggable={false}
                            />
                        ) : (
                            <div 
                                className="w-full h-full flex flex-col items-center justify-center"
                                style={{ backgroundColor: isLightCanvas ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.08)' }}
                            >
                                <svg className="w-12 h-12 mb-2" fill="none" stroke={isLightCanvas ? '#059669' : '#34d399'} viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                <span className="text-[10px] font-medium" style={{ color: isLightCanvas ? '#059669' : '#34d399' }}>应用封面</span>
                            </div>
                        )}
                        
                        {/* 左侧输入连接点 */}
                        <div 
                            className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                            style={{ 
                                backgroundColor: 'rgba(16,185,129,0.3)',
                                borderColor: '#10b981',
                                boxShadow: '0 0 8px rgba(16,185,129,0.5)'
                            }}
                            onMouseUp={(e) => {
                                e.stopPropagation();
                                onEndConnection(node.id);
                            }}
                            title="主图输入"
                        />
                    </div>
                </div>
                
                {/* 操作栏 - 批次控制 + RUN 按钮 */}
                <div className="flex items-center justify-between gap-2 px-1">
                    {/* 批次控制 */}
                    <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' }}>
                        <button
                            className="w-5 h-5 rounded flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); setLocalBatchCount(Math.max(1, localBatchCount - 1)); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <span className="text-[12px] font-bold" style={{ color: themeColors.textSecondary }}>−</span>
                        </button>
                        <span className="text-[11px] font-bold min-w-[16px] text-center" style={{ color: themeColors.textPrimary }}>{localBatchCount}</span>
                        <button
                            className="w-5 h-5 rounded flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                            onClick={(e) => { e.stopPropagation(); setLocalBatchCount(Math.min(10, localBatchCount + 1)); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <span className="text-[12px] font-bold" style={{ color: themeColors.textSecondary }}>+</span>
                        </button>
                    </div>
                    
                    {/* RUN 按钮 */}
                    <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: '#10b981' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onExecute(node.id, localBatchCount);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isRunning}
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span className="text-[11px]">RUN</span>
                    </button>
                    
                    {/* 停止按钮 */}
                    {isRunning && (
                        <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500 text-white transition-all hover:bg-red-600"
                            onClick={(e) => { e.stopPropagation(); onStop(node.id); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="1"/>
                            </svg>
                        </button>
                    )}
                </div>
                
                {/* 底部输出连接点（连到第一个参数节点） */}
                <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                    style={{ 
                        backgroundColor: '#10b981',
                        borderColor: '#10b981'
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        onStartConnection(node.id, 'out', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                    }}
                    title="连接到参数"
                />
                
                {isRunning && (
                    <div className="absolute inset-0 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 rounded-xl" style={{ backgroundColor: isLightCanvas ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                        <div className="w-8 h-8 border-2 border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px]" style={{ color: isLightCanvas ? '#059669' : '#6ee7b7' }}>正在执行...</span>
                    </div>
                )}
            </div>
        );
    }
    
    // ============ RH-Param 节点（独立参数 Ticket）============
    if (node.type === 'rh-param') {
        const paramInfo = node.data?.rhParamInfo;
        const nodeInputs = node.data?.nodeInputs || {};
        const parentNodeId = node.data?.rhParentNodeId;
        
        if (!paramInfo) {
            return (
                <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                    <span className="text-[10px]" style={{ color: themeColors.textMuted }}>无参数信息</span>
                </div>
            );
        }
        
        const key = `${paramInfo.nodeId}_${paramInfo.fieldName}`;
        const fieldType = paramInfo.fieldType?.toUpperCase() || 'STRING';
        const isFileType = ['IMAGE', 'VIDEO', 'AUDIO'].includes(fieldType);
        const hasConnection = incomingConnections.some(c => c.toPortKey === key || (!c.toPortKey && c.toNode === node.id));
        
        // 类型配色
        const typeConfigs: Record<string, { bg: string; border: string; text: string }> = {
            'IMAGE': { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6' },
            'VIDEO': { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.25)', text: '#a855f7' },
            'AUDIO': { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', text: '#ec4899' },
            'STRING': { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981' },
            'LIST': { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
            'COMBO': { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
        };
        const typeConfig = typeConfigs[fieldType] || typeConfigs['STRING'];
        
        // 处理参数值变更
        const handleParamChange = (value: string) => {
            onUpdate(node.id, { data: { ...node.data, nodeInputs: { ...nodeInputs, [key]: value } } });
        };
        
        // 处理文件上传
        const handleFileUpload = async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = fieldType === 'IMAGE' ? 'image/*' : (fieldType === 'VIDEO' ? 'video/*' : '*/*');
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    if (ev.target?.result) {
                        try {
                            const { uploadImage } = await import('../../services/api/runninghub');
                            const result = await uploadImage(ev.target.result as string);
                            if (result.success && result.data?.fileKey) {
                                handleParamChange(result.data.fileKey);
                            }
                        } catch (err) {
                            console.error('上传异常:', err);
                        }
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        };
        
        // 类型图标
        const renderTypeIcon = () => {
            const iconClass = "w-4 h-4";
            switch (fieldType) {
                case 'IMAGE':
                    return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
                case 'VIDEO':
                    return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
                case 'AUDIO':
                    return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
                case 'LIST':
                case 'COMBO':
                    return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
                default:
                    return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
            }
        };
        
        // LIST 类型选项解析
        let listOptions: string[] = [];
        let defaultValue = paramInfo.fieldValue || '';
        if ((fieldType === 'LIST' || fieldType === 'COMBO') && paramInfo.options) {
            listOptions = paramInfo.options;
        }
        
        return (
            <div 
                className="w-full h-full rounded-xl shadow-md transition-all hover:shadow-lg relative"
                style={{ 
                    backgroundColor: themeColors.nodeBg,
                    border: `1px solid ${hasConnection ? 'rgba(16,185,129,0.5)' : (isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`,
                    boxShadow: hasConnection ? '0 0 12px rgba(16,185,129,0.2)' : undefined
                }}
                onMouseUp={(e) => {
                    e.stopPropagation();
                    onEndConnection(node.id, key);
                }}
            >
                {/* 顶部连接点（接收上一个节点的连线） */}
                <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                    style={{ 
                        backgroundColor: 'rgba(16,185,129,0.3)',
                        borderColor: '#10b981'
                    }}
                    onMouseUp={(e) => {
                        e.stopPropagation();
                        onEndConnection(node.id);
                    }}
                    title="串联输入"
                />
                
                {/* 左侧输入连接点（接收图片等数据连线） */}
                <div 
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                    style={{ 
                        backgroundColor: hasConnection ? '#10b981' : (isLightCanvas ? '#d1d5db' : '#4b5563'),
                        borderColor: '#10b981'
                    }}
                    onMouseUp={(e) => {
                        e.stopPropagation();
                        onEndConnection(node.id, key);
                    }}
                    title={`连接: ${paramInfo.description || paramInfo.fieldName}`}
                />
                
                {/* 底部连接点（连到下一个参数节点） */}
                <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                    style={{ 
                        backgroundColor: '#10b981',
                        borderColor: '#10b981'
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        onStartConnection(node.id, 'out', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                    }}
                    title="串联输出"
                />
                
                {/* 内容区 */}
                <div className="px-3 py-2.5 flex items-center gap-3">
                    {/* 类型图标 */}
                    <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: typeConfig.bg, border: `1px solid ${typeConfig.border}` }}
                    >
                        {renderTypeIcon()}
                    </div>
                    
                    {/* 参数名 + 输入区 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-medium truncate" style={{ color: themeColors.textPrimary }}>
                                {paramInfo.description || paramInfo.fieldName}
                            </span>
                            <span 
                                className="text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-2"
                                style={{ backgroundColor: typeConfig.bg, color: typeConfig.text, border: `1px solid ${typeConfig.border}` }}
                            >
                                {fieldType}
                            </span>
                        </div>
                        
                        {/* 输入控件 */}
                        {hasConnection ? (
                            <div className="flex items-center gap-1.5 rounded px-2 py-1" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[9px] font-medium text-emerald-400">已连接</span>
                            </div>
                        ) : isFileType ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    className="flex-1 rounded px-2 py-1 text-[9px] outline-none"
                                    style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, color: themeColors.textPrimary }}
                                    placeholder="Key或拉线"
                                    value={nodeInputs[key] || ''}
                                    onChange={(e) => handleParamChange(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <button
                                    className="p-1 rounded transition-all hover:scale-105 shrink-0"
                                    style={{ backgroundColor: typeConfig.bg, border: `1px solid ${typeConfig.border}` }}
                                    onClick={handleFileUpload}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="上传"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke={typeConfig.text} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (fieldType === 'LIST' || fieldType === 'COMBO') && listOptions.length > 0 ? (
                            <select
                                className="w-full rounded px-2 py-1 text-[9px] outline-none cursor-pointer"
                                style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, color: themeColors.textPrimary }}
                                value={nodeInputs[key] || defaultValue || listOptions[0] || ''}
                                onChange={(e) => handleParamChange(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {listOptions.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="w-full rounded px-2 py-1 text-[9px] outline-none"
                                style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, color: themeColors.textPrimary }}
                                placeholder={paramInfo.fieldValue || '输入...'}
                                value={nodeInputs[key] || ''}
                                onChange={(e) => handleParamChange(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    // RunningHub Config 节点 - 配置参数的节点（每个参数可拉线连接）
    if (node.type === 'rh-config') {
        const webappId = node.data?.webappId || '';
        const appInfo = node.data?.appInfo;
        const nodeInputs = node.data?.nodeInputs || {};
        const coverUrl = node.data?.coverUrl;
        const errorMsg = node.data?.error;
        const appName = (appInfo as any)?.webappName || appInfo?.title || '配置应用';
        
        const handleNodeInputChange = (key: string, value: string) => {
            onUpdate(node.id, { data: { ...node.data, nodeInputs: { ...nodeInputs, [key]: value } } });
        };
        
        // 处理文件上传
        const handleFileUpload = async (key: string, fieldType: string) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = fieldType === 'IMAGE' ? 'image/*' : (fieldType === 'VIDEO' ? 'video/*' : '*/*');
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    if (ev.target?.result) {
                        try {
                            const { uploadImage } = await import('../../services/api/runninghub');
                            const result = await uploadImage(ev.target.result as string);
                            if (result.success && result.data?.fileKey) {
                                handleNodeInputChange(key, result.data.fileKey);
                            } else {
                                console.error('上传失败:', result.error);
                            }
                        } catch (err) {
                            console.error('上传异常:', err);
                        }
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        };
        
        return (
            <div className="w-full h-full flex flex-col">
                {/* 头部(32px) + 封面图区域(200px) */}
                <div className="rounded-t-xl relative shadow-lg overflow-hidden shrink-0" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)'}`, borderBottom: 'none' }}>
                    {/* 头部 - 32px */}
                    <div className="h-8 flex items-center justify-between px-3" style={{ backgroundColor: isLightCanvas ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)' }}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-black text-[10px]">R</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: isLightCanvas ? '#059669' : '#a7f3d0' }}>
                                    {appName}
                                </span>
                                <span className="text-[7px] truncate" style={{ color: isLightCanvas ? '#047857' : 'rgba(52,211,153,0.6)' }}>
                                    ID: {webappId.slice(0, 12)}...
                                </span>
                            </div>
                        </div>
                        {/* 队列状态显示 */}
                        {nodeTaskStatus && nodeTaskStatus.total > 0 && (
                            <div className="flex items-center gap-1.5">
                                {/* 排队状态 */}
                                {nodeTaskStatus.queued > 0 && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                                        <span>排队 #{nodeTaskStatus.firstQueuePosition || nodeTaskStatus.queued}</span>
                                        <button
                                            className="ml-0.5 hover:opacity-70"
                                            onClick={(e) => { e.stopPropagation(); rhTaskQueue.cancelNodeTasks(node.id); }}
                                            title="取消排队"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                {/* 执行中状态 */}
                                {(nodeTaskStatus.running > 0 || nodeTaskStatus.uploading > 0) && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                        <span>
                                            {nodeTaskStatus.uploading > 0 ? '上传中' : `执行中 ${nodeTaskStatus.completed + 1}/${nodeTaskStatus.total}`}
                                        </span>
                                    </div>
                                )}
                                {/* 已完成状态（全部完成时显示） */}
                                {nodeTaskStatus.completed + nodeTaskStatus.failed >= nodeTaskStatus.total && nodeTaskStatus.queued === 0 && nodeTaskStatus.running === 0 && nodeTaskStatus.uploading === 0 && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium" style={{ backgroundColor: nodeTaskStatus.failed > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: nodeTaskStatus.failed > 0 ? '#ef4444' : '#22c55e' }}>
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={nodeTaskStatus.failed > 0 ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M5 13l4 4L19 7"} />
                                        </svg>
                                        <span>
                                            {nodeTaskStatus.failed > 0 ? `${nodeTaskStatus.completed}/${nodeTaskStatus.total} (${nodeTaskStatus.failed}失败)` : `完成 ${nodeTaskStatus.completed}/${nodeTaskStatus.total}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* 封面图 - 固定200px高度 */}
                    <div 
                        className="w-full relative" 
                        style={{ height: '200px' }}
                        onMouseUp={() => onEndConnection(node.id, 'cover')}
                    >
                        {/* 封面图左侧连接点 */}
                        <div 
                            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                            style={{ 
                                backgroundColor: incomingConnections.some(c => c.toPortKey === 'cover') ? '#10b981' : (isLightCanvas ? '#d1d5db' : '#4b5563'), 
                                borderColor: '#10b981' 
                            }}
                            onMouseUp={() => onEndConnection(node.id, 'cover')}
                            title="连接: 封面图"
                        />
                        {coverUrl ? (
                            <img 
                                src={coverUrl} 
                                alt="Cover" 
                                className="w-full h-full object-cover pointer-events-none" 
                                draggable={false}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: isLightCanvas ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.08)' }}>
                                <svg className="w-10 h-10 mb-1" fill="none" stroke={isLightCanvas ? '#059669' : '#34d399'} viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                <span className="text-[9px] font-medium" style={{ color: isLightCanvas ? '#059669' : '#34d399' }}>应用封面</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Ticket 参数卡片区 - 每个60px + 8px间距 */}
                <div className="flex-1 overflow-hidden rounded-b-xl" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)'}`, borderTop: 'none' }}>
                    <div className="p-2 flex flex-col gap-2">
                        {appInfo?.nodeInfoList && appInfo.nodeInfoList.length > 0 ? (
                            appInfo.nodeInfoList.map((info: any, idx: number) => {
                                const key = `${info.nodeId}_${info.fieldName}`;
                                const fieldType = info.fieldType?.toUpperCase() || 'STRING';
                                const isFileType = ['IMAGE', 'VIDEO', 'AUDIO'].includes(fieldType);
                                const hasConnection = incomingConnections.some(c => c.toPortKey === key);
                                
                                // 类型颜色配置
                                const typeConfigs: Record<string, { bg: string; border: string; text: string }> = {
                                    'IMAGE': { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6' },
                                    'VIDEO': { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.25)', text: '#a855f7' },
                                    'AUDIO': { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.25)', text: '#ec4899' },
                                    'STRING': { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981' },
                                    'LIST': { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
                                    'COMBO': { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
                                };
                                const typeConfig = typeConfigs[fieldType] || typeConfigs['STRING'];
                                
                                // 类型图标
                                const renderTypeIcon = () => {
                                    const iconClass = "w-3.5 h-3.5";
                                    switch (fieldType) {
                                        case 'IMAGE': return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
                                        case 'VIDEO': return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
                                        case 'LIST': case 'COMBO': return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
                                        default: return <svg className={iconClass} fill="none" stroke={typeConfig.text} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
                                    }
                                };
                                
                                // LIST 选项解析
                                let listOptions: string[] = [];
                                let defaultValue = info.fieldValue || '';
                                if ((fieldType === 'LIST' || fieldType === 'COMBO') && info.fieldData) {
                                    try {
                                        const parsed = JSON.parse(info.fieldData);
                                        if (Array.isArray(parsed)) {
                                            if (parsed.length === 2 && Array.isArray(parsed[0])) {
                                                listOptions = parsed[0].map((v: any) => typeof v === 'object' ? (v.label || v.name || String(v)) : String(v));
                                                if (parsed[1]?.default !== undefined) defaultValue = String(parsed[1].default);
                                            } else {
                                                listOptions = parsed.map((v: any) => typeof v === 'object' ? (v.label || v.name || String(v)) : String(v));
                                            }
                                        }
                                    } catch { listOptions = info.fieldData.split(',').map((s: string) => s.trim()); }
                                }
                                
                                return (
                                    <div 
                                        key={key}
                                        className="relative rounded-lg transition-all"
                                        style={{ 
                                            height: '52px',
                                            backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${hasConnection ? 'rgba(16,185,129,0.4)' : (isLightCanvas ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)')}`,
                                            boxShadow: hasConnection ? '0 0 8px rgba(16,185,129,0.15)' : undefined
                                        }}
                                        onMouseUp={() => onEndConnection(node.id, key)}
                                    >
                                        {/* 左侧连接点 */}
                                        <div 
                                            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 cursor-crosshair hover:scale-125 transition-all z-10"
                                            style={{ backgroundColor: hasConnection ? '#10b981' : (isLightCanvas ? '#d1d5db' : '#4b5563'), borderColor: '#10b981' }}
                                            onMouseUp={() => onEndConnection(node.id, key)}
                                            title={`连接: ${info.description || info.fieldName}`}
                                        />
                                        
                                        <div className="h-full px-3 flex items-center gap-2">
                                            {/* 类型图标 */}
                                            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: typeConfig.bg }}>
                                                {renderTypeIcon()}
                                            </div>
                                            
                                            {/* 内容区 */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <span className="text-[9px] font-medium truncate" style={{ color: themeColors.textPrimary }}>
                                                        {info.description || info.fieldName}
                                                    </span>
                                                    <span className="text-[7px] px-1 rounded shrink-0" style={{ backgroundColor: typeConfig.bg, color: typeConfig.text }}>
                                                        {fieldType}
                                                    </span>
                                                </div>
                                                
                                                {/* 输入控件 */}
                                                {hasConnection ? (
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-[8px] text-emerald-400">已连接</span>
                                                    </div>
                                                ) : isFileType ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            className="flex-1 rounded px-1.5 py-0.5 text-[8px] outline-none"
                                                            style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: themeColors.textSecondary }}
                                                            placeholder="Key或拉线"
                                                            value={nodeInputs[key] || ''}
                                                            onChange={(e) => handleNodeInputChange(key, e.target.value)}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            className="p-0.5 rounded hover:scale-105 shrink-0"
                                                            style={{ backgroundColor: typeConfig.bg }}
                                                            onClick={() => handleFileUpload(key, fieldType)}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        >
                                                            <svg className="w-2.5 h-2.5" fill="none" stroke={typeConfig.text} viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (fieldType === 'LIST' || fieldType === 'COMBO') && listOptions.length > 0 ? (
                                                    <CustomSelect
                                                        options={listOptions}
                                                        value={nodeInputs[key] || defaultValue || listOptions[0] || ''}
                                                        onChange={(val) => handleNodeInputChange(key, val)}
                                                        isLightCanvas={isLightCanvas}
                                                        themeColors={themeColors}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="w-full rounded px-1.5 py-0.5 text-[8px] outline-none"
                                                        style={{ backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: themeColors.textSecondary }}
                                                        placeholder={info.fieldValue || '输入...'}
                                                        value={nodeInputs[key] || ''}
                                                        onChange={(e) => handleNodeInputChange(key, e.target.value)}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-4 text-[9px]" style={{ color: themeColors.textMuted }}>无可配置参数</div>
                        )}
                    </div>
                </div>
                
                {/* 错误提示 */}
                {errorMsg && (
                    <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-red-500/10 border border-red-500/30 px-2 py-1.5 text-[8px] text-red-300 flex items-center gap-1.5">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errorMsg}
                    </div>
                )}
                
                {isRunning && (
                    <div className="absolute inset-0 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 rounded-xl" style={{ backgroundColor: isLightCanvas ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                        <div className="w-8 h-8 border-2 border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px]" style={{ color: isLightCanvas ? '#059669' : '#6ee7b7' }}>正在执行...</span>
                    </div>
                )}
            </div>
        );
    }
    
    // Drawing Board节点 - 画板，支持绘制、文字、图形、图片拖拽
    if (node.type === 'drawing-board') {
        const boardElements = node.data?.boardElements || [];
        const boardWidth = node.data?.boardWidth || 1920; // 默认 1920
        const boardHeight = node.data?.boardHeight || 1920; // 默认 1920
        const receivedImages = node.data?.receivedImages || [];
        const outputImageUrl = node.data?.outputImageUrl;
        const canvasRef = React.useRef<HTMLCanvasElement>(null);
            
        // 画板状态
        const [selectedTool, setSelectedTool] = React.useState<'select' | 'pencil' | 'text' | 'rect' | 'circle'>('select');
        const [selectedColor, setSelectedColor] = React.useState('#ef4444');
        const [brushSize, setBrushSize] = React.useState(4);
        const [isDrawing, setIsDrawingLocal] = React.useState(false);
        const [currentPath, setCurrentPath] = React.useState<{x: number, y: number}[]>([]);
        const [textInput, setTextInput] = React.useState('');
        const [textPosition, setTextPosition] = React.useState<{x: number, y: number, screenX: number, screenY: number} | null>(null);
        const textInputRef = React.useRef<HTMLInputElement>(null);
        const [elements, setElements] = React.useState<any[]>(boardElements);
        const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
        const [dragOffset, setDragOffset] = React.useState({x: 0, y: 0});
        const [isDraggingElement, setIsDraggingElement] = React.useState(false);
        const [localBoardWidth, setLocalBoardWidth] = React.useState(boardWidth);
        const [localBoardHeight, setLocalBoardHeight] = React.useState(boardHeight);
        const [showSizeSettings, setShowSizeSettings] = React.useState(false);
        const [isResizingElement, setIsResizingElement] = React.useState(false); // 调整元素尺寸
        const [resizeCorner, setResizeCorner] = React.useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
        const lastPointRef = React.useRef<{x: number, y: number} | null>(null); // 用于节流
            
        // 预设颜色
        const COLORS = [
            { name: '红', value: '#ef4444' },
            { name: '黄', value: '#eab308' },
            { name: '蓝', value: '#3b82f6' },
            { name: '绿', value: '#22c55e' },
            { name: '黑', value: '#1f2937' },
            { name: '白', value: '#ffffff' },
        ];
            
        // 重绘画布
        const redrawCanvas = React.useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
                
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, localBoardWidth, localBoardHeight);
                
            elements.forEach((el: any) => {
                switch (el.type) {
                    case 'image':
                        // 检查 imageData 是否为有效的 HTMLImageElement
                        if (el.imageData && el.imageData instanceof HTMLImageElement && el.imageData.complete) {
                            ctx.drawImage(el.imageData, el.x, el.y, el.width || 100, el.height || 100);
                        } else if (el.imageUrl) {
                            // imageData 无效，绘制占位框并重新加载
                            ctx.fillStyle = '#f0f0f0';
                            ctx.fillRect(el.x, el.y, el.width || 100, el.height || 100);
                            ctx.strokeStyle = '#ccc';
                            ctx.strokeRect(el.x, el.y, el.width || 100, el.height || 100);
                            ctx.fillStyle = '#999';
                            ctx.font = '12px sans-serif';
                            ctx.fillText('加载中...', el.x + 10, el.y + (el.height || 100) / 2);
                        }
                        break;
                    case 'path':
                        if (el.points && el.points.length > 1) {
                            ctx.beginPath();
                            ctx.strokeStyle = el.strokeColor || '#000';
                            ctx.lineWidth = el.strokeWidth || 2;
                            ctx.lineCap = 'round';
                            ctx.lineJoin = 'round';
                            ctx.moveTo(el.points[0].x, el.points[0].y);
                            el.points.slice(1).forEach((p: any) => ctx.lineTo(p.x, p.y));
                            ctx.stroke();
                        }
                        break;
                    case 'text':
                        const fontSize = el.fontSize || 48;
                        ctx.font = `${fontSize}px sans-serif`;
                        ctx.fillStyle = el.color || '#000';
                        // 文字基线在底部，所以 y 要加上字体高度
                        ctx.fillText(el.text || '', el.x, el.y + fontSize);
                        break;
                    case 'rect':
                        ctx.fillStyle = el.fillColor || '#000';
                        ctx.fillRect(el.x, el.y, el.width || 50, el.height || 50);
                        break;
                    case 'circle':
                        ctx.beginPath();
                        ctx.fillStyle = el.fillColor || '#000';
                        const radius = Math.min(el.width || 50, el.height || 50) / 2;
                        ctx.arc(el.x + radius, el.y + radius, radius, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                }
                    
                if (el.id === selectedElementId && el.type !== 'path') {
                    // 文字元素的宽高需要根据实际文字计算
                    let selW = el.width || 50;
                    let selH = el.height || 50;
                    if (el.type === 'text') {
                        const textFontSize = el.fontSize || 48;
                        ctx.font = `${textFontSize}px sans-serif`;
                        const metrics = ctx.measureText(el.text || '');
                        selW = metrics.width;
                        selH = textFontSize;
                    }
                    
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(el.x - 4, el.y - 4, selW + 8, selH + 8);
                    ctx.setLineDash([]);
                    
                    // 绘制缩放手柄（右下角）
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(el.x + selW - 6, el.y + selH - 6, 10, 10);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(el.x + selW - 6, el.y + selH - 6, 10, 10);
                }
            });
                
            if (currentPath.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = selectedColor;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(currentPath[0].x, currentPath[0].y);
                currentPath.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
        }, [elements, selectedElementId, currentPath, selectedColor, brushSize, localBoardWidth, localBoardHeight]);
            
        React.useEffect(() => {
            redrawCanvas();
        }, [redrawCanvas]);
        
        // 检测并重新加载缺失 imageData 的图片元素
        React.useEffect(() => {
            elements.forEach((el: any) => {
                if (el.type === 'image' && el.imageUrl && (!el.imageData || !(el.imageData instanceof HTMLImageElement))) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        setElements((prev: any[]) => prev.map(item => 
                            item.id === el.id ? { ...item, imageData: img } : item
                        ));
                    };
                    img.src = el.imageUrl;
                }
            });
        }, [elements.length]); // 只在元素数量变化时检查
            
        // 加载接收的图片 - 并自动计算画布尺寸
        React.useEffect(() => {
            if (receivedImages.length > 0) {
                let totalWidth = 0;
                let maxHeight = 0;
                let loadedCount = 0;
                
                receivedImages.forEach((url: string, idx: number) => {
                    if (!elements.some((el: any) => el.imageUrl === url)) {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                            // 🔧 图片尺寸等比缩放，最长边不超过1600（画布默认1920）
                            const maxSize = 1600;
                            let w = img.width, h = img.height;
                            if (w > maxSize || h > maxSize) {
                                const ratio = Math.min(maxSize / w, maxSize / h);
                                w *= ratio;
                                h *= ratio;
                            }
                            
                            totalWidth += w + 30;
                            maxHeight = Math.max(maxHeight, h);
                            loadedCount++;
                            
                            setElements((prev: any[]) => [...prev, {
                                id: `img-${Date.now()}-${idx}`,
                                type: 'image',
                                x: 20 + (idx % 3) * (w + 40),
                                y: 20 + Math.floor(idx / 3) * (h + 40),
                                width: w,
                                height: h,
                                imageUrl: url,
                                imageData: img,
                            }]);
                            
                            // 所有图片加载完成后，检查是否需要扩展画布（不缩小）
                            if (loadedCount === receivedImages.length) {
                                // 保持默认 1920×1920，只有当图片超出时才扩展
                                const neededWidth = totalWidth + 40;
                                const neededHeight = maxHeight * Math.ceil(receivedImages.length / 3) + 80;
                                const newWidth = Math.max(localBoardWidth, neededWidth);
                                const newHeight = Math.max(localBoardHeight, neededHeight);
                                if (newWidth > localBoardWidth || newHeight > localBoardHeight) {
                                    setLocalBoardWidth(newWidth);
                                    setLocalBoardHeight(newHeight);
                                    onUpdate(node.id, { data: { ...node.data, boardWidth: newWidth, boardHeight: newHeight } });
                                }
                            }
                        };
                        img.src = url;
                    }
                });
            }
        }, [receivedImages]);
            
        // 获取画布坐标（修复缩放偏差）
        const getCanvasCoords = (e: React.MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();
            // 计算缩放比例：实际显示尺寸 vs canvas内部尺寸
            const scaleX = localBoardWidth / rect.width;
            const scaleY = localBoardHeight / rect.height;
            return { 
                x: (e.clientX - rect.left) * scaleX, 
                y: (e.clientY - rect.top) * scaleY 
            };
        };
            
        const findElementAtPoint = (x: number, y: number) => {
            for (let i = elements.length - 1; i >= 0; i--) {
                const el = elements[i];
                if (el.type === 'path') continue;
                const w = el.width || 50;
                const h = el.height || 50;
                if (x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h) return el;
            }
            return null;
        };
        
        // 获取元素实际尺寸（文字需要根据字体计算）
        const getElementSize = (el: any): { w: number, h: number } => {
            if (el.type === 'text') {
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const textFontSize = el.fontSize || 48;
                        ctx.font = `${textFontSize}px sans-serif`;
                        const metrics = ctx.measureText(el.text || '');
                        return { w: metrics.width, h: textFontSize };
                    }
                }
            }
            return { w: el.width || 50, h: el.height || 50 };
        };
        
        // 检测是否点击在缩放手柄上
        const findResizeHandle = (x: number, y: number): 'br' | null => {
            if (!selectedElementId) return null;
            const el = elements.find((e: any) => e.id === selectedElementId);
            if (!el || el.type === 'path') return null;
            
            const { w, h } = getElementSize(el);
            const handleSize = 12;
            
            // 只检测右下角手柄
            if (x >= el.x + w - handleSize && x <= el.x + w + 4 &&
                y >= el.y + h - handleSize && y <= el.y + h + 4) {
                return 'br';
            }
            return null;
        };
            
        const handleCanvasMouseDown = (e: React.MouseEvent) => {
            const coords = getCanvasCoords(e);
            lastPointRef.current = coords;
            console.log('[DrawingBoard] MouseDown, tool:', selectedTool, 'coords:', coords);
            
            if (selectedTool === 'select') {
                // 先检查是否点击在缩放手柄上
                const handle = findResizeHandle(coords.x, coords.y);
                if (handle) {
                    setIsResizingElement(true);
                    setResizeCorner(handle);
                    return;
                }
                
                const el = findElementAtPoint(coords.x, coords.y);
                if (el) {
                    setSelectedElementId(el.id);
                    setDragOffset({ x: coords.x - el.x, y: coords.y - el.y });
                    setIsDraggingElement(true);
                } else {
                    setSelectedElementId(null);
                    setIsDraggingElement(false);
                }
            } else if (selectedTool === 'pencil') {
                setIsDrawingLocal(true);
                setCurrentPath([coords]);
            } else if (selectedTool === 'text') {
                // 如果已经有输入框显示，先保存当前输入
                if (textPosition && textInput.trim()) {
                    setElements((prev: any[]) => [...prev, {
                        id: `text-${Date.now()}`,
                        type: 'text',
                        x: textPosition.x,
                        y: textPosition.y,
                        text: textInput,
                        fontSize: 48, // 默认字号48
                        color: selectedColor,
                    }]);
                    setTextInput('');
                }
                // 同时保存画布坐标和屏幕坐标
                const canvas = canvasRef.current;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    setTextPosition({
                        x: coords.x,
                        y: coords.y,
                        screenX: e.clientX - rect.left,
                        screenY: e.clientY - rect.top
                    });
                    // 延迟聚焦确保输入框已渲染
                    setTimeout(() => textInputRef.current?.focus(), 10);
                }
            } else if (['rect', 'circle'].includes(selectedTool)) {
                setIsDrawingLocal(true);
                setCurrentPath([coords]);
            }
        };
            
        const handleCanvasMouseMove = (e: React.MouseEvent) => {
            const coords = getCanvasCoords(e);
            
            // 缩放元素
            if (isResizingElement && selectedElementId && resizeCorner) {
                setElements((prev: any[]) => prev.map(el => {
                    if (el.id !== selectedElementId) return el;
                    
                    // 文字元素：通过拖拽调整字号
                    if (el.type === 'text') {
                        const { w: currentW, h: currentH } = getElementSize(el);
                        const currentFontSize = el.fontSize || 48;
                        // 根据拖拽距离计算新字号
                        const newHeight = Math.max(16, coords.y - el.y);
                        const newFontSize = Math.round(newHeight);
                        return { ...el, fontSize: newFontSize };
                    }
                    
                    // 其他元素：调整宽高
                    const minSize = 30;
                    const newWidth = Math.max(minSize, coords.x - el.x);
                    const newHeight = Math.max(minSize, coords.y - el.y);
                    return { ...el, width: newWidth, height: newHeight };
                }));
                return;
            }
            
            // 拖拽元素
            if (selectedTool === 'select' && selectedElementId && isDraggingElement) {
                setElements((prev: any[]) => prev.map(el => 
                    el.id === selectedElementId ? { ...el, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y } : el
                ));
            } else if (selectedTool === 'pencil' && isDrawing) {
                // 节流：只有移动距离超过3像素才添加新点
                const lastPoint = lastPointRef.current;
                if (lastPoint) {
                    const dist = Math.sqrt(Math.pow(coords.x - lastPoint.x, 2) + Math.pow(coords.y - lastPoint.y, 2));
                    if (dist >= 3) {
                        setCurrentPath(prev => [...prev, coords]);
                        lastPointRef.current = coords;
                    }
                } else {
                    setCurrentPath(prev => [...prev, coords]);
                    lastPointRef.current = coords;
                }
            }
        };
            
        const handleCanvasMouseUp = (e: React.MouseEvent) => {
            const coords = getCanvasCoords(e);
            
            // 结束缩放
            if (isResizingElement) {
                setIsResizingElement(false);
                setResizeCorner(null);
                return;
            }
            
            if (selectedTool === 'pencil' && currentPath.length > 1) {
                setElements((prev: any[]) => [...prev, {
                    id: `path-${Date.now()}`,
                    type: 'path',
                    x: 0, y: 0,
                    points: currentPath,
                    strokeColor: selectedColor,
                    strokeWidth: brushSize,
                }]);
            } else if (selectedTool === 'rect' && currentPath.length > 0) {
                const start = currentPath[0];
                const newEl = {
                    id: `rect-${Date.now()}`,
                    type: 'rect',
                    x: Math.min(start.x, coords.x),
                    y: Math.min(start.y, coords.y),
                    width: Math.abs(coords.x - start.x),
                    height: Math.abs(coords.y - start.y),
                    fillColor: selectedColor,
                };
                if (newEl.width > 5 && newEl.height > 5) setElements((prev: any[]) => [...prev, newEl]);
            } else if (selectedTool === 'circle' && currentPath.length > 0) {
                const start = currentPath[0];
                const size = Math.max(Math.abs(coords.x - start.x), Math.abs(coords.y - start.y));
                if (size > 5) {
                    setElements((prev: any[]) => [...prev, {
                        id: `circle-${Date.now()}`,
                        type: 'circle',
                        x: Math.min(start.x, coords.x),
                        y: Math.min(start.y, coords.y),
                        width: size,
                        height: size,
                        fillColor: selectedColor,
                    }]);
                }
            }
            setIsDrawingLocal(false);
            setCurrentPath([]);
            setIsDraggingElement(false);
            lastPointRef.current = null;
        };
            
        const handleAddText = () => {
            if (!textInput.trim() || !textPosition) return;
            setElements((prev: any[]) => [...prev, {
                id: `text-${Date.now()}`,
                type: 'text',
                x: textPosition.x,
                y: textPosition.y,
                text: textInput,
                fontSize: 48, // 🔧 默认字号48
                color: selectedColor,
            }]);
            setTextInput('');
            setTextPosition(null);
        };
        
        // 🔧 右键菜单状态
        const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; elementId: string } | null>(null);
        
        // 🔧 图层操作函数
        const moveElementUp = (elementId: string) => {
            setElements(prev => {
                const idx = prev.findIndex(el => el.id === elementId);
                if (idx < prev.length - 1) {
                    const newArr = [...prev];
                    [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
                    return newArr;
                }
                return prev;
            });
            setContextMenu(null);
        };
        
        const moveElementDown = (elementId: string) => {
            setElements(prev => {
                const idx = prev.findIndex(el => el.id === elementId);
                if (idx > 0) {
                    const newArr = [...prev];
                    [newArr[idx], newArr[idx - 1]] = [newArr[idx - 1], newArr[idx]];
                    return newArr;
                }
                return prev;
            });
            setContextMenu(null);
        };
        
        const moveElementToTop = (elementId: string) => {
            setElements(prev => {
                const idx = prev.findIndex(el => el.id === elementId);
                if (idx >= 0 && idx < prev.length - 1) {
                    const el = prev[idx];
                    return [...prev.slice(0, idx), ...prev.slice(idx + 1), el];
                }
                return prev;
            });
            setContextMenu(null);
        };
        
        const moveElementToBottom = (elementId: string) => {
            setElements(prev => {
                const idx = prev.findIndex(el => el.id === elementId);
                if (idx > 0) {
                    const el = prev[idx];
                    return [el, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
                }
                return prev;
            });
            setContextMenu(null);
        };
        
        const deleteElement = (elementId: string) => {
            setElements(prev => prev.filter(el => el.id !== elementId));
            setSelectedElementId(null);
            setContextMenu(null);
        };
        
        // 🔧 右键菜单处理
        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const coords = getCanvasCoords(e);
            const el = findElementAtPoint(coords.x, coords.y);
            if (el) {
                setSelectedElementId(el.id);
                // 计算菜单位置（相对于画布容器）
                const canvas = canvasRef.current;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    setContextMenu({ 
                        x: e.clientX - rect.left + 8, 
                        y: e.clientY - rect.top + 48,
                        elementId: el.id 
                    });
                }
            } else {
                setContextMenu(null);
            }
        };
            
        const handleClear = () => {
            setElements([]);
            setSelectedElementId(null);
        };
            
        return (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        
                {/* 头部 - 简洁标题 */}
                <div className="h-7 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.2)'}`, backgroundColor: isLightCanvas ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.1)' }}>
                    <div className="flex items-center gap-2">
                        <Icons.Palette size={14} className={isLightCanvas ? 'text-amber-600' : 'text-amber-400'} />
                        <span className="text-[11px] font-bold" style={{ color: isLightCanvas ? '#d97706' : '#fcd34d' }}>画板</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: isLightCanvas ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.2)', color: isLightCanvas ? '#b45309' : '#fbbf24' }}>
                            {localBoardWidth}×{localBoardHeight}
                        </span>
                    </div>
                </div>
                            
                {/* 工具栏 - 更美观 */}
                <div className="px-3 py-2 flex items-center gap-3 flex-wrap" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)'}`, backgroundColor: isLightCanvas ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)' }}>
                    {/* 工具选择 */}
                    <div className={`flex items-center gap-1 rounded-lg p-1 ${isLightCanvas ? 'bg-gray-100' : 'bg-black/40'}`}>
                        {[
                            { id: 'select', icon: <Icons.Move size={14}/>, tip: '选择' },
                            { id: 'pencil', icon: <Icons.Edit size={14}/>, tip: '画笔' },
                            { id: 'text', icon: <Icons.Type size={14}/>, tip: '文字' },
                            { id: 'rect', icon: <Icons.Stop size={14}/>, tip: '矩形' },
                            { id: 'circle', icon: <Icons.Circle size={14}/>, tip: '圆形' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedTool(t.id as any); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${selectedTool === t.id ? 'bg-amber-500 text-white shadow-md' : (isLightCanvas ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-white/10')}`}
                                title={t.tip}
                            >
                                {t.icon}
                            </button>
                        ))}
                    </div>
                            
                    {/* 颜色选择 */}
                    <div className="flex items-center gap-1">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={(e) => { e.stopPropagation(); setSelectedColor(c.value); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === c.value ? 'border-amber-400 scale-110 shadow-md' : 'border-transparent'}`}
                                style={{ backgroundColor: c.value, boxShadow: c.value === '#ffffff' ? 'inset 0 0 0 1px #ddd' : undefined }}
                                title={c.name}
                            />
                        ))}
                    </div>
                            
                    {/* 画笔大小 */}
                    <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${isLightCanvas ? 'bg-gray-100' : 'bg-black/40'}`}>
                        <button onClick={(e) => { e.stopPropagation(); setBrushSize(s => Math.max(1, s - 2)); }} onMouseDown={(e) => e.stopPropagation()} className={`w-5 h-5 flex items-center justify-center rounded ${isLightCanvas ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <Icons.Minus size={12}/>
                        </button>
                        <span className={`text-[10px] w-5 text-center font-medium ${isLightCanvas ? 'text-gray-700' : 'text-gray-200'}`}>{brushSize}</span>
                        <button onClick={(e) => { e.stopPropagation(); setBrushSize(s => Math.min(32, s + 2)); }} onMouseDown={(e) => e.stopPropagation()} className={`w-5 h-5 flex items-center justify-center rounded ${isLightCanvas ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <Icons.Plus size={12}/>
                        </button>
                    </div>
                            
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 ml-auto">
                        {/* 🔧 接收按钮 */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onExecute(node.id, 1); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="h-7 px-2 text-[10px] font-medium rounded-md bg-blue-500 hover:bg-blue-400 text-white shadow-sm transition-all flex items-center gap-1"
                            title="接收上游图片"
                        >
                            <Icons.Download size={12}/>
                            接收
                        </button>
                        {/* 🔧 输出按钮 */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const canvas = canvasRef.current;
                                if (canvas) {
                                    const dataUrl = canvas.toDataURL('image/png');
                                    onUpdate(node.id, { content: dataUrl, data: { ...node.data, outputImageUrl: dataUrl, boardElements: elements } });
                                    onExecute(node.id, 2);
                                }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={elements.length === 0}
                            className="h-7 px-2 text-[10px] font-medium rounded-md bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="输出PNG"
                        >
                            <Icons.Upload size={12}/>
                            输出
                        </button>
                        <div className="w-px h-5 bg-white/10 mx-1"></div>
                        {/* 信息按钮 */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setShowMediaInfo(true)}
                            onMouseLeave={() => setShowMediaInfo(false)}
                        >
                            <button
                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${isLightCanvas ? 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                onMouseDown={(e) => e.stopPropagation()}
                                title="画布信息"
                            >
                                <Icons.Info size={14}/>
                            </button>
                            {showMediaInfo && (
                                <div 
                                    className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-white/90 whitespace-nowrap shadow-lg z-50"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="space-y-0.5">
                                        <div><span className="text-zinc-500">画布宽度:</span> {localBoardWidth} px</div>
                                        <div><span className="text-zinc-500">画布高度:</span> {localBoardHeight} px</div>
                                        <div><span className="text-zinc-500">比例:</span> {getAspectRatio(localBoardWidth, localBoardHeight)}</div>
                                        <div><span className="text-zinc-500">元素数:</span> {elements.length}</div>
                                        <div><span className="text-zinc-500">输出格式:</span> PNG</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* 下载按钮 */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const canvas = canvasRef.current;
                                if (canvas) {
                                    const dataUrl = canvas.toDataURL('image/png');
                                    const link = document.createElement('a');
                                    link.download = `drawing-board-${Date.now()}.png`;
                                    link.href = dataUrl;
                                    link.click();
                                }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={elements.length === 0}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all disabled:opacity-30 ${isLightCanvas ? 'bg-gray-100 text-gray-500 hover:text-blue-500 hover:bg-blue-50' : 'bg-black/40 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20'}`}
                            title="下载PNG"
                        >
                            <Icons.Download size={14}/>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={elements.length === 0}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all disabled:opacity-30 ${isLightCanvas ? 'bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50' : 'bg-black/40 text-gray-400 hover:text-red-400 hover:bg-red-500/20'}`}
                            title="清空"
                        >
                            <Icons.Close size={14}/>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSizeSettings(!showSizeSettings); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${showSizeSettings ? 'bg-amber-500 text-white' : (isLightCanvas ? 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10')}`}
                            title="设置画布尺寸"
                        >
                            <Icons.Resize size={14}/>
                        </button>
                    </div>
                </div>
                        
                {/* 尺寸设置弹出层 */}
                {showSizeSettings && (
                    <div className="px-3 py-2 flex items-center gap-3 flex-wrap" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)'}`, backgroundColor: isLightCanvas ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.1)' }}>
                        <span className={`text-[10px] font-medium ${isLightCanvas ? 'text-gray-600' : 'text-gray-300'}`}>宽:</span>
                        <input
                            type="number"
                            value={localBoardWidth}
                            onChange={(e) => setLocalBoardWidth(Math.max(200, Math.min(4096, parseInt(e.target.value) || 1920)))}
                            onBlur={() => onUpdate(node.id, { data: { ...node.data, boardWidth: localBoardWidth } })}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`w-16 px-2 py-1 text-[11px] rounded-md border ${isLightCanvas ? 'bg-white border-gray-200 text-gray-800' : 'bg-black/40 border-white/10 text-white'}`}
                        />
                        <span className={`text-[10px] font-medium ${isLightCanvas ? 'text-gray-600' : 'text-gray-300'}`}>高:</span>
                        <input
                            type="number"
                            value={localBoardHeight}
                            onChange={(e) => setLocalBoardHeight(Math.max(200, Math.min(4096, parseInt(e.target.value) || 1920)))}
                            onBlur={() => onUpdate(node.id, { data: { ...node.data, boardHeight: localBoardHeight } })}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`w-16 px-2 py-1 text-[11px] rounded-md border ${isLightCanvas ? 'bg-white border-gray-200 text-gray-800' : 'bg-black/40 border-white/10 text-white'}`}
                        />
                        {/* 快捷预设 */}
                        <div className="flex items-center gap-1 ml-auto">
                            {[
                                { label: '1080', w: 1080, h: 1080 },
                                { label: '1920', w: 1920, h: 1920 },
                                { label: '2K', w: 2048, h: 2048 },
                                { label: '16:9', w: 1920, h: 1080 },
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalBoardWidth(preset.w);
                                        setLocalBoardHeight(preset.h);
                                        onUpdate(node.id, { data: { ...node.data, boardWidth: preset.w, boardHeight: preset.h } });
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${localBoardWidth === preset.w && localBoardHeight === preset.h ? 'bg-amber-500 text-white' : (isLightCanvas ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-black/40 text-gray-300 hover:text-white hover:bg-white/10')}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                    
                {/* 画布区域 */}
                <div className="flex-1 p-2 relative overflow-hidden" style={{ backgroundColor: isLightCanvas ? '#f5f5f5' : 'rgba(0,0,0,0.1)' }} onClick={() => setContextMenu(null)} onMouseDown={(e) => e.stopPropagation()}>
                    <canvas
                        ref={canvasRef}
                        width={localBoardWidth}
                        height={localBoardHeight}
                        className="rounded-lg cursor-crosshair shadow-inner"
                        style={{ display: 'block', backgroundColor: '#ffffff', maxWidth: '100%', maxHeight: '100%' }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCanvasMouseDown(e);
                        }}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        onContextMenu={handleContextMenu}
                    />
                    {/* 🔧 文字直接输入（类似微信截图） */}
                    {textPosition && (() => {
                        // 计算画布缩放比例
                        const canvas = canvasRef.current;
                        const canvasRect = canvas?.getBoundingClientRect();
                        const scaleRatio = canvasRect ? canvasRect.width / localBoardWidth : 1;
                        const displayFontSize = Math.round(48 * scaleRatio);
                        
                        return (
                            <input
                                ref={textInputRef}
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="输入文字..."
                                className="absolute bg-transparent outline-none caret-amber-500 z-10"
                                style={{ 
                                    left: textPosition.screenX + 8, 
                                    top: textPosition.screenY + 8,
                                    color: selectedColor,
                                    fontSize: `${displayFontSize}px`, // 根据画布缩放调整显示字号
                                    fontFamily: 'sans-serif',
                                    minWidth: '50px',
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddText();
                                    }
                                    if (e.key === 'Escape') { 
                                        e.preventDefault();
                                        setTextPosition(null); 
                                        setTextInput(''); 
                                    }
                                }}
                                onBlur={(e) => {
                                    const relatedTarget = e.relatedTarget as HTMLElement;
                                    if (relatedTarget?.tagName === 'CANVAS') return;
                                    if (textInput.trim()) handleAddText();
                                    else setTextPosition(null);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            />
                        );
                    })()}
                    {/* 🔧 右键菜单 */}
                    {contextMenu && (
                        <div 
                            className="absolute bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 py-1 min-w-[120px]"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button 
                                className="w-full px-3 py-1.5 text-[11px] text-left text-white/90 hover:bg-white/10 flex items-center gap-2"
                                onClick={() => moveElementToTop(contextMenu.elementId)}
                            >
                                <Icons.ArrowUp size={12}/> 置于顶层
                            </button>
                            <button 
                                className="w-full px-3 py-1.5 text-[11px] text-left text-white/90 hover:bg-white/10 flex items-center gap-2"
                                onClick={() => moveElementUp(contextMenu.elementId)}
                            >
                                <Icons.ChevronUp size={12}/> 上移一层
                            </button>
                            <button 
                                className="w-full px-3 py-1.5 text-[11px] text-left text-white/90 hover:bg-white/10 flex items-center gap-2"
                                onClick={() => moveElementDown(contextMenu.elementId)}
                            >
                                <Icons.ChevronDown size={12}/> 下移一层
                            </button>
                            <button 
                                className="w-full px-3 py-1.5 text-[11px] text-left text-white/90 hover:bg-white/10 flex items-center gap-2"
                                onClick={() => moveElementToBottom(contextMenu.elementId)}
                            >
                                <Icons.ArrowDown size={12}/> 置于底层
                            </button>
                            <div className="my-1 border-t border-white/10"></div>
                            <button 
                                className="w-full px-3 py-1.5 text-[11px] text-left text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                                onClick={() => deleteElement(contextMenu.elementId)}
                            >
                                <Icons.Trash size={12}/> 删除
                            </button>
                        </div>
                    )}
                </div>
                    
                {/* 底部状态 */}
                <div className="h-5 px-2 flex items-center justify-between text-[9px]" style={{ backgroundColor: themeColors.footerBg, borderTop: `1px solid ${isLightCanvas ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)'}`, color: themeColors.textMuted }}>
                    <span>{elements.length} 个元素 · {localBoardWidth}×{localBoardHeight}</span>
                    <span style={{ color: isLightCanvas ? '#d97706' : 'rgba(251,191,36,0.7)' }}>
                        {selectedTool === 'select' ? (selectedElementId ? '拖拽移动 / 点击空白取消' : '点击选择元素') : selectedTool === 'pencil' ? '自由绘制' : selectedTool === 'text' ? '点击添加文字' : '拖拽绘制'}
                    </span>
                </div>
                    
                {isRunning && (
                    <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center z-30" style={{ backgroundColor: isLightCanvas ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                        <div className="w-8 h-8 border-2 border-amber-400/50 border-t-amber-400 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }
    // Idea节点 - 类BP的简化版本，包含提示词和设置
    if (node.type === 'idea') {
        const settings = node.data?.settings || {};
        const ideaTitle = node.title || '创意';
        
        return (
            <div className="w-full h-full flex flex-col overflow-hidden rounded-xl shadow-lg relative" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                {/* 标题栏 - 与BP一致 */}
                <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)'}`, backgroundColor: isLightCanvas ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)' }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icons.Sparkles size={12} className="flex-shrink-0" style={{ color: isLightCanvas ? '#3b82f6' : '#93c5fd' }} />
                        <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: isLightCanvas ? '#2563eb' : '#bfdbfe' }}>{ideaTitle}</span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: isLightCanvas ? '#1d4ed8' : 'rgba(147,197,253,0.6)', backgroundColor: isLightCanvas ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)' }}>IDEA</span>
                </div>
                
                {/* 提示词编辑区 - 固定高度，内容滚动 */}
                <div className="flex-1 p-3 flex flex-col overflow-hidden" onWheel={(e) => e.stopPropagation()}>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium block mb-1.5 flex-shrink-0">提示词</label>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <textarea 
                            className={`w-full h-full ${controlBg} border rounded-lg px-3 py-2 text-xs outline-none transition-colors resize-none overflow-y-auto scrollbar-hide ${isLightCanvas ? 'border-gray-200 text-gray-800 focus:border-blue-400 placeholder-gray-400' : 'border-white/10 text-zinc-200 focus:border-blue-500/50'}`}
                            placeholder="输入提示词..."
                            value={localContent}
                            onChange={(e) => setLocalContent(e.target.value)}
                            onBlur={(e) => {
                                onUpdate(node.id, { content: localContent });
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
                
                {/* 设置区 - 与BP一致的样式 */}
                <div className="px-3 pb-3 space-y-1.5 flex-shrink-0">
                    {/* 比例第一行 */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        {['AUTO', '1:1', '2:3', '3:2', '3:4', '4:3'].map(ratio => (
                            <button
                                key={ratio}
                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${(settings.aspectRatio || 'AUTO') === ratio ? `${selectedBg} ${selectedText}` : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate(node.id, { data: { ...node.data, settings: { ...settings, aspectRatio: ratio } } });
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                    {/* 比例第二行 */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        {['3:5', '5:3', '9:16', '16:9', '21:9'].map(ratio => (
                            <button
                                key={ratio}
                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${settings.aspectRatio === ratio ? `${selectedBg} ${selectedText}` : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate(node.id, { data: { ...node.data, settings: { ...settings, aspectRatio: ratio } } });
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                    {/* 分辨率 */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        {['1K', '2K', '4K'].map(res => (
                            <button
                                key={res}
                                className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${(settings.resolution || '2K') === res ? `${selectedBg} ${selectedText}` : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdate(node.id, { data: { ...node.data, settings: { ...settings, resolution: res } } });
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* 底部状态 - 与BP一致 */}
                <div className={`h-6 ${footerBarBg} border-t px-3 flex items-center justify-between text-[10px]`} style={{ borderColor: themeColors.headerBorder, color: themeColors.textMuted }}>
                    <span>输入: 1/1</span>
                    <span>{settings.aspectRatio || 'AUTO'} · {settings.resolution || '2K'}</span>
                </div>
                
                {isRunning && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                        <div className="w-8 h-8 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    // RH Magic节点 - 香蕉（全能图片PRO）
    if (node.type === 'rh-magic') {
        const bananaAspectRatio = node.data?.settings?.aspectRatio || 'AUTO';
        const bananaResolution = node.data?.settings?.resolution || '2K';
        const bananaOfficial = node.data?.bananaOfficial !== false; // 默认官方
        const bananaProgress = node.data?.bananaProgress || '';
        const aspectRatios1 = ['AUTO', '1:1', '2:3', '3:2', '3:4', '4:3'];
        const aspectRatios2 = ['3:5', '5:3', '9:16', '16:9', '21:9'];
        const resolutions = ['1K', '2K', '4K'];
        
        // 绿色主题色
        const greenBg = isLightCanvas ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)';
        const greenBorder = isLightCanvas ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)';
        const greenText = isLightCanvas ? '#047857' : '#6ee7b7';
        const greenTextMuted = isLightCanvas ? '#059669' : '#34d399';
        
        const handleBananaSettingChange = (key: string, value: any) => {
            onUpdate(node.id, { 
                data: { ...node.data, settings: { ...node.data?.settings, [key]: value } },
                status: 'idle'
            });
        };
        
        return (
            <div className="w-full h-full flex flex-col overflow-hidden rounded-xl shadow-lg relative" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${greenBorder}` }}>
                {/* 头部 - 对标Magic */}
                <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${greenBorder}`, backgroundColor: greenBg }}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🍌</span>
                        <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: greenText }}>RH Magic</span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: greenTextMuted, backgroundColor: greenBg }}>全能图片</span>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                    {/* Prompt */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium block mb-1.5 flex-shrink-0">编辑指令</label>
                        <textarea 
                            className={`flex-1 w-full ${controlBg} border rounded-lg px-3 py-2 text-xs outline-none resize-none overflow-y-auto scrollbar-hide transition-colors ${isLightCanvas ? 'border-gray-200 text-gray-800 focus:border-emerald-500 placeholder-gray-400' : 'border-white/10 text-zinc-200 focus:border-emerald-500/50 placeholder-zinc-600'}`}
                            placeholder="输入编辑指令..."
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            onBlur={handleUpdate}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
                    
                {/* 设置区 - 对标Magic */}
                <div className="px-3 pb-3 space-y-1.5 flex-shrink-0">
                    {/* 官方/非官方切换 */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        <button
                            className={`flex-1 px-2 py-1 text-[9px] font-medium rounded-md transition-all ${bananaOfficial ? 'bg-emerald-500/30 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => onUpdate(node.id, { data: { ...node.data, bananaOfficial: true } })}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            官方
                        </button>
                        <button
                            className={`flex-1 px-2 py-1 text-[9px] font-medium rounded-md transition-all ${!bananaOfficial ? 'bg-emerald-500/30 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => onUpdate(node.id, { data: { ...node.data, bananaOfficial: false } })}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            非官方
                        </button>
                    </div>
                    {/* Aspect Ratio Row 1 */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        {aspectRatios1.map(r => (
                            <button
                                key={r}
                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${bananaAspectRatio === r ? 'bg-emerald-500/30 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={() => handleBananaSettingChange('aspectRatio', r)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    {/* Aspect Ratio Row 2 */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        {aspectRatios2.map(r => (
                            <button
                                key={r}
                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${bananaAspectRatio === r ? 'bg-emerald-500/30 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={() => handleBananaSettingChange('aspectRatio', r)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    {/* Resolution */}
                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                        {resolutions.map(r => (
                            <button
                                key={r}
                                className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${bananaResolution === r ? 'bg-emerald-500/30 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                onClick={() => handleBananaSettingChange('resolution', r)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* 底部状态 - 对标Magic */}
                <div className={`h-6 ${footerBarBg} border-t px-3 flex items-center justify-between text-[10px]`} style={{ borderColor: themeColors.headerBorder, color: themeColors.textMuted }}>
                    <span>输入: 1/1</span>
                    <span>{bananaAspectRatio} · {bananaResolution}</span>
                </div>
                
                {/* 进度/加载覆盖层 */}
                {isRunning && (
                    <div className="absolute inset-0 backdrop-blur-[2px] flex flex-col items-center justify-center z-30" style={{ backgroundColor: isLightCanvas ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                        <div className="w-8 h-8 border-2 border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin mb-2"></div>
                        {bananaProgress && <span className="text-xs" style={{ color: greenText }}>{bananaProgress}</span>}
                    </div>
                )}
            </div>
        );
    }

    if (node.type === 'image') {
      // 检查是否有有效图片（支持 data: 、http URL 和 相对路径）
      const hasImage = node.content && (
        node.content.startsWith('data:image') || 
        node.content.startsWith('http://') || 
        node.content.startsWith('https://') ||
        node.content.startsWith('/files/') ||
        node.content.startsWith('/api/')
      );
      const nodeColor = getNodeTypeColor(node.type);
      
      return (
        <div 
          className={`w-full h-full relative group flex flex-col overflow-hidden rounded-xl ${!hasImage ? 'border-2 border-dashed' : ''}`}
          style={{ 
            backgroundColor: !hasImage ? themeColors.nodeBg : '#000000',
            borderColor: !hasImage ? themeColors.inputBorder : 'transparent'
          }}
        >
           {!hasImage ? (
               // 空状态：显示上传按钮和prompt输入
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: themeColors.textMuted }}>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLightCanvas ? 'bg-gray-100' : 'bg-white/5'}`}>
                      <Icons.Image size={18} className={isLightCanvas ? 'text-gray-400' : 'text-zinc-500'} />
                   </div>
                   <div className={`text-[9px] font-medium uppercase tracking-widest text-center ${isLightCanvas ? 'text-gray-500' : 'text-zinc-600'}`}>
                       Upload or Prompt
                   </div>
                   <button 
                     className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border border-blue-500/20 transition-colors"
                     onClick={() => fileInputRef.current?.click()}
                     onMouseDown={(e) => e.stopPropagation()} 
                   >
                       <Icons.Upload size={10} /> Upload
                   </button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                   
                   {/* Prompt Input */}
                   <div className="absolute bottom-2 left-2 right-2">
                      <textarea 
                          className={`w-full rounded-lg p-2 text-[10px] outline-none resize-none transition-colors ${isLightCanvas ? 'bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-400' : 'bg-black/50 border border-white/10 text-zinc-300 placeholder-zinc-600 focus:border-blue-500/50 focus:text-white'}`}
                          placeholder="输入描述文生图..."
                          value={localPrompt}
                          onChange={(e) => setLocalPrompt(e.target.value)}
                          onBlur={handleUpdate}
                          onMouseDown={(e) => e.stopPropagation()}
                          rows={2}
                      />
                   </div>
               </div>
           ) : (
             // 有图片状态：只显示图片，不显示提示词输入框
             <>
                <div className="absolute inset-0 bg-zinc-900 z-0" />
                <img 
                    src={node.content} 
                    alt="Image" 
                    className="relative z-10 w-full h-full object-contain select-none pointer-events-none" 
                    draggable={false}
                    style={{
                        imageRendering: 'auto',
                        // 🔧 优化：强制创建独立合成层，避免画布缩放时图片模糊
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    } as React.CSSProperties}
                />
                
                {/* 信息查询按钮 - 移动到右上角 */}
                <div 
                  className="absolute top-2 right-2 z-20"
                  onMouseEnter={() => setShowMediaInfo(true)}
                  onMouseLeave={() => setShowMediaInfo(false)}
                >
                  <div 
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
                    title="图片信息"
                  >
                    <Icons.Info size={14} className="text-white/70" />
                  </div>
                  
                  {/* 信息浮窗 - 从右侧弹出 */}
                  {showMediaInfo && mediaMetadata && (
                    <div 
                      className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-white/90 whitespace-nowrap shadow-lg"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-0.5">
                        <div><span className="text-zinc-500">宽度:</span> {mediaMetadata.width} px</div>
                        <div><span className="text-zinc-500">高度:</span> {mediaMetadata.height} px</div>
                        <div><span className="text-zinc-500">比例:</span> {getAspectRatio(mediaMetadata.width, mediaMetadata.height)}</div>
                        <div><span className="text-zinc-500">大小:</span> {mediaMetadata.size}</div>
                        <div><span className="text-zinc-500">格式:</span> {mediaMetadata.format}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 工具箱按钮 - 向左上移动一些 */}
                <div className="absolute bottom-6 right-6 z-20">
                  <button
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowToolbox(!showToolbox);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="工具箱"
                  >
                    <Icons.Wrench size={16} className="text-white/70" />
                  </button>
                  
                  {/* 工具球 - 向上弹出 */}
                  {showToolbox && onCreateToolNode && (
                    <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2">
                      {/* 高清 */}
                      <button
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateToolNode(node.id, 'upscale', { x: node.x + node.width + 100, y: node.y });
                          setShowToolbox(false);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="高清化"
                        style={{ filter: `drop-shadow(0 0 4px ${nodeColor.light})` }}
                      >
                        <Icons.Sparkles size={14} className="text-white" />
                      </button>
                      
                      {/* 提取主体 */}
                      <button
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateToolNode(node.id, 'remove-bg', { x: node.x + node.width + 100, y: node.y });
                          setShowToolbox(false);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="移除背景"
                        style={{ filter: `drop-shadow(0 0 4px ${nodeColor.light})` }}
                      >
                        <Icons.Scissors size={14} className="text-white" />
                      </button>
                      
                      {/* 扩图 */}
                      <button
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateToolNode(node.id, 'edit', { x: node.x + node.width + 100, y: node.y });
                          setShowToolbox(false);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="扩展图片"
                        style={{ filter: `drop-shadow(0 0 4px ${nodeColor.light})` }}
                      >
                        <Icons.Expand size={14} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
             </>
           )}           
           {/* 状态标签 - 保持在左上角 */}
           <div 
             className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md"
             style={{
               backgroundColor: hasImage ? `${nodeColor.primary}40` : (isLightCanvas ? 'rgb(229, 231, 235)' : 'rgb(39, 39, 42)'),
               color: hasImage ? nodeColor.light : (isLightCanvas ? 'rgb(75, 85, 99)' : 'rgb(113, 113, 122)')
             }}
           >
               Image
           </div>
           
           {isRunning && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-30">
                    <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
            )}
        </div>
      );
    }

    if (node.type === 'video') {
        // 视频配置节点 - 始终显示配置界面，视频输出到独立的 video-output 节点
        
        // 视频服务类型: 'sora' | 'veo' | 'grok'
        const videoService = node.data?.videoService || 'sora';
        
        // Sora settings
        const videoSize = node.data?.videoSize || '1280x720';
        const videoModel = node.data?.videoModel || 'sora-2';
        const videoSeconds = node.data?.videoSeconds || '10';
        const isHD = videoModel === 'sora-2-pro';
        
        // Veo3.1 settings
        const veoMode = node.data?.veoMode || 'text2video'; // text2video | image2video | keyframes | multi-reference
        const veoModel = node.data?.veoModel || 'veo3.1-fast';   // veo3.1-fast | veo3.1-pro | veo3.1-4k | veo3.1-pro-4k | veo3.1-components | veo3.1-components-4k
        const veoAspectRatio = node.data?.veoAspectRatio || '16:9';
        const veoEnhancePrompt = node.data?.veoEnhancePrompt ?? false;
        const veoEnableUpsample = node.data?.veoEnableUpsample ?? false;
        
        // Grok settings
        const grokRatio = node.data?.grokRatio || '3:2';       // 2:3 | 3:2 | 1:1
        const grokResolution = node.data?.grokResolution || '720P';  // 720P | 1080P
        
        const handleVideoSettingChange = (key: string, value: any) => {
            onUpdate(node.id, { data: { ...node.data, [key]: value } });
        };

        // 视频节点始终显示配置界面
        return (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                {/* Header with TAB切换 */}
                <div className="h-7 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                    <div className="flex items-center gap-1">
                        <Icons.Video size={12} style={{ color: themeColors.textSecondary }} />
                        {/* TAB切换按钮 */}
                        <div className={`flex ${controlBg} rounded p-0.5 ml-1`}>
                            <button
                                className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded transition-all ${
                                    videoService === 'sora' 
                                        ? 'bg-white/20 text-white' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                onClick={() => handleVideoSettingChange('videoService', 'sora')}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                Sora
                            </button>
                            <button
                                className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded transition-all ${
                                    videoService === 'veo' 
                                        ? 'bg-purple-500/30 text-purple-300' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                onClick={() => handleVideoSettingChange('videoService', 'veo')}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                Veo3.1
                            </button>
                            <button
                                className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded transition-all ${
                                    videoService === 'grok' 
                                        ? 'bg-orange-500/30 text-orange-300' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                onClick={() => handleVideoSettingChange('videoService', 'grok')}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                Grok
                            </button>
                        </div>
                    </div>
                    <span className="text-[7px] text-white/40 uppercase">
                        {videoService === 'sora' ? 'IMG+TXT → VIDEO' : 
                         videoService === 'grok' ? 'IMG+TXT → VIDEO' : (
                            veoMode === 'text2video' ? 'TXT → VIDEO' :
                            veoMode === 'image2video' ? 'IMG → VIDEO' :
                            veoMode === 'keyframes' ? '首尾帧 → VIDEO' :
                            '多图参考 → VIDEO'
                        )}
                    </span>
                </div>
                
                {/* Settings */}
                <div className="flex-1 p-2 flex flex-col gap-2 overflow-hidden">
                    {/* Prompt - 可扩展的提示词区域 */}
                    <textarea 
                        className={`flex-1 min-h-[60px] ${controlBg} border rounded p-2 text-[11px] outline-none resize-none transition-colors ${isLightCanvas ? 'border-gray-200 text-gray-800 focus:border-yellow-500 placeholder-gray-400' : 'border-white/10 text-zinc-200 focus:border-yellow-500/50 placeholder-zinc-600'}`}
                        placeholder="描述视频场景..."
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        onBlur={handleUpdate}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    
                    {/* Sora Settings */}
                    {videoService === 'sora' && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                            {/* Row 1: Aspect + Quality */}
                            <div className="flex gap-1.5">
                                {/* Aspect Ratio */}
                                <div className={`flex ${controlBg} rounded p-0.5 flex-1`}>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${videoSize === '1280x720' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleVideoSettingChange('videoSize', '1280x720')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        16:9
                                    </button>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${videoSize === '720x1280' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleVideoSettingChange('videoSize', '720x1280')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        9:16
                                    </button>
                                </div>
                                {/* Quality */}
                                <div className={`flex ${controlBg} rounded p-0.5 flex-1`}>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${!isHD ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleVideoSettingChange('videoModel', 'sora-2')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        SD
                                    </button>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${isHD ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleVideoSettingChange('videoModel', 'sora-2-pro')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        HD
                                    </button>
                                </div>
                            </div>
                            {/* Row 2: Duration */}
                            <div className={`flex ${controlBg} rounded p-0.5`}>
                                <button
                                    className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${videoSeconds === '10' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    onClick={() => handleVideoSettingChange('videoSeconds', '10')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    10s
                                </button>
                                <button
                                    className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${videoSeconds === '15' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    onClick={() => handleVideoSettingChange('videoSeconds', '15')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    15s
                                </button>
                                {isHD && (
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${videoSeconds === '25' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleVideoSettingChange('videoSeconds', '25')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        25s
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Veo3.1 Settings */}
                    {videoService === 'veo' && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                            {/* Row 1: 视频模式 */}
                            <div className={`flex ${controlBg} rounded p-0.5`}>
                                <button
                                    className={`flex-1 px-1.5 py-1 text-[8px] font-medium rounded transition-all ${veoMode === 'text2video' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                    onClick={() => {
                                        // 从多图参考切换时，自动选择 fast 模型
                                        const newModel = (node.data?.veoModel || '').includes('components') ? 'veo3.1-fast' : node.data?.veoModel;
                                        onUpdate(node.id, { data: { ...node.data, veoMode: 'text2video', veoModel: newModel || 'veo3.1-fast' } });
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="纯文字生成视频"
                                >
                                    文生视频
                                </button>
                                <button
                                    className={`flex-1 px-1.5 py-1 text-[8px] font-medium rounded transition-all ${veoMode === 'image2video' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                    onClick={() => {
                                        const newModel = (node.data?.veoModel || '').includes('components') ? 'veo3.1-fast' : node.data?.veoModel;
                                        onUpdate(node.id, { data: { ...node.data, veoMode: 'image2video', veoModel: newModel || 'veo3.1-fast' } });
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="单图直出视频"
                                >
                                    图生视频
                                </button>
                                <button
                                    className={`flex-1 px-1.5 py-1 text-[8px] font-medium rounded transition-all ${veoMode === 'keyframes' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                    onClick={() => {
                                        const newModel = (node.data?.veoModel || '').includes('components') ? 'veo3.1-fast' : node.data?.veoModel;
                                        onUpdate(node.id, { data: { ...node.data, veoMode: 'keyframes', veoModel: newModel || 'veo3.1-fast' } });
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="首尾帧控制视频"
                                >
                                    首尾帧
                                </button>
                                <button
                                    className={`flex-1 px-1.5 py-1 text-[8px] font-medium rounded transition-all ${veoMode === 'multi-reference' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                    onClick={() => {
                                        // 切换到多图参考时，自动选择 components 模型
                                        onUpdate(node.id, { data: { ...node.data, veoMode: 'multi-reference', veoModel: 'veo3.1-components' } });
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="多图参考生成"
                                >
                                    多图参考
                                </button>
                            </div>
                            
                            {/* Row 1.5: 模型选择 - 根据模式显示不同模型 */}
                            <div className="flex flex-col gap-1">
                                {/* 文生视频/图生视频/首尾帧模式：显示 fast, 标准, 4k, pro, pro-4k */}
                                {veoMode !== 'multi-reference' && (
                                    <>
                                        {/* 第一行: fast, 标准, 4k */}
                                        <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                                            <button
                                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1-fast' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                                onClick={() => handleVideoSettingChange('veoModel', 'veo3.1-fast')}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                title="快速模式"
                                            >
                                                fast
                                            </button>
                                            <button
                                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                                onClick={() => handleVideoSettingChange('veoModel', 'veo3.1')}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                title="标准模式"
                                            >
                                                标准
                                            </button>
                                            <button
                                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1-4k' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                                onClick={() => handleVideoSettingChange('veoModel', 'veo3.1-4k')}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                title="4K 标准"
                                            >
                                                4k
                                            </button>
                                        </div>
                                        {/* 第二行: pro, pro-4k */}
                                        <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                                            <button
                                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1-pro' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                                onClick={() => handleVideoSettingChange('veoModel', 'veo3.1-pro')}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                title="高质量"
                                            >
                                                pro
                                            </button>
                                            <button
                                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1-pro-4k' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                                onClick={() => handleVideoSettingChange('veoModel', 'veo3.1-pro-4k')}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                title="4K 高质量"
                                            >
                                                pro-4k
                                            </button>
                                        </div>
                                    </>
                                )}
                                {/* 多图参考模式：仅显示 components 和 components-4k */}
                                {veoMode === 'multi-reference' && (
                                    <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                                        <button
                                            className={`flex-1 px-2 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1-components' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                            onClick={() => handleVideoSettingChange('veoModel', 'veo3.1-components')}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            title="多图参考标准"
                                        >
                                            comp
                                        </button>
                                        <button
                                            className={`flex-1 px-2 py-1 text-[9px] font-medium rounded-md transition-all ${veoModel === 'veo3.1-components-4k' ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-500 hover:text-zinc-300')}`}
                                            onClick={() => handleVideoSettingChange('veoModel', 'veo3.1-components-4k')}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            title="4K 多图参考"
                                        >
                                            comp-4k
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Row 2: 宽高比 + 增强提示词（所有模式都显示） */}
                            <div className="flex gap-1.5">
                                <div className={`flex ${controlBg} rounded p-0.5 flex-1`}>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${veoAspectRatio === '16:9' ? (isLightCanvas ? 'bg-gray-200 text-gray-800' : 'bg-white/20 text-white') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('veoAspectRatio', '16:9')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        16:9
                                    </button>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${veoAspectRatio === '9:16' ? (isLightCanvas ? 'bg-gray-200 text-gray-800' : 'bg-white/20 text-white') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('veoAspectRatio', '9:16')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        9:16
                                    </button>
                                </div>
                                {veoMode !== 'multi-reference' && (
                                    <button
                                        className={`px-2 py-1 text-[8px] font-medium rounded transition-all ${veoEnhancePrompt ? (isLightCanvas ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-300') : `${controlBg} ${isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200'}`}`}
                                        onClick={() => handleVideoSettingChange('veoEnhancePrompt', !veoEnhancePrompt)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        title="AI自动优化提示词"
                                    >
                                        {veoEnhancePrompt ? '✓ 增强' : '增强'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Grok Settings */}
                    {videoService === 'grok' && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                            {/* Row 1: 宽高比 */}
                            <div className="flex flex-col gap-1">
                                <span className={`text-[8px] ${isLightCanvas ? 'text-gray-500' : 'text-zinc-500'}`}>宽高比</span>
                                <div className={`flex ${controlBg} rounded p-0.5`}>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${grokRatio === '3:2' ? (isLightCanvas ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/30 text-orange-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('grokRatio', '3:2')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        title="横屏 3:2"
                                    >
                                        3:2
                                    </button>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${grokRatio === '2:3' ? (isLightCanvas ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/30 text-orange-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('grokRatio', '2:3')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        title="竖屏 2:3"
                                    >
                                        2:3
                                    </button>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${grokRatio === '1:1' ? (isLightCanvas ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/30 text-orange-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('grokRatio', '1:1')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        title="方形 1:1"
                                    >
                                        1:1
                                    </button>
                                </div>
                            </div>
                            
                            {/* Row 2: 分辨率 */}
                            <div className="flex flex-col gap-1">
                                <span className={`text-[8px] ${isLightCanvas ? 'text-gray-500' : 'text-zinc-500'}`}>分辨率</span>
                                <div className={`flex ${controlBg} rounded p-0.5`}>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${grokResolution === '720P' ? (isLightCanvas ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/30 text-orange-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('grokResolution', '720P')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        720P
                                    </button>
                                    <button
                                        className={`flex-1 px-2 py-1 text-[9px] font-medium rounded transition-all ${grokResolution === '1080P' ? (isLightCanvas ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/30 text-orange-300') : (isLightCanvas ? 'text-gray-500 hover:text-gray-700' : 'text-zinc-400 hover:text-zinc-200')}`}
                                        onClick={() => handleVideoSettingChange('grokResolution', '1080P')}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        1080P
                                    </button>
                                </div>
                            </div>
                            
                            {/* 提示：支持参考图 */}
                            <div className={`text-[8px] ${isLightCanvas ? 'text-gray-400' : 'text-zinc-600'} text-center`}>
                                支持一张参考图
                            </div>
                        </div>
                    )}
                </div>
                
                {isRunning && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-30">
                        <div className="flex flex-col items-center gap-2">
                            {node.data?.videoTaskStatus && (
                                <div className="text-[9px] text-white/60 font-mono mb-1">
                                    {node.data.videoTaskStatus === 'NOT_START' && '📦 任务正在排队...'}
                                    {node.data.videoTaskStatus === 'PENDING' && '📦 任务正在排队...'}
                                    {node.data.videoTaskStatus === 'IN_PROGRESS' && '🎨 正在生成视频...'}
                                    {node.data.videoTaskStatus === 'RUNNING' && '🎨 正在生成视频...'}
                                    {node.data.videoTaskStatus === 'SUCCESS' && '✅ 生成完成，下载中...'}
                                    {node.data.videoTaskStatus === 'FAILURE' && '❌ 生成失败'}
                                </div>
                            )}
                            
                            <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            
                            {node.data?.videoProgress !== undefined && node.data.videoProgress > 0 ? (
                                <span className="text-[11px] text-white font-medium">进度: {node.data.videoProgress}%</span>
                            ) : (
                                <span className="text-[10px] text-white/80 font-medium">视频生成中...</span>
                            )}
                            
                            {node.data?.videoTaskStatus === 'FAILURE' && node.data?.videoFailReason && (
                                <div className="max-w-[200px] text-center">
                                    <span className="text-[8px] text-red-400 block">{node.data.videoFailReason}</span>
                                </div>
                            )}
                            
                            {!node.data?.videoTaskStatus && (
                                <span className="text-[8px] text-zinc-500">预计 1-10 分钟</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Video Output 节点 - 显示生成的视频 + 工具栏
    if (node.type === 'video-output') {
        // video-output节点：只要有内容就尝试播放，不限制后缀格式
        const hasVideo = !!node.content;
        const videoNodeColor = getNodeTypeColor(node.type);
        
        // 处理视频 URL，为 /files/ 路径添加完整 URL
        let videoSrc = node.content || '';
        if (videoSrc.startsWith('/files/')) {
            videoSrc = `http://localhost:8765${videoSrc}`;
        }
        // 处理可能的图片URL（RunningHub可能返回.png后缀的视频）
        // 如果是http/https URL，直接使用
        
        return (
            <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
                {hasVideo ? (
                    <>
                        {videoFallbackToImage ? (<img src={videoSrc} alt="Output" className="w-full h-full object-contain" />) : (<video src={videoSrc} controls loop autoPlay muted className="w-full h-full object-contain" onError={() => setVideoFallbackToImage(true)} />)}
                        
                        {/* 状态标签 */}
                        <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md bg-white/20 text-white">
                            Video
                        </div>
                        
                        {/* 信息查询按钮 */}
                        <div 
                          className="absolute top-2 right-2 z-20"
                          onMouseEnter={() => setShowMediaInfo(true)}
                          onMouseLeave={() => setShowMediaInfo(false)}
                        >
                          <div 
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
                            title="视频信息"
                          >
                            <Icons.Info size={14} className="text-white/70" />
                          </div>
                          
                          {showMediaInfo && mediaMetadata && (
                            <div 
                              className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-white/90 whitespace-nowrap shadow-lg"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-0.5">
                                <div><span className="text-zinc-500">宽度:</span> {mediaMetadata.width} px</div>
                                <div><span className="text-zinc-500">高度:</span> {mediaMetadata.height} px</div>
                                <div><span className="text-zinc-500">比例:</span> {getAspectRatio(mediaMetadata.width, mediaMetadata.height)}</div>
                                {mediaMetadata.duration && <div><span className="text-zinc-500">时长:</span> {mediaMetadata.duration}</div>}
                                <div><span className="text-zinc-500">大小:</span> {mediaMetadata.size}</div>
                                <div><span className="text-zinc-500">格式:</span> {mediaMetadata.format}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 工具箱按钮 */}
                        <div className="absolute bottom-6 right-6 z-20">
                          <button
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowToolbox(!showToolbox);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="视频工具"
                          >
                            <Icons.Wrench size={16} className="text-white/70" />
                          </button>
                          
                          {/* 工具球 - 向上弹出 */}
                          {showToolbox && (onExtractFrame || onCreateFrameExtractor) && (
                            <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2">
                              {/* 帧提取器 - 新增 */}
                              {onCreateFrameExtractor && (
                                <button
                                  className="w-8 h-8 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateFrameExtractor(node.id);
                                    setShowToolbox(false);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="打开帧提取器"
                                  style={{ filter: `drop-shadow(0 0 4px rgb(16, 185, 129))` }}
                                >
                                  <Icons.Scissors size={14} className="text-emerald-300" />
                                </button>
                              )}
                              
                              {/* 任意帧提取 */}
                              {onExtractFrame && (
                                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="秒"
                                  value={customFrameTime}
                                  onChange={(e) => setCustomFrameTime(e.target.value)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="w-12 h-6 bg-white/10 text-white text-[10px] text-center rounded border border-white/20 focus:border-white/40 focus:outline-none"
                                />
                                <button
                                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const time = parseFloat(customFrameTime);
                                    if (!isNaN(time) && time >= 0) {
                                      onExtractFrame(node.id, time);
                                      setShowToolbox(false);
                                      setCustomFrameTime('');
                                    }
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="提取指定时间帧"
                                >
                                  <Icons.Scissors size={12} className="text-white" />
                                </button>
                              </div>
                              )}
                              
                              {onExtractFrame && (
                              <>
                              {/* 提取尾帧 */}
                              <button
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExtractFrame(node.id, 'last');
                                  setShowToolbox(false);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                title="提取尾帧"
                                style={{ filter: `drop-shadow(0 0 4px ${videoNodeColor.light})` }}
                              >
                                <Icons.Image size={14} className="text-white" />
                              </button>
                              
                              {/* 提取首帧 */}
                              <button
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExtractFrame(node.id, 'first');
                                  setShowToolbox(false);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                title="提取首帧"
                                style={{ filter: `drop-shadow(0 0 4px ${videoNodeColor.light})` }}
                              >
                                <Icons.Play size={14} className="text-white" />
                              </button>
                              </>
                              )}
                            </div>
                          )}
                        </div>
                    </>
                ) : node.status === 'error' ? (
                    // 错误状态 - 提供重试和打开原始URL的选项
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-red-950/30 border-2 border-red-500/50 rounded-xl p-4">
                        <Icons.Close size={24} className="text-red-400" />
                        <span className="text-[11px] text-red-400 font-medium">生成失败</span>
                        {node.data?.videoFailReason && (
                            <span className="text-[9px] text-red-400/70 text-center px-2 max-w-full break-words">
                                {node.data.videoFailReason.length > 80 
                                    ? node.data.videoFailReason.slice(0, 80) + '...' 
                                    : node.data.videoFailReason}
                            </span>
                        )}
                        {/* 操作按钮 */}
                        <div className="flex gap-2 mt-1">
                            {/* 重试下载按钮 */}
                            {node.data?.videoUrl && onRetryVideoDownload && (
                                <button
                                    className="px-3 py-1.5 text-[10px] font-medium bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRetryVideoDownload(node.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <Icons.Refresh size={12} />
                                    重试下载
                                </button>
                            )}
                            {/* 在新标签页打开原始URL */}
                            {node.data?.videoUrl && (
                                <button
                                    className="px-3 py-1.5 text-[10px] font-medium bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors flex items-center gap-1.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(node.data?.videoUrl, '_blank');
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <Icons.ExternalLink size={12} />
                                    打开链接
                                </button>
                            )}
                        </div>
                    </div>
                ) : node.status === 'completed' && !hasVideo ? (
                    // 已完成但没有视频 - 可能是下载失败或内容丢失
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-yellow-950/30 border-2 border-yellow-500/50 rounded-xl p-4">
                        <Icons.Info size={24} className="text-yellow-400" />
                        <span className="text-[11px] text-yellow-400 font-medium">视频内容异常</span>
                        <span className="text-[9px] text-yellow-400/70 text-center px-2">
                            视频已生成但内容为空，请重试
                        </span>
                        {node.data?.videoUrl && onRetryVideoDownload && (
                            <button
                                className="px-3 py-1.5 text-[10px] font-medium bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRetryVideoDownload(node.id);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <Icons.Refresh size={12} />
                                重试下载
                            </button>
                        )}
                    </div>
                ) : (
                    // Loading 状态
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-900/50">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-[10px] text-zinc-500">等待视频生成...</span>
                        {node.data?.videoTaskStatus && (
                            <span className="text-[9px] text-zinc-600">
                                {node.data.videoTaskStatus === 'PENDING' && '任务排队中...'}
                                {node.data.videoTaskStatus === 'RUNNING' && `生成中 ${node.data.videoProgress || 0}%`}
                            </span>
                        )}
                    </div>
                )}
                
                {isRunning && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-30">
                        <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    // Frame Extractor 节点 - 帧提取容器
    if (node.type === 'frame-extractor') {
        const videoUrl = node.data?.sourceVideoUrl || node.content || '';
        const currentTime = node.data?.currentFrameTime ?? 0;
        const duration = node.data?.videoDuration ?? 10;
        const thumbnails = node.data?.frameThumbnails || [];
        const videoRef = useRef<HTMLVideoElement>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [localTime, setLocalTime] = useState(currentTime);
        const [previewFrame, setPreviewFrame] = useState<string>('');
        const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(thumbnails.length === 0);
        
        // 处理视频 URL
        let fullVideoUrl = videoUrl;
        if (videoUrl.startsWith('/files/')) {
            fullVideoUrl = `http://localhost:8765${videoUrl}`;
        }
        
        // 生成缩略图
        useEffect(() => {
            if (thumbnails.length > 0 || !videoUrl) return;
            
            const generateThumbnails = async () => {
                setIsLoadingThumbnails(true);
                try {
                    const video = document.createElement('video');
                    video.crossOrigin = 'anonymous';
                    video.src = fullVideoUrl;
                    
                    await new Promise<void>((resolve, reject) => {
                        video.onloadedmetadata = () => resolve();
                        video.onerror = reject;
                        video.load();
                    });
                    
                    const dur = video.duration;
                    const thumbCount = Math.min(12, Math.max(6, Math.floor(dur)));
                    const interval = dur / thumbCount;
                    const newThumbnails: string[] = [];
                    
                    for (let i = 0; i < thumbCount; i++) {
                        const time = i * interval;
                        await new Promise<void>((resolve) => {
                            video.onseeked = () => resolve();
                            video.currentTime = time;
                        });
                        
                        const canvas = document.createElement('canvas');
                        canvas.width = 80;
                        canvas.height = 45;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(video, 0, 0, 80, 45);
                            newThumbnails.push(canvas.toDataURL('image/jpeg', 0.6));
                        }
                    }
                    
                    onUpdate(node.id, {
                        data: {
                            ...node.data,
                            frameThumbnails: newThumbnails,
                            videoDuration: dur
                        }
                    });
                } catch (err) {
                    console.error('生成缩略图失败:', err);
                } finally {
                    setIsLoadingThumbnails(false);
                }
            };
            
            generateThumbnails();
        }, [videoUrl, thumbnails.length]);
        
        // 播放/暂停
        const togglePlay = () => {
            if (!videoRef.current) return;
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        };
        
        // 更新当前时间
        const handleTimeUpdate = () => {
            if (videoRef.current) {
                setLocalTime(videoRef.current.currentTime);
            }
        };
        
        // 点击缩略图跳转
        const handleThumbnailClick = (index: number) => {
            if (!videoRef.current || thumbnails.length === 0) return;
            const time = (index / thumbnails.length) * duration;
            videoRef.current.currentTime = time;
            setLocalTime(time);
            onUpdate(node.id, { data: { ...node.data, currentFrameTime: time } });
        };
        
        // 提取当前帧
        const extractCurrentFrame = () => {
            if (onExtractFrameFromExtractor) {
                onExtractFrameFromExtractor(node.id, localTime);
            }
        };
        
        // 格式化时间
        const formatTime = (t: number) => {
            const mins = Math.floor(t / 60);
            const secs = Math.floor(t % 60);
            const ms = Math.floor((t % 1) * 10);
            return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
        };
        
        return (
            <div className="w-full h-full rounded-xl overflow-hidden relative flex flex-col" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                {/* 标题栏 */}
                <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                    <div className="flex items-center gap-2">
                        <Icons.Scissors size={14} style={{ color: themeColors.textSecondary }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>帧提取器</span>
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: themeColors.textMuted }}>{formatTime(localTime)} / {formatTime(duration)}</span>
                </div>
                
                {/* 视频预览区 */}
                <div className="flex-1 relative bg-black min-h-0">
                    <video
                        ref={videoRef}
                        src={fullVideoUrl}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            if (!node.data?.videoDuration) {
                                onUpdate(node.id, { data: { ...node.data, videoDuration: v.duration } });
                            }
                        }}
                        onEnded={() => setIsPlaying(false)}
                    />
                    
                    {/* 播放按钮覆盖层 */}
                    <div 
                        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                        onClick={togglePlay}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {!isPlaying && (
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 transition-all">
                                <Icons.Play size={24} className="text-white ml-1" />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 底部工具栏 */}
                <div className="shrink-0 bg-[#0f0f14] border-t border-white/10 p-2">
                    {/* 控制按钮 */}
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={isPlaying ? '暂停' : '播放'}
                        >
                            {isPlaying ? <Icons.Pause size={16} className="text-white" /> : <Icons.Play size={16} className="text-white ml-0.5" />}
                        </button>
                        
                        <button
                            className="flex-1 h-8 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 flex items-center justify-center gap-2 transition-all border border-emerald-500/30"
                            onClick={(e) => { e.stopPropagation(); extractCurrentFrame(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="提取当前帧"
                        >
                            <Icons.Camera size={14} className="text-emerald-300" />
                            <span className="text-[11px] text-emerald-200 font-medium">提取此帧</span>
                        </button>
                    </div>
                    
                    {/* 帧缩略图时间线 */}
                    <div className="relative">
                        {isLoadingThumbnails ? (
                            <div className="h-12 flex items-center justify-center bg-black/30 rounded-lg">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="ml-2 text-[10px] text-zinc-500">生成缩略图...</span>
                            </div>
                        ) : (
                            <div 
                                className="flex gap-0.5 overflow-x-auto scrollbar-hide rounded-lg"
                                onWheel={(e) => e.stopPropagation()}
                            >
                                {thumbnails.map((thumb, idx) => {
                                    const thumbTime = (idx / thumbnails.length) * duration;
                                    const isActive = Math.abs(thumbTime - localTime) < (duration / thumbnails.length / 2);
                                    return (
                                        <div
                                            key={idx}
                                            className={`shrink-0 cursor-pointer transition-all rounded overflow-hidden ${isActive ? 'ring-2 ring-emerald-400 scale-105 z-10' : 'opacity-70 hover:opacity-100'}`}
                                            onClick={(e) => { e.stopPropagation(); handleThumbnailClick(idx); }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            title={formatTime(thumbTime)}
                                        >
                                            <img src={thumb} alt={`帧 ${idx + 1}`} className="w-16 h-9 object-cover" draggable={false} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* 时间进度指示器 */}
                        {thumbnails.length > 0 && (
                            <div 
                                className="absolute top-0 h-full w-0.5 bg-emerald-400 pointer-events-none transition-all"
                                style={{ left: `${(localTime / duration) * 100}%` }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Workflow Tools (Edit, etc.)
    const isWorkflowNode = ['edit', 'remove-bg', 'upscale'].includes(node.type);
    if (isWorkflowNode) {
        let icon = <Icons.Settings />;
        let label = "Node";

        if (node.type === 'edit') { 
            icon = <BananaIcon size={12} className="text-yellow-300" />; label = "Magic";
        }
        if (node.type === 'remove-bg') { 
            icon = <Icons.Scissors size={14} className="text-white/70" />; label = "Remove BG";
        }
        if (node.type === 'upscale') { 
            icon = <Icons.Upscale size={14} className="text-white/70" />; label = "Upscale 4K";
        }

        // Edit 节点的设置
        const editAspectRatio = node.data?.settings?.aspectRatio || 'AUTO';
        const editResolution = node.data?.settings?.resolution || 'AUTO';
        const aspectRatios1 = ['AUTO', '1:1', '2:3', '3:2', '3:4', '4:3'];
        const aspectRatios2 = ['3:5', '5:3', '9:16', '16:9', '21:9'];
        const resolutions = ['AUTO', '1K', '2K', '4K'];
        
        const handleEditSettingChange = (key: string, value: string) => {
            // 参数改变时，重置状态和清空输出，让节点可以重新执行
            onUpdate(node.id, { 
                data: { ...node.data, settings: { ...node.data?.settings, [key]: value }, output: undefined },
                content: '', // 清空显示内容，回到设置界面
                status: 'idle' // 重置状态为idle，允许重新执行
            });
        };

        // If there's output content, show the result image
        // 🔧 修复：upscale和remove-bg节点不再显示图片，结果在下游Image节点
        if (node.type !== 'upscale' && node.type !== 'remove-bg' && node.content && (node.content.startsWith('data:image') || node.content.startsWith('http://') || node.content.startsWith('https://'))) {
            // 图片加载后自动调整节点尺寸以匹配图片比例
            const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
                const img = e.currentTarget;
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                const aspectRatio = imgWidth / imgHeight;
                
                // 保持宽度不变，根据比例计算高度（加上标题栏32px）
                const newHeight = Math.round(node.width / aspectRatio) + 32;
                // 只有当高度差异较大时才更新，避免无限循环
                if (Math.abs(newHeight - node.height) > 10) {
                    onUpdate(node.id, { height: newHeight });
                }
            };
            
            return (
                <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                    <div className="h-8 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                        {icon}
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>{label}</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        <img 
                            src={node.content} 
                            alt="Output" 
                            className="w-full h-full object-contain" 
                            draggable={false}
                            onLoad={handleImageLoad}
                            style={{
                                imageRendering: 'auto',
                                transform: 'translateZ(0)',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                            } as React.CSSProperties}
                        />
                        
                        {/* 信息查询按钮 */}
                        <div 
                          className="absolute top-2 right-2 z-20"
                          onMouseEnter={() => setShowMediaInfo(true)}
                          onMouseLeave={() => setShowMediaInfo(false)}
                        >
                          <div 
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
                            title="图片信息"
                          >
                            <Icons.Info size={14} className="text-white/70" />
                          </div>
                          
                          {/* 信息浮窗 */}
                          {showMediaInfo && mediaMetadata && (
                            <div 
                              className="absolute top-full right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-2 text-[10px] text-white/90 whitespace-nowrap shadow-lg"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-0.5">
                                <div><span className="text-zinc-500">宽度:</span> {mediaMetadata.width} px</div>
                                <div><span className="text-zinc-500">高度:</span> {mediaMetadata.height} px</div>
                                <div><span className="text-zinc-500">比例:</span> {getAspectRatio(mediaMetadata.width, mediaMetadata.height)}</div>
                                <div><span className="text-zinc-500">大小:</span> {mediaMetadata.size}</div>
                                <div><span className="text-zinc-500">格式:</span> {mediaMetadata.format}</div>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                    {/* Prompt overlay on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 hover:opacity-100 transition-opacity z-20">
                        <textarea 
                            className={inputBaseClass + " resize-none text-[10px]"}
                            placeholder="New instructions..."
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            onBlur={handleUpdate}
                            onMouseDown={(e) => e.stopPropagation()} 
                            rows={2}
                        />
                    </div>
                    {showRunningIndicator && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            );
        }

        // Edit 节点 - 显示设置界面（与创意节点UI保持一致）
        if (node.type === 'edit') {
            return (
                <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${isLightCanvas ? 'rgba(234,179,8,0.3)' : 'rgba(234,179,8,0.3)'}` }}>
                    {/* 头部 - 与创意节点一致 */}
                    <div className="h-8 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${isLightCanvas ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.2)'}`, backgroundColor: isLightCanvas ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.1)' }}>
                        <div className="flex items-center gap-2">
                            <BananaIcon size={12} className={isLightCanvas ? 'text-yellow-600' : 'text-yellow-300'} />
                            <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: isLightCanvas ? '#a16207' : '#fef08a' }}>{label}</span>
                        </div>
                        <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: isLightCanvas ? '#854d0e' : 'rgba(253,224,71,0.6)', backgroundColor: isLightCanvas ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.2)' }}>MAGIC</span>
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
                        {/* Prompt */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium block mb-1.5 flex-shrink-0">编辑指令</label>
                            <textarea 
                                className={`flex-1 w-full ${controlBg} border rounded-lg px-3 py-2 text-xs outline-none resize-none overflow-y-auto scrollbar-hide transition-colors ${isLightCanvas ? 'border-gray-200 text-gray-800 focus:border-yellow-500 placeholder-gray-400' : 'border-white/10 text-zinc-200 focus:border-yellow-500/50 placeholder-zinc-600'}`}
                                placeholder="输入编辑指令..."
                                value={localPrompt}
                                onChange={(e) => setLocalPrompt(e.target.value)}
                                onBlur={handleUpdate}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                        
                    {/* 设置区 - 与创意节点一致的样式 */}
                    <div className="px-3 pb-3 space-y-1.5 flex-shrink-0">
                        {/* Aspect Ratio Row 1 */}
                        <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                            {aspectRatios1.map(r => (
                                <button
                                    key={r}
                                    className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${editAspectRatio === r ? 'bg-yellow-500/30 text-yellow-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    onClick={() => handleEditSettingChange('aspectRatio', r)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        {/* Aspect Ratio Row 2 */}
                        <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                            {aspectRatios2.map(r => (
                                <button
                                    key={r}
                                    className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${editAspectRatio === r ? 'bg-yellow-500/30 text-yellow-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    onClick={() => handleEditSettingChange('aspectRatio', r)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        {/* Resolution */}
                        <div className={`flex ${controlBg} rounded-lg p-0.5`}>
                            {resolutions.map(r => (
                                <button
                                    key={r}
                                    className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${editResolution === r ? 'bg-yellow-500/30 text-yellow-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    onClick={() => handleEditSettingChange('resolution', r)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* 底部状态 - 与创意节点一致 */}
                    <div className={`h-6 ${footerBarBg} border-t px-3 flex items-center justify-between text-[10px]`} style={{ borderColor: themeColors.headerBorder, color: themeColors.textMuted }}>
                        <span>输入: 1/1</span>
                        <span>{editAspectRatio} · {editResolution}</span>
                    </div>
                    
                    {showRunningIndicator && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                            <div className="w-8 h-8 border-2 border-yellow-400/50 border-t-yellow-400 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            );
        }

        // Upscale 节点 - 显示分辨率选择界面
        if (node.type === 'upscale') {
            const upscaleResolution = node.data?.settings?.resolution || '2K';
            const upscaleResolutions = ['2K', '4K'];
            
            return (
                <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                    <div className="h-7 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                        <div className="flex items-center gap-2">
                            {icon}
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>Upscale HD</span>
                        </div>
                        <span className="text-[7px] uppercase" style={{ color: themeColors.textMuted }}>IMG → HD</span>
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-center gap-3">
                        {/* 说明文字 */}
                        <div className="text-center">
                            <div className="text-zinc-400 text-[10px] mb-1">高清放大处理</div>
                            <div className="text-zinc-600 text-[8px]">保持原始比例，提升分辨率</div>
                        </div>
                        
                        {/* 分辨率选择 */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase px-1">目标分辨率</label>
                            <div className={`flex ${controlBg} rounded p-0.5`}>
                                {upscaleResolutions.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-3 py-2 text-[11px] font-bold rounded transition-all ${upscaleResolution === r ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleEditSettingChange('resolution', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* 分辨率说明 */}
                        <div className="text-center text-[8px] text-zinc-600">
                            {upscaleResolution === '2K' ? '输出约 2048px' : '输出约 4096px'}
                        </div>
                    </div>
                    <div className="h-6 bg-black/20 border-t border-white/5 px-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">IN: <span className="text-zinc-300">IMG</span></span>
                        <span className="flex items-center gap-1">OUT: <span className="text-zinc-300">{upscaleResolution}</span></span>
                    </div>
                    {showRunningIndicator && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                            <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            );
        }

        // No output yet - show input form (remove-bg)
        return (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden relative shadow-lg" style={{ backgroundColor: themeColors.nodeBg, border: `1px solid ${themeColors.nodeBorder}` }}>
                <div className="h-8 flex items-center px-3 gap-2" style={{ borderBottom: `1px solid ${themeColors.headerBorder}`, backgroundColor: themeColors.headerBg }}>
                    {icon}
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textPrimary }}>{label}</span>
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2 relative">
                    <textarea 
                        className={inputBaseClass + " flex-1 resize-none"}
                        placeholder="Instructions..."
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        onBlur={handleUpdate}
                        onMouseDown={(e) => e.stopPropagation()} 
                    />
                     <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-bold text-zinc-400 uppercase">
                        IMG OUT
                    </div>
                </div>
                {showRunningIndicator && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        );
    }

    // Standard Text / Idea - Simplified
    // 阻止滚轮事件冒泡到画布
    const handleTextWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    return (
      <div 
        className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-lg relative group/text"
        style={{ 
          backgroundColor: themeColors.nodeBg, 
          border: `1px solid ${themeColors.nodeBorder}`,
          color: themeColors.textPrimary 
        }}
      >
        {isEditing ? (
           <div 
               className="flex-1 p-3 flex flex-col h-full gap-2" 
               onMouseDown={(e) => e.stopPropagation()}
               onWheel={handleTextWheel}
           >
               {/* Content Input */}
               <textarea 
                  className="flex-1 bg-transparent text-zinc-200 text-sm outline-none resize-none placeholder-zinc-600 leading-relaxed scrollbar-hide font-medium"
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Type something..."
                  autoFocus
               />
               <div className="text-[9px] text-zinc-600 text-right">Click outside to save</div>
           </div>
        ) : (
          <div 
             className="flex-1 p-4 overflow-y-auto scrollbar-hide flex flex-col" 
             onWheel={handleTextWheel}
          >
             {/* No title, just content. Drag handled by parent div */}
             <p className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed flex-1 font-medium pointer-events-none">
                 {localContent || <span className="text-zinc-600 italic">Double-click to edit...</span>}
             </p>
          </div>
        )}
        
        {/* Type Badge - Only show on hover or selected */}
        {(isSelected) && (
             <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-white/60 uppercase pointer-events-none">
                {(node.type as string) === 'idea' ? 'Idea' : 'Text'}
            </div>
        )}

        {isRunning && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute transition-all duration-75 flex flex-col select-none
        ${isRelay ? 'rounded-full' : 'rounded-xl'}
        ${isSelected ? 'ring-2 ring-blue-500/50 z-50' : `ring-1 ${isLightCanvas ? 'ring-black/10 hover:ring-black/20' : 'ring-white/5 hover:ring-white/20'} z-10`}
        ${isSelected && !isRelay ? 'shadow-2xl' : ''}
        ${isRunning ? 'ring-2 ring-yellow-500 animate-pulse' : ''}
      `}
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: node.width,
        height: node.height,
        cursor: 'grab',
        backgroundColor: isRelay ? 'transparent' : themeColors.nodeBg,
        pointerEvents: 'auto',
        boxShadow: isLightCanvas ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      } as React.CSSProperties}
      onMouseDown={(e) => {
        // Prevent drag start if clicking interactive elements, BUT allow if it's the text display div
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || isResizing) return;
        
        // Let App.tsx know we are starting a drag
        onDragStart(e, node.id);
      }}
      onDoubleClick={() => setIsEditing(true)}
      onMouseUp={() => {
        // rh-config 节点只能通过具体的端口接收连接，不使用节点整体的 onMouseUp
        if (node.type !== 'rh-config') {
          onEndConnection(node.id);
        }
      }}
    >
      {/* Ports - rh-config 节点使用自己的连接点，不显示全局端口 */}
      {node.type !== 'rh-config' && (
        <div 
          className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-50 hover:scale-150 transition-all cursor-crosshair flex items-center justify-center border group/port ${inputPortColor}`}
          onMouseDown={(e) => handlePortDown(e, 'in')}
        />
      )}
      {node.type !== 'rh-config' && (
        <div 
          className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-50 hover:scale-150 transition-all cursor-crosshair flex items-center justify-center border ${outputPortColor}`}
          onMouseDown={(e) => handlePortDown(e, 'out')}
        />
      )}

      {/* Content */}
      {renderContent()}

      {/* Modern Resize Handle */}
      {isSelected && !isRelay && (
          <div 
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-50 flex items-end justify-end p-2 opacity-80 hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeStart}
          >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" className="text-white/50">
                  <path d="M10 2L10 10L2 10" strokeWidth="2" strokeLinecap="round" />
              </svg>
          </div>
      )}

      {/* ACTION BAR (Top) */}
      {(isSelected) && !isRelay && (
        <div className="absolute -top-10 right-0 flex gap-1.5 animate-in fade-in slide-in-from-bottom-2 z-[60]">
             {/* Edit Button for Text/Idea */}
             {['text', 'idea'].includes(node.type) && !isEditing && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="p-1.5 rounded-lg border shadow-lg transition-colors"
                    style={{ 
                      backgroundColor: isLightCanvas ? '#ffffff' : '#2c2c2e',
                      borderColor: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                      color: isLightCanvas ? '#6e6e73' : '#d4d4d8'
                    }}
                    title="Edit Text (Enter)"
                 >
                    <Icons.Edit size={12} fill="currentColor" />
                 </button>
             )}

             {/* Execute Button with Batch Count */}
             {['image', 'text', 'idea', 'edit', 'video', 'llm', 'remove-bg', 'upscale', 'resize', 'bp', 'runninghub', 'rh-config', 'rh-magic'].includes(node.type) && (
                 <div className="flex items-center gap-0.5">
                   {/* 批量数量选择器 - 对图片生成类型节点显示 */}
                   {['image', 'edit', 'bp', 'idea', 'remove-bg', 'upscale', 'video', 'rh-config', 'rh-magic'].includes(node.type) && !isRunning && (
                     <div 
                       className="flex items-center h-8 rounded-l-lg border border-r-0 overflow-hidden"
                       style={{ 
                         backgroundColor: isLightCanvas ? '#ffffff' : '#2c2c2e',
                         borderColor: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                       }}
                     >
                       <button
                         onClick={(e) => { e.stopPropagation(); setBatchCount(Math.max(1, batchCount - 1)); }}
                         className="w-6 h-full flex items-center justify-center transition-colors"
                         style={{ color: isLightCanvas ? '#6e6e73' : '#a1a1aa' }}
                         title="减少"
                       >
                         <Icons.Minus size={10} />
                       </button>
                       <span className="w-5 text-center text-[10px] font-bold" style={{ color: isLightCanvas ? '#1d1d1f' : '#d4d4d8' }}>{batchCount}</span>
                       <button
                         onClick={(e) => { e.stopPropagation(); setBatchCount(Math.min(9, batchCount + 1)); }}
                         className="w-6 h-full flex items-center justify-center transition-colors"
                         style={{ color: isLightCanvas ? '#6e6e73' : '#a1a1aa' }}
                         title="增加"
                       >
                         <Icons.Plus size={10} />
                       </button>
                     </div>
                   )}
                   <button 
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isRunning) {
                              onStop(node.id);
                          } else if (node.status !== 'running') {
                              onExecute(node.id, batchCount);
                          }
                      }}
                      disabled={!isRunning && node.status === 'running'}
                      className={`h-8 px-2.5 border shadow-lg transition-colors flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed
                          ${['image', 'edit', 'bp', 'idea', 'remove-bg', 'upscale', 'video', 'rh-config', 'rh-magic'].includes(node.type) && !isRunning ? 'rounded-r-lg' : 'rounded-lg'}
                          ${isRunning ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' : ''}
                      `}
                      style={!isRunning ? {
                        backgroundColor: isLightCanvas ? '#ffffff' : '#2c2c2e',
                        borderColor: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        color: '#22c55e'
                      } : undefined}
                   >
                      {isRunning ? <Icons.Stop size={12} fill="currentColor" /> : <Icons.Play size={12} fill="currentColor" />}
                      {isRunning ? 'Stop' : 'Run'}
                   </button>
                 </div>
             )}

            {/* Download Button */}
            {(node.content) && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDownload(node.id); }}
                    className="h-8 w-8 rounded-lg transition-colors border shadow-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: isLightCanvas ? '#ffffff' : '#2c2c2e',
                      borderColor: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                      color: isLightCanvas ? '#6e6e73' : '#d4d4d8'
                    }}
                    title="Download Output"
                >
                    <Icons.Download size={14} />
                </button>
            )}

            {/* Close Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                className="h-8 w-8 rounded-lg transition-colors border shadow-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300"
                style={{ 
                  backgroundColor: isLightCanvas ? '#ffffff' : '#2c2c2e',
                  borderColor: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                }}
            >
                <Icons.Close size={14} />
            </button>
        </div>
      )}
    </div>
  );
};

export default CanvasNodeItem;
