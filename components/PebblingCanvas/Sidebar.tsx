
import React, { useState } from 'react';
import { Icons } from './Icons';
import { NodeType, NodeData, CanvasPreset } from '../../types/pebblingTypes';
import { CanvasListItem } from '../../services/api/canvas';
import { CreativeIdea } from '../../types';

interface SidebarProps {
    onDragStart: (type: NodeType) => void;
    onAdd: (type: NodeType, data?: NodeData, title?: string) => void;
    userPresets: CanvasPreset[];
    onAddPreset: (presetId: string) => void;
    onDeletePreset: (presetId: string) => void;
    onHome: () => void;
    onOpenSettings: () => void;
    isApiConfigured: boolean;
    // 画布管理
    canvasList: CanvasListItem[];
    currentCanvasId: string | null;
    canvasName: string;
    isCanvasLoading: boolean;
    onCreateCanvas: () => void;
    onLoadCanvas: (id: string) => void;
    onDeleteCanvas: (id: string) => void;
    onRenameCanvas: (newName: string) => void;
    // 创意库
    creativeIdeas?: CreativeIdea[];
    onApplyCreativeIdea?: (idea: CreativeIdea) => void;
    // 手动保存
    onManualSave?: () => void;
    autoSaveEnabled?: boolean;
    hasUnsavedChanges?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onDragStart, onAdd, userPresets, onAddPreset, onDeletePreset, onHome, onOpenSettings, isApiConfigured,
  canvasList, currentCanvasId, canvasName, isCanvasLoading, onCreateCanvas, onLoadCanvas, onDeleteCanvas, onRenameCanvas,
  creativeIdeas = [], onApplyCreativeIdea, onManualSave, autoSaveEnabled = false, hasUnsavedChanges = false
}) => {
  const [activeLibrary, setActiveLibrary] = useState(false);
  const [showCanvasPanel, setShowCanvasPanel] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'bp' | 'workflow' | 'favorite'>('all');
  const [hoveredIdeaId, setHoveredIdeaId] = useState<number | null>(null);

  // Default Presets
  const defaultPresets = [
      {
          id: 'p1',
          title: "Vision: Describe Image",
          description: "Reverse engineer an image into a prompt.",
          type: 'llm' as NodeType,
          data: { systemInstruction: "You are an expert computer vision assistant. Describe the input image in extreme detail, focusing on style, lighting, composition, and subjects." }
      },
      {
          id: 'p2',
          title: "Text Refiner",
          description: "Rewrite text to be professional and concise.",
          type: 'llm' as NodeType,
          data: { systemInstruction: "You are a professional editor. Rewrite the following user text to be more concise, professional, and impactful. Maintain the original meaning." }
      },
      {
          id: 'p3',
          title: "Story Expander",
          description: "Turn a simple sentence into a paragraph.",
          type: 'llm' as NodeType,
          data: { systemInstruction: "You are a creative writer. Take the user's short input and expand it into a vivid, descriptive paragraph suitable for a novel." }
      }
  ];

  return (
    <>
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 pointer-events-none">
        
        {/* 画布管理按钮 */}
        <button 
            onClick={(e) => { e.stopPropagation(); setShowCanvasPanel(!showCanvasPanel); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-sm pointer-events-auto select-none transition-all active:scale-95 ${
              showCanvasPanel ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
            title={isCanvasLoading ? '加载中...' : canvasName}
        >
            <Icons.Layout className="w-5 h-5" />
        </button>

        {/* 手动保存按钮 */}
        {onManualSave && (
            <button 
                onClick={(e) => { e.stopPropagation(); onManualSave(); }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-sm pointer-events-auto select-none transition-all active:scale-95 relative ${
                    hasUnsavedChanges
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-300 animate-pulse'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
                title={hasUnsavedChanges ? "有未保存的修改，点击保存" : "保存画布"}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {hasUnsavedChanges && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-[#1c1c1e]" />
                )}
            </button>
        )}

        {/* Main Dock */}
        <div 
            className="bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl pointer-events-auto items-center"
            onMouseDown={(e) => {
                // 只在点击在 dock 背景上时阻止传播，不阻止拖拽事件
                if (e.target === e.currentTarget) {
                    e.stopPropagation();
                }
            }}
        >
            
            {/* Library Toggle */}
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveLibrary(!activeLibrary); }}
                className={`p-2.5 rounded-xl transition-all shadow-inner border flex items-center justify-center mb-1
                    ${activeLibrary ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-white/5 text-zinc-400 border-transparent hover:text-white hover:bg-white/15'}
                `}
                title="Creative Library"
            >
                <Icons.Layers size={18} />
            </button>

            <div className="w-8 h-px bg-white/10 my-1" />

            {/* Media Group */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Media</span>
                <DraggableButton type="image" icon={<Icons.Image />} label="Image" onDragStart={onDragStart} onClick={() => onAdd('image')} />
                <DraggableButton type="text" icon={<Icons.Type />} label="Text" onDragStart={onDragStart} onClick={() => onAdd('text')} />
                <DraggableButton type="video" icon={<Icons.Video />} label="Video" onDragStart={onDragStart} onClick={() => onAdd('video')} />
            </div>
            
            <div className="w-8 h-px bg-white/10 my-1" />
            
            {/* Logic Group */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Logic</span>
                <DraggableButton type="llm" icon={<Icons.Sparkles />} label="LLM / Vision" onDragStart={onDragStart} onClick={() => onAdd('llm')} />
                <DraggableButton type="idea" icon={<Icons.Magic />} label="Idea Gen" onDragStart={onDragStart} onClick={() => onAdd('idea')} />
                <DraggableButton type="relay" icon={<Icons.Relay />} label="Relay" onDragStart={onDragStart} onClick={() => onAdd('relay')} />
            </div>

            <div className="w-8 h-px bg-white/10 my-1" />
            
            {/* Tools Group */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-zinc-600 text-center uppercase tracking-wider">Tools</span>
                <DraggableButton type="edit" icon={<Icons.Scissors />} label="Edit / Inpaint" onDragStart={onDragStart} onClick={() => onAdd('edit')} />
                <DraggableButton type="remove-bg" icon={<Icons.Scissors />} label="Remove BG" onDragStart={onDragStart} onClick={() => onAdd('remove-bg')} />
                <DraggableButton type="upscale" icon={<Icons.Upscale />} label="Upscale" onDragStart={onDragStart} onClick={() => onAdd('upscale')} />
                <DraggableButton type="resize" icon={<Icons.Resize />} label="Resize" onDragStart={onDragStart} onClick={() => onAdd('resize')} />
            </div>

        </div>
        </div>

        {/* 画布管理面板 */}
        {showCanvasPanel && (
            <div 
                className="fixed left-24 top-6 z-30 w-72 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-left-4 fade-in duration-300 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icons.Layout size={14} className="text-emerald-400"/>
                        <span className="text-sm font-bold text-white">画布管理</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onCreateCanvas(); }}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                            title="新增画布"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => setShowCanvasPanel(false)} 
                            className="text-zinc-500 hover:text-white"
                        >
                            <Icons.Close size={14}/>
                        </button>
                    </div>
                </div>
                
                {/* 当前画布 */}
                <div className="px-4 py-2 bg-emerald-500/5 border-b border-white/5">
                    <div className="text-[10px] text-zinc-500 mb-1">当前画布</div>
                    {isEditingName ? (
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                                if (editingName.trim() && editingName !== canvasName) {
                                    onRenameCanvas(editingName);
                                }
                                setIsEditingName(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (editingName.trim() && editingName !== canvasName) {
                                        onRenameCanvas(editingName);
                                    }
                                    setIsEditingName(false);
                                } else if (e.key === 'Escape') {
                                    setIsEditingName(false);
                                }
                            }}
                            autoFocus
                            className="w-full bg-white/10 border border-emerald-500/30 rounded px-2 py-1 text-sm text-white outline-none focus:border-emerald-500"
                        />
                    ) : (
                        <div 
                            className="flex items-center gap-2 group cursor-pointer"
                            onClick={() => {
                                setEditingName(canvasName);
                                setIsEditingName(true);
                            }}
                        >
                            <span className="text-sm text-white font-medium truncate flex-1">
                                {isCanvasLoading ? '加载中...' : canvasName}
                            </span>
                            <svg className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* 画布列表 */}
                <div className="max-h-80 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                    {canvasList.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-sm">暂无画布</div>
                    ) : (
                        canvasList
                            .sort((a, b) => b.updatedAt - a.updatedAt)
                            .map(canvas => (
                                <div
                                    key={canvas.id}
                                    className={`px-4 py-2.5 flex items-center justify-between group hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 ${
                                        canvas.id === currentCanvasId ? 'bg-emerald-500/10' : ''
                                    }`}
                                    onClick={() => {
                                        if (canvas.id !== currentCanvasId) {
                                            onLoadCanvas(canvas.id);
                                            setShowCanvasPanel(false);
                                        }
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-zinc-200 truncate flex items-center gap-2">
                                            {canvas.name}
                                            {canvas.id === currentCanvasId && (
                                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">当前</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5">
                                            {canvas.nodeCount} 个节点 · {new Date(canvas.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`确定删除画布「${canvas.name}」吗？`)) {
                                                onDeleteCanvas(canvas.id);
                                            }
                                        }}
                                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                                        title="删除画布"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                    )}
                </div>

                {/* 底部操作 */}
                <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onHome(); }}
                        className="w-full py-1.5 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        重置视图
                    </button>
                </div>
            </div>
        )}

        {/* Library Drawer */}
        {activeLibrary && ((() => {
            // 筛选创意库
            const filteredIdeas = creativeIdeas.filter(idea => {
                if (libraryFilter === 'all') return true;
                if (libraryFilter === 'favorite') return idea.isFavorite;
                if (libraryFilter === 'bp') return idea.isBP;
                if (libraryFilter === 'workflow') return idea.isWorkflow;
                return true;
            });
            
            return (
            <div 
                className="fixed left-24 top-1/2 -translate-y-1/2 z-30 h-[600px] w-80 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-left-4 fade-in duration-300 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Icons.Layers size={14} className="text-purple-400"/> 
                        创意库
                        <span className="text-[10px] text-zinc-500 font-normal">({creativeIdeas.length})</span>
                    </h2>
                    <button onClick={() => setActiveLibrary(false)} className="text-zinc-500 hover:text-white"><Icons.Close size={14}/></button>
                </div>
                
                {/* 筛选按钮 */}
                <div className="flex gap-1 flex-wrap">
                    {[
                        { key: 'all', label: '全部' },
                        { key: 'favorite', label: '⭐' },
                        { key: 'bp', label: 'BP' },
                        { key: 'workflow', label: '📊' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setLibraryFilter(key as typeof libraryFilter)}
                            className={`px-2 py-1 text-[10px] rounded-lg transition-all ${
                                libraryFilter === key 
                                    ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50' 
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                
                {/* 创意列表 */}
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-2" onWheel={(e) => e.stopPropagation()}>
                    {filteredIdeas.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-xs">
                            暂无创意
                        </div>
                    ) : (
                        filteredIdeas.map((idea) => (
                            <div 
                                key={idea.id} 
                                className="group relative"
                                onMouseEnter={() => setHoveredIdeaId(idea.id)}
                                onMouseLeave={() => setHoveredIdeaId(null)}
                            >
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApplyCreativeIdea?.(idea);
                                        setActiveLibrary(false);
                                    }}
                                    className={`w-full text-left p-2 rounded-xl border transition-all ${
                                        idea.isWorkflow 
                                            ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40'
                                            : idea.isBP
                                            ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex gap-2">
                                        {/* 预览图 */}
                                        {idea.imageUrl && (
                                            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-black/20">
                                                <img src={idea.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {/* 标题行 */}
                                            <div className="flex items-center justify-between mb-0.5">
                                                <div className="font-bold text-xs text-white truncate flex-1 mr-2">
                                                    {idea.isFavorite && <span className="mr-1">⭐</span>}
                                                    {idea.title}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {idea.isWorkflow && (
                                                        <span className="text-[8px] bg-purple-500/30 text-purple-200 px-1 py-0.5 rounded">工作流</span>
                                                    )}
                                                    {idea.isBP && (
                                                        <span className="text-[8px] bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded">BP</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* 描述/提示词预览 */}
                                            <div className="text-[9px] text-zinc-400 leading-relaxed line-clamp-2">
                                                {idea.isBP && idea.bpFields ? (
                                                    <span className="text-zinc-500">
                                                        输入: {idea.bpFields.map(f => f.label).join(', ')}
                                                    </span>
                                                ) : idea.isWorkflow && idea.workflowNodes ? (
                                                    <span className="text-zinc-500">
                                                        {idea.workflowNodes.length} 个节点
                                                    </span>
                                                ) : (
                                                    idea.prompt.slice(0, 50) + (idea.prompt.length > 50 ? '...' : '')
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                
                                {/* Hover 详情 */}
                                {hoveredIdeaId === idea.id && (
                                    <div className="absolute left-full top-0 ml-2 w-64 bg-[#1c1c1e] border border-white/10 rounded-xl p-3 shadow-2xl z-50 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150">
                                        {/* 缩略图 */}
                                        {idea.imageUrl && (
                                            <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-black/20">
                                                <img src={idea.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="text-xs font-bold text-white mb-1">{idea.title}</div>
                                        {idea.isBP && idea.bpFields ? (
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-zinc-500">输入字段:</div>
                                                {idea.bpFields.map((field, i) => (
                                                    <div key={i} className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                                                        {field.label}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : idea.isWorkflow && idea.workflowInputs ? (
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-zinc-500">工作流输入:</div>
                                                {idea.workflowInputs.map((input, i) => (
                                                    <div key={i} className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                                                        {input.label}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-zinc-400 leading-relaxed max-h-32 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                                                {idea.prompt}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                {/* 底部快捷预设 */}
                {userPresets.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                        <h3 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 tracking-wider">画布预设</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                            {userPresets.slice(0, 3).map((preset) => (
                                <button 
                                    key={preset.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddPreset(preset.id);
                                        setActiveLibrary(false);
                                    }}
                                    className="w-full text-left p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs"
                                >
                                    <span className="text-emerald-200">{preset.title}</span>
                                    <span className="text-[9px] text-zinc-500 ml-2">({preset.nodes.length} 节点)</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            );
        })())}
    </>
  );
};

const DraggableButton = ({ type, icon, label, onDragStart, onClick }: { type: NodeType, icon: React.ReactNode, label: string, onDragStart: (t: NodeType) => void, onClick: () => void }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const startPosRef = React.useRef({ x: 0, y: 0 });
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startPosRef.current = { x: e.clientX, y: e.clientY };
        
        const handleMouseMove = (moveE: MouseEvent) => {
            const dx = moveE.clientX - startPosRef.current.x;
            const dy = moveE.clientY - startPosRef.current.y;
            // 移动超过 5px 才算拖拽
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                if (!isDragging) {
                    setIsDragging(true);
                    console.log('[Sidebar] Mouse drag start:', type);
                    (window as any).__draggingNodeType = type;
                    (window as any).__dragMousePos = { x: moveE.clientX, y: moveE.clientY };
                }
                (window as any).__dragMousePos = { x: moveE.clientX, y: moveE.clientY };
            }
        };
        
        const handleMouseUp = (upE: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            const dx = upE.clientX - startPosRef.current.x;
            const dy = upE.clientY - startPosRef.current.y;
            
            if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5) {
                // 没有移动，算点击
                onClick();
            } else {
                // 拖拽结束，触发全局事件
                console.log('[Sidebar] Mouse drag end at:', upE.clientX, upE.clientY);
                (window as any).__dragMousePos = { x: upE.clientX, y: upE.clientY };
                // 触发自定义事件
                window.dispatchEvent(new CustomEvent('sidebar-drag-end', { 
                    detail: { type, x: upE.clientX, y: upE.clientY } 
                }));
            }
            
            setIsDragging(false);
            (window as any).__draggingNodeType = null;
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    
    return (
        <div
            onMouseDown={handleMouseDown}
            className="group relative cursor-grab active:cursor-grabbing select-none"
        >
            <div className="w-8 h-8 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/15 hover:scale-105 transition-all shadow-inner border border-transparent hover:border-white/10 active:scale-95 flex items-center justify-center">
                 {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-[#1c1c1e] border border-white/10 rounded text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-lg translate-x-[-5px] group-hover:translate-x-0">
                {label}
            </div>
        </div>
    )
}

export default Sidebar;
