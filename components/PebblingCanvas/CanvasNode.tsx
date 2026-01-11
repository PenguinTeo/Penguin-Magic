
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { CanvasNode, NodeType, getNodeTypeColor } from '../../types/pebblingTypes';
import { Icons } from './Icons';
import { ChevronDown } from 'lucide-react';

// 动态导入 3D 组件以避免影响初始加载
const MultiAngle3D = lazy(() => import('./MultiAngle3D'));

interface CanvasNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, updates: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string, count?: number) => void; // count: 批量生成数量
  onStop: (id: string) => void;
  onDownload: (id: string) => void;
  onStartConnection: (nodeId: string, portType: 'in' | 'out', position: { x: number, y: number }) => void;
  onEndConnection: (nodeId: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  scale: number;
  effectiveColor?: string;
  onCreateToolNode?: (sourceNodeId: string, toolType: NodeType, position: { x: number, y: number }) => void;
  hasDownstream?: boolean; // 是否有下游连接
}

const CanvasNodeItem: React.FC<CanvasNodeProps> = ({ 
  node, 
  isSelected, 
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
  hasDownstream = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(node.content);
  const [localPrompt, setLocalPrompt] = useState(node.data?.prompt || '');
  const [localSystem, setLocalSystem] = useState(node.data?.systemInstruction || '');
  const [batchCount, setBatchCount] = useState(1); // 批量生成数量
  
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

  const [isResizing, setIsResizing] = useState(false);
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
    const isImageContent = node.content && (node.content.startsWith('data:image') || (node.content.startsWith('http') && !node.content.includes('.mp4')));
    const isVideoContent = node.content && (node.content.startsWith('data:video') || node.content.includes('.mp4'));
    
    if (isImageContent) {
      const img = new Image();
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
        } else if (node.content.startsWith('http')) {
          // 尝试通过 fetch 获取网络图片大小
          try {
            const response = await fetch(node.content, { method: 'HEAD' });
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
        if (node.content.includes('data:image/png')) format = 'PNG';
        else if (node.content.includes('data:image/jpeg') || node.content.includes('data:image/jpg')) format = 'JPEG';
        else if (node.content.includes('data:image/webp')) format = 'WebP';
        else if (node.content.includes('data:image/gif')) format = 'GIF';
        else if (node.content.startsWith('http')) {
          // 从 URL 推断格式
          if (node.content.includes('.png')) format = 'PNG';
          else if (node.content.includes('.jpg') || node.content.includes('.jpeg')) format = 'JPEG';
          else if (node.content.includes('.webp')) format = 'WebP';
          else if (node.content.includes('.gif')) format = 'GIF';
          else format = 'JPEG'; // 默认网络图片格式
        }
        
        setMediaMetadata({ width, height, size, format });
      };
      img.src = node.content;
    } else if (isVideoContent) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
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
        }
        
        setMediaMetadata({ width, height, size, format: 'MP4', duration });
      };
      video.src = node.content;
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
                  onUpdate(node.id, { content: ev.target.result as string });
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

  // Modern Input Style
  const inputBaseClass = "w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed placeholder-zinc-600";

  // 黑白风格 - 所有节点统一使用灰白色
  const getTypeColor = (type: NodeType) => {
      return 'bg-white/80 border-white/60';
  };

  const outputPortColor = 'bg-white/80 border-white/60';
  const inputPortColor = 'bg-zinc-600 border-zinc-400 group-hover/port:bg-white';

  const isRelay = node.type === 'relay';
  const isRunning = node.status === 'running';

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
        <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
            {/* Header */}
            <div className="h-8 border-b border-white/10 flex items-center justify-between px-3 bg-white/5">
                <div className="flex items-center gap-2">
                    <Icons.Sparkles size={14} className="text-white/70" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">{node.title || "LLM Logic"}</span>
                </div>
                {hasOutput && (
                    <button
                        onClick={handleCopyContent}
                        className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
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
                {/* System Prompt (Optional) */}
                <div className="flex flex-col gap-1 min-h-[30%]">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase px-1">System Instruction (Optional)</label>
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
                    <label className="text-[9px] font-bold text-zinc-500 uppercase px-1">User Prompt (Optional)</label>
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
            <div className="h-6 bg-black/20 border-t border-white/5 px-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span className={`flex items-center gap-1 ${hasOutput ? 'text-emerald-400' : ''}`}>
                   {hasOutput ? 'COMPLETED' : 'INPUT: AUTO'}
                </span>
                <span className="flex items-center gap-1">
                   OUT: <span className="text-zinc-300">TEXT</span>
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
            <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
                <div className="h-8 border-b border-white/10 flex items-center px-3 gap-2 bg-white/5 shrink-0">
                    <Icons.Resize size={14} className="text-white/70" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">Resized</span>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <img 
                        src={node.content} 
                        alt="Resized" 
                        className="w-full h-full object-contain" 
                        draggable={false}
                        onLoad={handleImageLoad}
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
        <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
            <div className="h-8 border-b border-white/10 flex items-center justify-between px-3 gap-2 bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <Icons.Resize size={14} className="text-white/70" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">Smart Resize</span>
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
                     <div className="relative group/select">
                        <select 
                            value={resizeMode}
                            onChange={(e) => {
                                const newVal = e.target.value as any;
                                setResizeMode(newVal);
                                // IMPORTANT: Pass newVal directly to avoid closure staleness
                                onUpdate(node.id, { 
                                    data: { 
                                        ...node.data, 
                                        resizeMode: newVal,
                                        resizeWidth,
                                        resizeHeight
                                    }
                                });
                            }}
                            className={inputBaseClass + " appearance-none pr-8 cursor-pointer hover:border-blue-500/30"}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <option value="longest">Longest Side</option>
                            <option value="shortest">Shortest Side</option>
                            <option value="width">Fixed Width</option>
                            <option value="height">Fixed Height</option>
                            <option value="exact">Exact (Stretch)</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover/select:text-white transition-colors">
                            <ChevronDown size={14} />
                        </div>
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
        onExecute();
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
            onExecute={onExecute}
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
          
          <div className="rounded bg-black/40 border border-cyan-900/30 px-1.5 py-0.5">
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
            <div className="w-full h-full flex items-center justify-center bg-[#1c1c1e] rounded-full border border-white/20 shadow-lg">
                <Icons.Relay size={16} className="text-white/60" />
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
            <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-blue-500/30 rounded-xl overflow-hidden relative shadow-lg">
                {/* 头部 */}
                <div className="h-8 border-b border-blue-500/20 flex items-center justify-between px-3 bg-blue-500/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Icons.Sparkles size={12} className="text-blue-300" />
                        <span className="text-[10px] font-bold text-blue-200 truncate max-w-[200px]">
                            {bpTemplate?.title || 'BP 模板'}
                        </span>
                    </div>
                    <span className="text-[8px] text-blue-300/60 bg-blue-500/20 px-1.5 py-0.5 rounded">BP</span>
                </div>
                
                {hasImage ? (
                    // 有图片：显示结果
                    <div className="flex-1 relative bg-black">
                        <img 
                            src={node.content} 
                            alt="Result" 
                            className="w-full h-full object-contain" 
                            draggable={false}
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
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500/50 placeholder-zinc-600"
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
                            <div className="flex bg-black/40 rounded-lg p-0.5">
                                {aspectRatios1.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${(settings.aspectRatio || 'AUTO') === r ? 'bg-blue-500/30 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleSettingChange('aspectRatio', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {/* 比例第二行 */}
                            <div className="flex bg-black/40 rounded-lg p-0.5">
                                {aspectRatios2.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${settings.aspectRatio === r ? 'bg-blue-500/30 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => handleSettingChange('aspectRatio', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {/* 分辨率 */}
                            <div className="flex bg-black/40 rounded-lg p-0.5">
                                {resolutions.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${settings.resolution === r ? 'bg-blue-500/30 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                <div className="h-6 bg-black/30 border-t border-white/5 px-3 flex items-center justify-between text-[10px] text-zinc-500">
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

    // Idea节点 - 类似BP的简化版本，包含提示词和设置
    if (node.type === 'idea') {
        const settings = node.data?.settings || {};
        const ideaTitle = node.title || '创意';
        
        return (
            <div className="w-full h-full bg-[#1c1c1e] flex flex-col overflow-hidden border border-blue-500/30 rounded-xl shadow-lg relative">
                {/* 标题栏 - 与BP一致 */}
                <div className="h-8 border-b border-blue-500/20 flex items-center justify-between px-3 bg-blue-500/10 shrink-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icons.Sparkles size={12} className="text-blue-300 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-blue-200 truncate max-w-[200px]">{ideaTitle}</span>
                    </div>
                    <span className="text-[8px] text-blue-300/60 bg-blue-500/20 px-1.5 py-0.5 rounded">IDEA</span>
                </div>
                
                {/* 提示词编辑区 - 固定高度，内容滚动 */}
                <div className="flex-1 p-3 flex flex-col overflow-hidden" onWheel={(e) => e.stopPropagation()}>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium block mb-1.5 flex-shrink-0">提示词</label>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <textarea 
                            className="w-full h-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-blue-500/50 focus:outline-none transition-colors resize-none overflow-y-auto scrollbar-hide"
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
                    <div className="flex bg-black/40 rounded-lg p-0.5">
                        {['AUTO', '1:1', '2:3', '3:2', '3:4', '4:3'].map(ratio => (
                            <button
                                key={ratio}
                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${(settings.aspectRatio || 'AUTO') === ratio ? 'bg-blue-500/30 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                    <div className="flex bg-black/40 rounded-lg p-0.5">
                        {['3:5', '5:3', '9:16', '16:9', '21:9'].map(ratio => (
                            <button
                                key={ratio}
                                className={`flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-all ${settings.aspectRatio === ratio ? 'bg-blue-500/30 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                    <div className="flex bg-black/40 rounded-lg p-0.5">
                        {['1K', '2K', '4K'].map(res => (
                            <button
                                key={res}
                                className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${(settings.resolution || '2K') === res ? 'bg-blue-500/30 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                <div className="h-6 bg-black/30 border-t border-white/5 px-3 flex items-center justify-between text-[10px] text-zinc-500">
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
        <div className={`w-full h-full relative group flex flex-col overflow-hidden rounded-xl ${!hasImage ? 'bg-[#1c1c1e] border-2 border-dashed border-white/10' : 'bg-black'}`}>
           {!hasImage ? (
               // 空状态：显示上传按钮和prompt输入
               <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2">
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <Icons.Image size={18} className="text-zinc-500" />
                   </div>
                   <div className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest text-center">
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
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] text-zinc-300 outline-none resize-none focus:border-blue-500/50 focus:text-white transition-colors placeholder-zinc-600"
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
                
                {/* 工具箱按钮 */}
                <div className="absolute bottom-2 right-2 z-20">
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
                  
                  {/* 工具球 */}
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
           {/* 状态标签 */}
           <div 
             className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md"
             style={{
               backgroundColor: hasImage ? `${nodeColor.primary}40` : 'rgb(39, 39, 42)',
               color: hasImage ? nodeColor.light : 'rgb(113, 113, 122)'
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
        // 检查是否有视频内容
        const hasVideo = node.content && (node.content.startsWith('data:video') || node.content.includes('.mp4'));
        
        // Video settings
        const videoSize = node.data?.videoSize || '1280x720';
        const videoModel = node.data?.videoModel || 'sora-2';
        const videoSeconds = node.data?.videoSeconds || '10';
        const isHD = videoModel === 'sora-2-pro';
        
        const handleVideoSettingChange = (key: string, value: string) => {
            onUpdate(node.id, { data: { ...node.data, [key]: value } });
        };

        // 有视频时显示播放器
        if (hasVideo) {
            return (
                <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
                    <video 
                        src={node.content} 
                        controls
                        loop
                        autoPlay
                        muted
                        className="w-full h-full object-contain" 
                    />
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
                            {mediaMetadata.duration && <div><span className="text-zinc-500">时长:</span> {mediaMetadata.duration}</div>}
                            <div><span className="text-zinc-500">大小:</span> {mediaMetadata.size}</div>
                            <div><span className="text-zinc-500">格式:</span> {mediaMetadata.format}</div>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
            );
        }

        // 无视频时显示配置界面
        return (
            <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
                {/* Header */}
                <div className="h-7 border-b border-white/10 flex items-center justify-between px-3 bg-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Icons.Video size={12} className="text-white/70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Video</span>
                    </div>
                    <span className="text-[7px] text-white/40 uppercase">IMG+TXT → VIDEO</span>
                </div>
                
                {/* Settings */}
                <div className="flex-1 p-2 flex flex-col gap-2">
                    {/* Prompt */}
                    <textarea 
                        className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-[11px] text-zinc-200 outline-none resize-none focus:border-yellow-500/50 placeholder-zinc-600"
                        placeholder="描述视频场景..."
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        onBlur={handleUpdate}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    
                    {/* Settings - Pill Buttons */}
                    <div className="flex flex-col gap-1.5">
                        {/* Row 1: Aspect + Quality */}
                        <div className="flex gap-1.5">
                            {/* Aspect Ratio */}
                            <div className="flex bg-black/40 rounded p-0.5 flex-1">
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
                            <div className="flex bg-black/40 rounded p-0.5 flex-1">
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
                        <div className="flex bg-black/40 rounded p-0.5">
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
                </div>
                
                {isRunning && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-30">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            <span className="text-[10px] text-white/80 font-medium">视频生成中...</span>
                            <span className="text-[8px] text-zinc-500">预计 1-10 分钟</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Workflow Tools (Edit, etc.)
    const isWorkflowNode = ['edit', 'remove-bg', 'upscale'].includes(node.type);
    if (isWorkflowNode) {
        let icon = <Icons.Settings />;
        let label = "Node";

        if (node.type === 'edit') { 
            icon = <Icons.Magic size={14} className="text-white/70" />; label = "Image Edit";
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
                <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
                    <div className="h-8 border-b border-white/10 flex items-center px-3 gap-2 bg-white/5 shrink-0">
                        {icon}
                        <span className="text-xs font-bold uppercase tracking-wider text-white/90">{label}</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        <img 
                            src={node.content} 
                            alt="Output" 
                            className="w-full h-full object-contain" 
                            draggable={false}
                            onLoad={handleImageLoad}
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
                    {isRunning && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            );
        }

        // Edit 节点 - 显示设置界面
        if (node.type === 'edit') {
            return (
                <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
                    <div className="h-7 border-b border-white/10 flex items-center justify-between px-3 bg-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                            {icon}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">{label}</span>
                        </div>
                        <span className="text-[7px] text-white/40 uppercase">IMG IN → OUT</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2">
                        {/* Prompt */}
                        <textarea 
                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-[11px] text-zinc-200 outline-none resize-none focus:border-white/30 placeholder-zinc-600"
                            placeholder="编辑指令..."
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            onBlur={handleUpdate}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                        
                        {/* Settings */}
                        <div className="flex flex-col gap-1">
                            {/* Aspect Ratio Row 1 */}
                            <div className="flex bg-black/40 rounded p-0.5">
                                {aspectRatios1.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-0.5 py-1 text-[7px] font-medium rounded transition-all ${editAspectRatio === r ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleEditSettingChange('aspectRatio', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {/* Aspect Ratio Row 2 */}
                            <div className="flex bg-black/40 rounded p-0.5">
                                {aspectRatios2.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-0.5 py-1 text-[7px] font-medium rounded transition-all ${editAspectRatio === r ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleEditSettingChange('aspectRatio', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            {/* Resolution */}
                            <div className="flex bg-black/40 rounded p-0.5">
                                {resolutions.map(r => (
                                    <button
                                        key={r}
                                        className={`flex-1 px-1 py-1 text-[8px] font-medium rounded transition-all ${editResolution === r ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                        onClick={() => handleEditSettingChange('resolution', r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {isRunning && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                            <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
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
                <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
                    <div className="h-7 border-b border-white/10 flex items-center justify-between px-3 bg-white/5 shrink-0">
                        <div className="flex items-center gap-2">
                            {icon}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Upscale HD</span>
                        </div>
                        <span className="text-[7px] text-white/40 uppercase">IMG → HD</span>
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
                            <div className="flex bg-black/40 rounded p-0.5">
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
                    {isRunning && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                            <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            );
        }

        // No output yet - show input form (remove-bg)
        return (
            <div className="w-full h-full bg-[#1c1c1e] flex flex-col border border-white/20 rounded-xl overflow-hidden relative shadow-lg">
                <div className="h-8 border-b border-white/10 flex items-center px-3 gap-2 bg-white/5">
                    {icon}
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">{label}</span>
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
                {isRunning && (
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
      <div className="w-full h-full bg-[#1c1c1e] flex flex-col rounded-xl overflow-hidden border border-white/20 shadow-lg relative group/text">
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
                {node.type === 'idea' ? 'Idea' : 'Text'}
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
        ${isSelected ? 'ring-2 ring-blue-500/50 z-50' : 'ring-1 ring-white/5 hover:ring-white/20 z-10'}
        ${isSelected && !isRelay ? 'shadow-2xl scale-[1.02]' : ''}
        ${isRunning ? 'ring-2 ring-yellow-500 animate-pulse' : ''}
      `}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.width,
        height: node.height,
        cursor: 'grab',
        backgroundColor: isRelay ? 'transparent' : '#1c1c1e',
        pointerEvents: 'auto'
      }}
      onMouseDown={(e) => {
        // Prevent drag start if clicking interactive elements, BUT allow if it's the text display div
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || isResizing) return;
        
        // Let App.tsx know we are starting a drag
        onDragStart(e, node.id);
      }}
      onDoubleClick={() => setIsEditing(true)}
      onMouseUp={() => onEndConnection(node.id)}
    >
      {/* Ports */}
      <div 
        className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-50 hover:scale-150 transition-all cursor-crosshair flex items-center justify-center border group/port ${inputPortColor}`}
        onMouseDown={(e) => handlePortDown(e, 'in')}
      />
      <div 
        className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-50 hover:scale-150 transition-all cursor-crosshair flex items-center justify-center border ${outputPortColor}`}
        onMouseDown={(e) => handlePortDown(e, 'out')}
      />

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
                    className="p-1.5 rounded-lg border border-white/10 shadow-lg bg-[#2c2c2e] text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                    title="Edit Text (Enter)"
                 >
                    <Icons.Edit size={12} fill="currentColor" />
                 </button>
             )}

             {/* Execute Button with Batch Count */}
             {['image', 'text', 'idea', 'edit', 'video', 'llm', 'remove-bg', 'upscale', 'resize', 'bp'].includes(node.type) && (
                 <div className="flex items-center gap-0.5">
                   {/* 批量数量选择器 - 对图片生成类型节点显示 */}
                   {['image', 'edit', 'bp', 'idea'].includes(node.type) && !isRunning && (
                     <div className="flex items-center h-7 rounded-l-lg border border-r-0 border-white/10 bg-[#2c2c2e] overflow-hidden">
                       <button
                         onClick={(e) => { e.stopPropagation(); setBatchCount(Math.max(1, batchCount - 1)); }}
                         className="w-6 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                         title="减少"
                       >
                         <Icons.Minus size={10} />
                       </button>
                       <span className="w-5 text-center text-[10px] font-bold text-zinc-300">{batchCount}</span>
                       <button
                         onClick={(e) => { e.stopPropagation(); setBatchCount(Math.min(9, batchCount + 1)); }}
                         className="w-6 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                         title="增加"
                       >
                         <Icons.Plus size={10} />
                       </button>
                     </div>
                   )}
                   <button 
                      onClick={(e) => { e.stopPropagation(); isRunning ? onStop(node.id) : onExecute(node.id, batchCount); }}
                      className={`p-1.5 border border-white/10 shadow-lg transition-colors flex items-center gap-1.5 px-2.5 font-bold text-[10px] uppercase tracking-wider
                          ${['image', 'edit', 'bp', 'idea'].includes(node.type) && !isRunning ? 'rounded-r-lg' : 'rounded-lg'}
                          ${isRunning ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30' : 'bg-[#2c2c2e] text-green-400 hover:bg-green-500/20 hover:text-green-300'}
                      `}
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
                    className="bg-[#2c2c2e] text-zinc-300 p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/10 shadow-lg"
                    title="Download Output"
                >
                    <Icons.Download size={14} />
                </button>
            )}

            {/* Close Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                className="bg-[#2c2c2e] text-red-400 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors border border-white/10 shadow-lg"
            >
                <Icons.Close size={14} />
            </button>
        </div>
      )}
    </div>
  );
};

export default CanvasNodeItem;
