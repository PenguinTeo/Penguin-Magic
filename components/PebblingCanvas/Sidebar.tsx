
import React, { useState } from 'react';
import { Icons } from './Icons';
import { NodeType, NodeData, CanvasPreset } from '../../types/pebblingTypes';
import { CanvasListItem } from '../../services/api/canvas';

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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onDragStart, onAdd, userPresets, onAddPreset, onDeletePreset, onHome, onOpenSettings, isApiConfigured,
  canvasList, currentCanvasId, canvasName, isCanvasLoading, onCreateCanvas, onLoadCanvas, onDeleteCanvas
}) => {
  const [activeLibrary, setActiveLibrary] = useState(false);
  const [showCanvasPanel, setShowCanvasPanel] = useState(false);

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

        {/* Settings Button */}
        <button 
            onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-sm pointer-events-auto select-none hover:bg-white/10 transition-colors active:scale-95 ${
                isApiConfigured 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-red-500/20 border-red-500/30 animate-pulse'
            }`}
            title={isApiConfigured ? "API 设置" : "请配置 API Key"}
        >
            <Icons.Settings className={`w-5 h-5 ${isApiConfigured ? 'text-white' : 'text-red-400'}`} />
        </button>

        {/* Main Dock */}
        <div 
            className="bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl pointer-events-auto items-center"
            onMouseDown={(e) => e.stopPropagation()} // Stop propagation to canvas
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
                className="fixed left-24 top-1/2 -translate-y-1/2 z-30 w-72 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-left-4 fade-in duration-300 pointer-events-auto"
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
                    <div className="text-sm text-white font-medium truncate">
                        {isCanvasLoading ? '加载中...' : canvasName}
                    </div>
                </div>

                {/* 画布列表 */}
                <div className="max-h-80 overflow-y-auto">
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
        {activeLibrary && (
            <div 
                className="fixed left-24 top-1/2 -translate-y-1/2 z-30 h-[600px] w-72 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in duration-300 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()} // Stop propagation
            >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2"><Icons.Layers size={14} className="text-purple-400"/> Creative Library</h2>
                    <button onClick={() => setActiveLibrary(false)} className="text-zinc-500 hover:text-white"><Icons.Close size={14}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-6">
                    
                    {/* User Presets */}
                    {userPresets.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 px-1 tracking-wider">My Workflows</h3>
                            <div className="space-y-2">
                                {userPresets.map((preset) => (
                                    <div key={preset.id} className="group relative">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddPreset(preset.id);
                                                setActiveLibrary(false);
                                            }}
                                            className="w-full text-left p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="font-bold text-xs text-white">{preset.title}</div>
                                                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">{preset.nodes.length} Nodes</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{preset.description || "No description"}</div>
                                            
                                            {/* Inputs Badge */}
                                            {preset.inputs.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {preset.inputs.map((inp, i) => (
                                                        <span key={i} className="text-[9px] text-zinc-500 bg-black/20 px-1 rounded border border-white/5">{inp.label}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2c2c2e] text-zinc-400 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 hover:border-red-500/30"
                                        >
                                            <Icons.Close size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Default Presets */}
                    <div>
                         <h3 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 px-1 tracking-wider">Basic Presets</h3>
                         <div className="space-y-2">
                            {defaultPresets.map((preset, i) => (
                                <button 
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAdd(preset.type, preset.data, preset.title);
                                        setActiveLibrary(false);
                                    }}
                                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                >
                                    <div className="font-bold text-xs text-zinc-200 group-hover:text-white mb-1">{preset.title}</div>
                                    <div className="text-[10px] text-zinc-500 leading-relaxed">{preset.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

const DraggableButton = ({ type, icon, label, onDragStart, onClick }: { type: NodeType, icon: React.ReactNode, label: string, onDragStart: (t: NodeType) => void, onClick: () => void }) => {
    return (
        <div 
            draggable 
            onDragStart={(e) => {
                e.dataTransfer.setData('nodeType', type);
                onDragStart(type);
            }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="group relative cursor-grab active:cursor-grabbing"
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
