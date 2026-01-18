
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { normalizeImageUrl } from './utils/image';
import { GeneratedImageDisplay } from './components/GeneratedImageDisplay';
import { editImageWithGemini, generateCreativePromptFromImage, initializeAiClient, processBPTemplate, setThirdPartyConfig, optimizePrompt } from './services/geminiService';
import CreativeExtractor, { extractCreatives } from './services/creativeExtractor';
import { ApiStatus, GeneratedContent, CreativeIdea, SmartPlusConfig, ThirdPartyApiConfig, GenerationHistory, DesktopItem, DesktopImageItem, DesktopFolderItem, CreativeCategoryType } from './types';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { AddCreativeIdeaModal } from './components/AddCreativeIdeaModal';
import { SettingsModal } from './components/SettingsModal';
import { CreativeLibrary } from './components/CreativeLibrary';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Library as LibraryIcon, Settings as SettingsIcon, Zap as BoltIcon, PlusCircle as PlusCircleIcon, Image as ImageIcon, Lightbulb as LightbulbIcon, AlertTriangle as WarningIcon, Plug as PlugIcon, Gem as DiamondIcon, Sun, Moon, HelpCircle, Home, Database, Maximize2, X, Lock, Edit as EditIcon, Star, Trash2, Clock, Grid3x3, Monitor, Folder, Check, ChevronDown, Minus, Plus } from 'lucide-react';
import { GenerateButton } from './components/GenerateButton';
import { HistoryStrip } from './components/HistoryStrip';
import * as creativeIdeasApi from './services/api/creativeIdeas';
import * as historyApi from './services/api/history';
import * as desktopApi from './services/api/desktop';
import { saveToOutput, saveToInput, downloadRemoteToOutput } from './services/api/files';
import { downloadImage } from './services/export';
import { ThemeProvider, useTheme, SnowfallEffect } from './contexts/ThemeContext';
import { Desktop, createDesktopItemFromHistory, TOP_OFFSET } from './components/Desktop';
import { HistoryDock } from './components/HistoryDock';
import PebblingCanvas from './components/PebblingCanvas';


interface LeftPanelProps {
  files: File[];
  activeFileIndex: number | null;
  onFileSelection: (files: FileList | null) => void;
  onFileRemove: (index: number) => void;
  onFileSelect: (index: number) => void;
  onTriggerUpload: () => void;
  // 设置
  onSettingsClick: () => void;
  // 当前 API 模式状态
  currentApiMode: 'local-thirdparty' | 'local-gemini';
  // 参数与提示词相关 (从RightPanel移入)
  prompt: string;
  setPrompt: (value: string) => void;
  activeSmartTemplate: CreativeIdea | null;
  activeSmartPlusTemplate: CreativeIdea | null;
  activeBPTemplate: CreativeIdea | null;
  bpInputs: Record<string, string>;
  setBpInput: (id: string, value: string) => void;
  smartPlusOverrides: SmartPlusConfig;
  setSmartPlusOverrides: (config: SmartPlusConfig) => void;
  handleGenerateSmartPrompt: () => void;
  canGenerateSmartPrompt: boolean;
  smartPromptGenStatus: ApiStatus;
  onCancelSmartPrompt: () => void;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  imageSize: string;
  setImageSize: (value: string) => void;
  isThirdPartyApiEnabled: boolean;
  onClearTemplate: () => void;
  backendStatus: 'connected' | 'disconnected' | 'checking'; // 后端连接状态
}

interface RightPanelProps {
  // 创意库相关
  creativeIdeas: CreativeIdea[];
  handleUseCreativeIdea: (idea: CreativeIdea) => void;
  setAddIdeaModalOpen: (isOpen: boolean) => void;
  setView: (view: 'editor' | 'local-library' | 'canvas') => void;
  onDeleteIdea: (id: number) => void;
  onEditIdea: (idea: CreativeIdea) => void;
  onToggleFavorite?: (id: number) => void; // 切换收藏状态
  onClearRecentUsage?: (id: number) => void; // 清除使用记录（重置order）
}

interface CanvasProps {
  view: 'editor' | 'local-library' | 'canvas';
  setView: (view: 'editor' | 'local-library' | 'canvas') => void;
  files: File[];
  onUploadClick: () => void;
  creativeIdeas: CreativeIdea[];
  localCreativeIdeas: CreativeIdea[];
  onBack: () => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  onDeleteMultiple?: (ids: number[]) => void; // 批量删除
  onEdit: (idea: CreativeIdea) => void;
  onUse: (idea: CreativeIdea) => void;
  status: ApiStatus;
  error: string | null;
  content: GeneratedContent | null;
  onPreviewClick: (url: string) => void;
    onExportIdeas: () => void;
  onImportIdeas: () => void;
  isImporting?: boolean; // 导入状态
  onImportById?: (idRange: string) => void; // 按ID导入
  isImportingById?: boolean; // 按ID导入状态
  onReorderIdeas: (ideas: CreativeIdea[]) => void;
  onToggleFavorite?: (id: number) => void;
  onUpdateCategory?: (id: number, category: CreativeCategoryType) => Promise<void>; // 更新分类
  onEditAgain?: () => void; // 再次编辑
  onRegenerate?: () => void; // 重新生成
  onDismissResult?: () => void; // 关闭结果浮层
  // 故事系统相关
  prompt?: string;
  imageSize?: string;
  // 历史记录相关
  history: GenerationHistory[];
  onHistorySelect: (item: GenerationHistory) => void;
  onHistoryDelete: (id: number) => void;
  onHistoryClear: () => void;
  // 框面模式相关
  desktopItems: DesktopItem[];
  onDesktopItemsChange: (items: DesktopItem[]) => void;
  onDesktopImageDoubleClick: (item: DesktopImageItem) => void;
  desktopSelectedIds: string[];
  onDesktopSelectionChange: (ids: string[]) => void;
  openFolderId: string | null;
  onFolderOpen: (id: string) => void;
  onFolderClose: () => void;
  openStackId: string | null; // 叠放打开状态
  onStackOpen: (id: string) => void;
  onStackClose: () => void;
  onRenameItem: (id: string, newName: string) => void;
  // 图片操作回调
  onDesktopImagePreview?: (item: DesktopImageItem) => void;
  onDesktopImageEditAgain?: (item: DesktopImageItem) => void;
  onDesktopImageRegenerate?: (item: DesktopImageItem) => void;
  // 拖放文件回调
  onFileDrop?: (files: FileList) => void;
  // 从图片创建创意库
  onCreateCreativeIdea?: (imageUrl: string, prompt?: string, aspectRatio?: string, resolution?: string) => void;
  // 最小化结果状态
  isResultMinimized: boolean;
  setIsResultMinimized: (value: boolean) => void;
  // 画布图片生成回调
  onCanvasImageGenerated?: (imageUrl: string, prompt: string, canvasId?: string, canvasName?: string) => void;
  // 画布创建回调
  onCanvasCreated?: (canvasId: string, canvasName: string) => void;
  // 添加图片到画布
  pendingCanvasImage?: { imageUrl: string; imageName?: string } | null;
  onClearPendingCanvasImage?: () => void;
  onAddToCanvas?: (imageUrl: string, imageName?: string) => void;
  // 画布保存函数引用
  canvasSaveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

// IndexedDB 相关操作已迁移到 services/db/ 目录
// - services/db/creativeIdeasDb.ts: 创意库本地存储
// - services/db/historyDb.ts: 历史记录本地存储


const LeftPanel: React.FC<LeftPanelProps> = ({
  files,
  activeFileIndex,
  onFileSelection,
  onFileRemove,
  onFileSelect,
  onTriggerUpload,
  onSettingsClick,
  currentApiMode,
  // 参数与提示词
  prompt,
  setPrompt,
  activeSmartTemplate,
  activeSmartPlusTemplate,
  activeBPTemplate,
  bpInputs,
  setBpInput,
  smartPlusOverrides,
  setSmartPlusOverrides,
  handleGenerateSmartPrompt,
  canGenerateSmartPrompt,
  smartPromptGenStatus,
  onCancelSmartPrompt,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  isThirdPartyApiEnabled,
  onClearTemplate,
  backendStatus,
}) => {
  const { theme, themeName, setTheme } = useTheme();
  
  // 提示词放大弹窗状态
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const expandedPromptRef = useRef<HTMLTextAreaElement>(null);
  
  // 参数配置折叠状态
  const [isParamsExpanded, setIsParamsExpanded] = useState(true);
  
  // 帮助文档弹窗状态
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // 处理ESC关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPromptExpanded) {
        setIsPromptExpanded(false);
      }
    };
    if (isPromptExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      // 聚焦到放大的输入框
      setTimeout(() => expandedPromptRef.current?.focus(), 100);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPromptExpanded]);
  
  // 明暗切换
  const toggleDarkMode = () => {
    setTheme(themeName === 'light' ? 'dark' : 'light');
  };
  const isDark = themeName !== 'light';
  
  // 根据模式获取显示信息 - 本地版本
  const getModeDisplay = () => {
    switch (currentApiMode) {
      case 'local-thirdparty':
        return {
          icon: <PlugIcon className="w-3 h-3" />,
          text: '贞贞API',
          bgClass: 'modern-badge warning',
        };
      case 'local-gemini':
        return {
          icon: <DiamondIcon className="w-3 h-3" />,
          text: 'Gemini本地',
          bgClass: 'modern-badge success',
        };
    }
  };
  
  const modeDisplay = getModeDisplay();
  
  const hasActiveTemplate = activeSmartTemplate || activeSmartPlusTemplate || activeBPTemplate;
  const activeTemplateName = activeBPTemplate?.title || activeSmartPlusTemplate?.title || activeSmartTemplate?.title;
  const activeTemplate = activeBPTemplate || activeSmartPlusTemplate || activeSmartTemplate;
  const canViewPrompt = activeTemplate?.allowViewPrompt !== false;
  const canEditPrompt = activeTemplate?.allowEditPrompt !== false;
  
  return (
  <aside 
    className="w-[280px] flex-shrink-0 flex flex-col h-full z-20 relative transition-colors duration-300"
    style={{
      background: theme.colors.bgPrimary,
      borderRight: `1px solid ${theme.colors.border}`,
    }}
  >
      {/* 微妙的内发光效果 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.03) 0%, transparent 50%)',
        }}
      />
      
      {/* 顶部导航栏 */}
      <div 
        className="relative px-4 py-3.5 flex items-center justify-between"
        style={{ 
          borderBottom: `1px solid ${theme.colors.border}` 
        }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ring-1"
            style={{
              backgroundColor: isDark ? '#000000' : theme.colors.bgTertiary,
              boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
              ringColor: theme.colors.border
            }}
          >
            <img 
              src={isDark ? "/icons/p-icon-white.svg" : "/icons/p-icon-black.svg"} 
              alt="P" 
              className="w-5 h-5" 
            />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>Penguin UI</h1>
            <p className="text-[9px] font-medium tracking-wide" style={{ color: theme.colors.textMuted }}>PenguinPebbling</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* 明暗切换 */}
          <button
            onClick={toggleDarkMode}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              color: isDark ? '#9ca3af' : '#64748b',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              e.currentTarget.style.color = isDark ? '#fff' : '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = isDark ? '#9ca3af' : '#64748b';
            }}
            title={isDark ? '浅色' : '深色'}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
          {/* 帮助按钮 */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              color: isDark ? '#9ca3af' : '#64748b',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              e.currentTarget.style.color = isDark ? '#fff' : '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = isDark ? '#9ca3af' : '#64748b';
            }}
            title="帮助"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {/* 设置按钮 */}
          <button
            onClick={onSettingsClick}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              color: isDark ? '#9ca3af' : '#64748b',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              e.currentTarget.style.color = isDark ? '#fff' : '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = isDark ? '#9ca3af' : '#64748b';
            }}
            title="设置"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* 本地版模式信息栏 */}
      <div 
        className="relative mx-3 mt-3 p-3 rounded-2xl transition-colors duration-300"
        style={{ 
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.shadow,
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* 本地版图标 - 根据后端状态变色 */}
          <div 
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20 transition-all duration-300 ${
              backendStatus === 'connected' 
                ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                : backendStatus === 'checking'
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 animate-pulse'
                  : 'bg-gradient-to-br from-red-400 to-rose-500'
            }`}
            title={backendStatus === 'connected' ? '后端连接正常' : backendStatus === 'checking' ? '正在检测后端...' : '后端已断开连接'}
          >
            <Home className="w-5 h-5 text-white" />
          </div>
          
          {/* 模式信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: theme.colors.textPrimary }}>
              本地版本
            </p>
            <div 
              className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
              style={{
                background: 'rgba(34,197,94,0.15)',
                color: '#4ade80'
              }}
            >
              <span className="text-[8px]">{modeDisplay.icon}</span>
              <span>{modeDisplay.text}</span>
            </div>
          </div>
          
          {/* 数据本地存储标识 */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
            title="数据存储在本地"
          >
            <Database className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] font-medium text-green-400">本地</span>
          </div>
        </div>
      </div>
      
      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col min-h-0">
        {/* 固定内容区域 - 资源素材 */}
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.colors.textMuted }}>资源素材</h2>
          <ImageUploader 
            files={files}
            activeFileIndex={activeFileIndex}
            onFileChange={onFileSelection}
            onFileRemove={onFileRemove}
            onFileSelect={onFileSelect}
            onTriggerUpload={onTriggerUpload}
          />
        </div>
        
        {/* 模型参数卡片 - 可折叠 */}
        <div 
          className="flex-shrink-0 rounded-2xl mb-4 transition-colors duration-300 overflow-hidden"
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
           {/* 可点击的标题栏 */}
           <button
             onClick={() => setIsParamsExpanded(!isParamsExpanded)}
             className="w-full flex items-center justify-between p-4 transition-colors"
             style={{
               background: 'transparent',
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'transparent';
             }}
           >
             <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/20">
                  <ImageIcon className="w-3 h-3 text-blue-400"/>
                </div>
                <h3 className="text-[11px] font-semibold" style={{ color: theme.colors.textPrimary }}>参数配置</h3>
             </div>
             <ChevronDown 
               className={`w-4 h-4 transition-transform duration-200 ${isParamsExpanded ? 'rotate-180' : ''}`}
               style={{ color: theme.colors.textMuted }}
             />
           </button>
           
           {/* 可折叠内容 */}
           <div className={`transition-all duration-300 ${isParamsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
             <div className="px-4 pb-4 space-y-3">
              {/* 画面比例 */}
              <div>
                  <div className="flex justify-between mb-2">
                       <span className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>画面比例</span>
                       <span className="text-[10px] font-mono font-semibold text-blue-400">{aspectRatio}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                      {['Auto', '1:1', '3:4', '4:3', '9:16', '16:9'].map(ratio => (
                          <button
                              key={ratio}
                              onClick={() => setAspectRatio(ratio)}
                              className={`py-1.5 text-[9px] font-semibold rounded-lg transition-all duration-200 ${
                                  aspectRatio === ratio
                                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                                      : ''
                              }`}
                              style={aspectRatio !== ratio ? {
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                color: isDark ? '#737373' : '#6b7280',
                              } : undefined}
                          >
                              {ratio}
                          </button>
                      ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1 mt-1">
                      {['2:3', '3:2', '4:5', '5:4', '21:9'].map(ratio => (
                          <button
                              key={ratio}
                              onClick={() => setAspectRatio(ratio)}
                              className={`py-1.5 text-[9px] font-semibold rounded-lg transition-all duration-200 ${
                                  aspectRatio === ratio
                                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                                      : ''
                              }`}
                              style={aspectRatio !== ratio ? {
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                color: isDark ? '#737373' : '#6b7280',
                              } : undefined}
                          >
                              {ratio}
                          </button>
                      ))}
                  </div>
              </div>
              
              {/* 分辨率 */}
              <div>
                  <div className="flex justify-between mb-2">
                       <span className="text-[10px] font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>分辨率</span>
                       <span className="text-[10px] font-mono font-semibold text-blue-400">{imageSize}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                       {['1K', '2K', '4K'].map(size => (
                          <button
                              key={size}
                              onClick={() => setImageSize(size)}
                              className={`py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                                  imageSize === size
                                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20'
                                      : `${isDark ? 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06]' : 'bg-black/[0.03] text-gray-500 hover:bg-black/[0.06]'} hover:text-blue-400`
                              }`}
                          >
                              {size}
                          </button>
                      ))}
                  </div>
              </div>
           </div>
           </div>
        </div>
        
        {/* 提示词区域 - 自动扩展到底部 */}
        <div className="flex-1 flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-1.5">
               <h2 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                  {hasActiveTemplate ? '关键词' : '提示词'}
               </h2>
               {/* 放大按钮 - BP模式也支持放大查看 */}
               {canViewPrompt && (
                 <button
                   onClick={() => setIsPromptExpanded(true)}
                   className="w-5 h-5 rounded-md flex items-center justify-center transition-all hover:scale-110"
                   style={{ 
                     color: isDark ? '#6b7280' : '#9ca3af',
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'transparent';
                   }}
                   title="放大查看 (Esc关闭)"
                 >
                   <Maximize2 className="w-3 h-3" />
                 </button>
               )}
             </div>
             <div className="flex items-center gap-1.5">
               {hasActiveTemplate && (
                 <div className="flex items-center gap-1">
                   <span 
                     className="px-2 py-0.5 rounded-md text-[9px] font-semibold"
                     style={{
                       background: activeBPTemplate 
                         ? 'rgba(238,209,109,0.15)'
                         : 'rgba(59,130,246,0.15)',
                       color: activeBPTemplate
                         ? '#eed16d'
                         : '#60a5fa',
                     }}
                   >
                     {activeTemplateName}
                   </span>
                   {/* 作者显示 */}
                   {activeTemplate?.author && (
                     <span 
                       className="text-[9px] font-medium"
                       style={{ color: activeBPTemplate ? '#eed16d' : '#60a5fa' }}
                     >
                       @{activeTemplate.author}
                     </span>
                   )}
                   <button
                     onClick={onClearTemplate}
                     className="w-5 h-5 rounded-md flex items-center justify-center transition-all hover:scale-110"
                     style={{ 
                       color: isDark ? '#6b7280' : '#9ca3af',
                     }}
                     title="卸载 (Esc)"
                   >
                     <X className="w-3 h-3 hover:text-gray-400" />
                   </button>
                 </div>
               )}
               <span 
                 className="px-2 py-0.5 rounded-md text-[9px] font-semibold"
                 style={{
                   background: isThirdPartyApiEnabled ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.12)',
                   color: isThirdPartyApiEnabled ? '#3b82f6' : '#60a5fa'
                 }}
               >
                 {isThirdPartyApiEnabled ? 'Nano' : 'Gemini'}
               </span>
             </div>
          </div>
          
          {activeBPTemplate && (
              <BPModePanel 
                   template={activeBPTemplate}
                   inputs={bpInputs}
                   onInputChange={setBpInput}
              />
          )}

          {canViewPrompt ? (
            <div className="relative group flex-1 flex flex-col">
             <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder={
                   activeBPTemplate
                     ? "生成的提示词显示在这里..."
                     : activeSmartTemplate
                     ? `"${activeSmartTemplate.title}" 关键词...`
                     : activeSmartPlusTemplate
                     ? `场景关键词 (可选)...`
                     : "描述想生成的画面..."
                 }
                 readOnly={!!activeBPTemplate || !canEditPrompt}
                 className={`w-full flex-1 min-h-[100px] p-3 pr-11 rounded-xl resize-none text-[11px] transition-all ${
                     !canEditPrompt ? 'cursor-not-allowed opacity-60' : ''
                 }`}
                 style={{
                   background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                   border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                   color: isDark ? '#fff' : '#0f172a',
                 }}
               />
               <button
                 onClick={smartPromptGenStatus === ApiStatus.Loading ? onCancelSmartPrompt : handleGenerateSmartPrompt}
                 disabled={smartPromptGenStatus !== ApiStatus.Loading && !canGenerateSmartPrompt}
                 className={`absolute top-2 right-2 w-8 h-8 rounded-lg text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center justify-center ring-1 ring-white/20 ${
                     smartPromptGenStatus === ApiStatus.Loading
                     ? 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/30'
                     : activeBPTemplate 
                     ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' 
                     : 'bg-blue-500 shadow-blue-500/30'
                 }`}
                 title={smartPromptGenStatus === ApiStatus.Loading ? "取消" : "生成"}
               >
                   {smartPromptGenStatus === ApiStatus.Loading ? (
                      <X className="w-4 h-4" />
                   ) : (
                     <img src="/icons/penguin-icon-white.svg" alt="Penguin" className="w-4 h-4" />
                   )}
               </button>
            </div>
          ) : (
            <div 
              className="p-3 rounded-xl"
              style={{
                background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.15)' }}
                >
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-400">提示词已加密</span>
              </div>
              <p className="text-[10px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                填写输入框后点击生成即可
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 底部免责声明 - 更简洁 */}
      <div 
        className="mx-3 mb-3 px-3 py-2 rounded-lg text-center"
        style={{ 
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
        }}
      >
        <p className="text-[9px] font-medium flex items-center justify-center gap-1" style={{ color: isDark ? '#4b5563' : '#9ca3af' }}>
          <WarningIcon className="w-3 h-3" />
          AI 内容仅供学习测试
        </p>
      </div>
      
      {/* 提示词放大弹窗 */}
      {isPromptExpanded && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPromptExpanded(false);
          }}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* 弹窗内容 - BP模式和普通模式分开处理 */}
          <div 
            className="relative w-[560px] max-w-[90vw] max-h-[85vh] overflow-y-auto p-4 rounded-2xl shadow-2xl"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(20,20,28,0.98) 0%, rgba(15,15,20,0.99) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.99) 100%)',
              border: activeBPTemplate 
                ? `1px solid rgba(238,209,109,0.3)` 
                : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center ring-1"
                  style={{
                    backgroundColor: activeBPTemplate ? 'rgba(238,209,109,0.2)' : 'rgba(59,130,246,0.2)',
                    ringColor: activeBPTemplate ? 'rgba(238,209,109,0.2)' : 'rgba(59,130,246,0.2)',
                  }}
                >
                  {activeBPTemplate ? (
                    <BoltIcon className="w-3.5 h-3.5" style={{ color: '#eed16d' }} />
                  ) : (
                    <EditIcon className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
                <h3 className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                  {activeBPTemplate 
                    ? `BP 模式 - ${activeBPTemplate.title}` 
                    : activeSmartTemplate || activeSmartPlusTemplate
                    ? (activeSmartTemplate?.title || activeSmartPlusTemplate?.title)
                    : '编辑提示词'}
                </h3>
                {/* 作者显示 - 所有模式 */}
                {(activeBPTemplate?.author || activeSmartTemplate?.author || activeSmartPlusTemplate?.author) && (
                  <span 
                    className="text-xs font-medium"
                    style={{ color: activeBPTemplate ? '#eed16d' : '#3b82f6' }}
                  >
                    @{activeBPTemplate?.author || activeSmartTemplate?.author || activeSmartPlusTemplate?.author}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsPromptExpanded(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-gray-500/20"
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                title="关闭 (Esc)"
              >
                <X className="w-4 h-4 hover:text-gray-400" />
              </button>
            </div>
            
            {/* BP模式：变量配置 + 只读提示词 */}
            {activeBPTemplate ? (
              <>
                {/* BP变量配置区域 - 放大版 */}
                <div 
                  className="p-4 mb-4 rounded-xl"
                  style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(238,209,109,0.12) 0%, rgba(238,209,109,0.06) 100%)'
                      : 'rgba(238,209,109,0.1)',
                    border: `1px solid ${isDark ? 'rgba(238,209,109,0.2)' : 'rgba(238,209,109,0.15)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold" style={{ color: '#eed16d' }}>变量配置</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(238,209,109,0.2)', color: '#eed16d' }}>
                      填写变量后生成提示词
                    </span>
                  </div>
                  
                  {/* 变量输入列表 */}
                  <div className="space-y-4">
                    {(activeBPTemplate.bpFields?.filter(f => f.type === 'input') || []).map(field => (
                      <div key={field.id}>
                        <label 
                          className="text-xs font-medium mb-2 flex justify-between"
                          style={{ color: isDark ? '#d1d5db' : '#4b5563' }}
                        >
                          <span>{field.label}</span>
                          <span className="text-[10px] font-mono" style={{ color: 'rgba(238,209,109,0.7)' }}>/{field.name}</span>
                        </label>
                        <input 
                          type="text"
                          value={bpInputs[field.id] || ''}
                          onChange={(e) => setBpInput(field.id, e.target.value)}
                          className="w-full text-sm p-3 rounded-lg transition-all"
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(238,209,109,0.25)' : 'rgba(238,209,109,0.2)'}`,
                            color: isDark ? '#fff' : '#0f172a',
                          }}
                          placeholder={`输入 ${field.label}...`}
                        />
                      </div>
                    ))}
                    
                    {/* 智能体提示 */}
                    {(activeBPTemplate.bpFields?.filter(f => f.type === 'agent') || []).length > 0 && (
                      <div 
                        className="p-3 rounded-lg text-center"
                        style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                      >
                        <span className="text-[11px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                          🤖 包含 {activeBPTemplate.bpFields?.filter(f => f.type === 'agent').length} 个智能体变量，点击生成时自动处理
                        </span>
                      </div>
                    )}
                    
                    {(activeBPTemplate.bpFields?.filter(f => f.type === 'input') || []).length === 0 && (
                      <p 
                        className="text-xs italic p-3 rounded text-center"
                        style={{ 
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          color: isDark ? '#6b7280' : '#9ca3af',
                        }}
                      >
                        此模板仅含智能体变量，点击生成自动运行
                      </p>
                    )}
                  </div>
                </div>
                
                {/* 生成的提示词预览（只读） */}
                {canViewPrompt && prompt && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>生成的提示词</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#6b7280' : '#9ca3af' }}>
                        只读
                      </span>
                    </div>
                    <div 
                      className="w-full min-h-[120px] max-h-[200px] overflow-y-auto p-4 rounded-xl text-sm leading-relaxed"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                        color: isDark ? '#d1d5db' : '#374151',
                      }}
                    >
                      {prompt || <span style={{ color: isDark ? '#4b5563' : '#9ca3af' }}>填写变量后，点击生成查看结果</span>}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 普通模式：可编辑的提示词输入框 */
              <textarea
                ref={expandedPromptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述想生成的画面..."
                className="w-full h-[300px] p-4 rounded-xl resize-none text-sm leading-relaxed"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  color: isDark ? '#fff' : '#0f172a',
                }}
              />
            )}
            
            {/* 底部提示 */}
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px]" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                按 Esc 或点击外部关闭
              </p>
              <button
                onClick={() => {
                  setIsPromptExpanded(false);
                  // BP模式下，点击完成后自动触发智能体处理（相当于点击企鹅按钮）
                  if (activeBPTemplate && canGenerateSmartPrompt) {
                    handleGenerateSmartPrompt();
                  }
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: activeBPTemplate ? '#eed16d' : '#3b82f6',
                  color: activeBPTemplate ? '#1a1a2e' : '#fff',
                  boxShadow: activeBPTemplate ? '0 10px 25px -5px rgba(238,209,109,0.25)' : '0 10px 25px -5px rgba(59,130,246,0.25)',
                }}
              >
                {activeBPTemplate ? '完成并生成提示词' : '完成'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 帮助文档弹窗 */}
      {isHelpOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHelpOpen(false);
          }}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* 弹窗内容 */}
          <div 
            className="relative w-[520px] max-w-[90vw] max-h-[80vh] overflow-y-auto p-5 rounded-2xl shadow-2xl"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(20,20,28,0.98) 0%, rgba(15,15,20,0.99) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.99) 100%)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/20">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-base font-bold" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                  使用帮助
                </h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-gray-500/20"
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 帮助内容 */}
            <div className="space-y-4">
              {/* 桌面使用技巧 */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
              >
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                  <span>🖥️</span> 桌面使用技巧
                </h4>
                <ul className="space-y-2 text-[11px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">空格</span>
                    <span>选中图片后按空格键快速预览大图</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">Ctrl+A</span>
                    <span>全选桌面上的所有图片</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">Delete</span>
                    <span>删除选中的图片</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">拖拽</span>
                    <span>拖拽图片可以移动位置，拖到其他图片上可创建叠放</span>
                  </li>
                </ul>
              </div>
              
              {/* 叠放功能 */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
              >
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                  <span>📏</span> 叠放功能
                </h4>
                <ul className="space-y-2 text-[11px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  <li>• 将一张图片拖到另一张上方自动创建叠放</li>
                  <li>• 点击叠放可以展开查看所有图片</li>
                  <li>• 可以将图片从叠放中拖出来</li>
                  <li>• 点击“自动叠放”按钮可将同名前缀的图片自动分组</li>
                </ul>
              </div>
              
              {/* 文件夹功能 */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
              >
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                  <span>📁</span> 文件夹功能
                </h4>
                <ul className="space-y-2 text-[11px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  <li>• 双击文件夹可以打开查看内容</li>
                  <li>• 可以将图片拖入文件夹</li>
                  <li>• 右键文件夹可重命名或删除</li>
                  <li>• 支持直接将系统文件夹拖入桌面导入</li>
                </ul>
              </div>
              
              {/* 快捷操作 */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
              >
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                  <span>⚡</span> 快捷操作
                </h4>
                <ul className="space-y-2 text-[11px]" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  <li>• 双击图片可编辑标题</li>
                  <li>• 按住 Shift 点击可多选图片</li>
                  <li>• 框选可以批量选择图片</li>
                  <li>• 鼠标滚轮可缩放桌面</li>
                </ul>
              </div>
            </div>
            
            {/* 底部 */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <p className="text-[10px] text-center" style={{ color: isDark ? '#4b5563' : '#9ca3af' }}>
                按 Esc 或点击外部关闭
              </p>
            </div>
          </div>
        </div>
      )}
  </aside>
  );
};

const SmartPlusDirector: React.FC<{
    config: SmartPlusConfig;
    onConfigChange: (config: SmartPlusConfig) => void;
    templateConfig?: SmartPlusConfig;
}> = ({ config, onConfigChange, templateConfig }) => {
    const { themeName } = useTheme();
    const isDark = themeName !== 'light';
    
    const handleConfigChange = (
        id: number,
        field: 'enabled' | 'features',
        value: boolean | string
    ) => {
        onConfigChange(
            config.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const visibleComponents = config.filter(component => {
        const templateComponent = templateConfig?.find(t => t.id === component.id);
        return templateComponent?.enabled;
    });

    if (visibleComponents.length === 0) {
        return null;
    }

    return (
        <div 
          className="p-3 rounded-xl"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.04) 100%)'
              : 'rgba(20,184,166,0.06)',
            border: `1px solid ${isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.1)'}`,
          }}
        >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <LightbulbIcon className="w-3 h-3 text-blue-400"/>
              </div>
              <h3 className="text-xs font-semibold" style={{ color: isDark ? '#fff' : '#0f172a' }}>导演模式</h3>
            </div>
            <div className="space-y-3">
            {visibleComponents.map(component => (
                <div key={component.id} className="flex items-start gap-2">
                    <label className="relative inline-flex items-center cursor-pointer pt-0.5" htmlFor={`smart-plus-override-${component.id}`}>
                        <input
                            type="checkbox"
                            id={`smart-plus-override-${component.id}`}
                            className="sr-only peer"
                            checked={component.enabled}
                            onChange={(e) => handleConfigChange(component.id, 'enabled', e.target.checked)}
                        />
                         <div 
                           className="w-7 h-4 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500 transition-colors"
                           style={{ background: isDark ? '#374151' : '#d1d5db' }}
                         ></div>
                    </label>
                    <div className="flex-grow">
                        <label 
                          htmlFor={`smart-plus-override-${component.id}-features`} 
                          className="text-[10px] font-medium mb-1 block"
                          style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                        >
                            {component.label}
                        </label>
                        <textarea
                            id={`smart-plus-override-${component.id}-features`}
                            value={component.features}
                            onChange={(e) => handleConfigChange(component.id, 'features', e.target.value)}
                            className="w-full text-xs p-2 rounded-lg resize-none transition-all"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                              color: isDark ? '#fff' : '#0f172a',
                            }}
                            placeholder={component.enabled ? '描述...' : '自动'}
                            disabled={!component.enabled}
                            rows={2}
                        />
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
};

const BPModePanel: React.FC<{
    template: CreativeIdea;
    inputs: Record<string, string>;
    onInputChange: (id: string, value: string) => void;
}> = ({ template, inputs, onInputChange }) => {
    const { themeName } = useTheme();
    const isDark = themeName !== 'light';
    
    // Only show manual inputs (type === 'input')
    const manualFields = template.bpFields?.filter(f => f.type === 'input') || [];
    const agentFields = template.bpFields?.filter(f => f.type === 'agent') || [];

    if (manualFields.length === 0 && agentFields.length === 0) return null;

    return (
        <div 
          className="p-3 mb-3 rounded-xl"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, rgba(238,209,109,0.12) 0%, rgba(238,209,109,0.06) 100%)'
              : 'rgba(238,209,109,0.1)',
            border: `1px solid ${isDark ? 'rgba(238,209,109,0.2)' : 'rgba(238,209,109,0.15)'}`,
          }}
        >
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(238,209,109,0.25)' }}>
                    <BoltIcon className="w-3 h-3" style={{ color: '#eed16d' }}/>
                  </div>
                  <h3 className="text-xs font-semibold" style={{ color: isDark ? '#fff' : '#0f172a' }}>BP 模式</h3>
                  {/* 作者显示 */}
                  {template.author && (
                    <span 
                      className="text-[10px] font-medium"
                      style={{ color: '#eed16d' }}
                    >
                      @{template.author}
                    </span>
                  )}
                </div>
                {agentFields.length > 0 && (
                  <span 
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-1"
                    style={{
                      background: 'rgba(238,209,109,0.2)',
                      color: '#eed16d',
                    }}
                  >
                    <LightbulbIcon className="w-2.5 h-2.5"/> {agentFields.length}
                  </span>
                )}
             </div>
             
             <div className="space-y-2">
             {manualFields.length > 0 ? manualFields.map(v => (
                 <div key={v.id}>
                     <label 
                       className="text-[10px] font-medium mb-1 flex justify-between"
                       style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                     >
                        <span>{v.label}</span>
                        <span className="text-[9px] font-mono" style={{ color: 'rgba(59,130,246,0.6)' }}>/{v.name}</span>
                     </label>
                     <input 
                        type="text"
                        value={inputs[v.id] || ''}
                        onChange={(e) => onInputChange(v.id, e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg transition-all"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${isDark ? 'rgba(238,209,109,0.25)' : 'rgba(238,209,109,0.2)'}`,
                          color: isDark ? '#fff' : '#0f172a',
                        }}
                        placeholder={`输入 ${v.label}...`}
                     />
                 </div>
             )) : (
                 <p 
                   className="text-[10px] italic p-2 rounded text-center"
                   style={{ 
                     background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                     color: isDark ? '#6b7280' : '#9ca3af',
                   }}
                 >
                   仅含智能体，点击生成自动运行
                 </p>
             )}
             </div>
        </div>
    );
}

const RightPanel: React.FC<RightPanelProps> = ({
  creativeIdeas,
  handleUseCreativeIdea,
  setAddIdeaModalOpen,
  setView,
  onDeleteIdea,
  onEditIdea,
  onToggleFavorite,
  onClearRecentUsage,
}) => {
  const { theme } = useTheme();
  
  // 收藏的创意库
  const favoriteIdeas = creativeIdeas.filter(idea => idea.isFavorite);
  // 最近使用的创意库（按order排序，取前5个）
  const recentIdeas = [...creativeIdeas].sort((a, b) => (b.order || 0) - (a.order || 0)).slice(0, 5);
  
  // 渲染单个创意项 - 改进版本，支持收藏和BP标签
  // showDelete: 是否显示删除按钮
  // showClearRecent: 是否显示清除记录按钮（最近使用列表专用）
  const renderIdeaItem = (idea: CreativeIdea, showFavorite = true, showDelete = true, showClearRecent = false) => (
    <div
      key={idea.id}
      className="group liquid-card p-2 hover:border-blue-500/30 transition-all cursor-pointer"
      onClick={() => handleUseCreativeIdea(idea)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {idea.imageUrl ? (
            <img src={normalizeImageUrl(idea.imageUrl)} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
          ) : (
            <span className="text-sm flex-shrink-0">✨</span>
          )}
          <span className="text-[11px] font-medium truncate" style={{ color: theme.colors.textPrimary }}>
            {idea.title}
          </span>
          {/* BP标签 - #eed16d */}
          {idea.isBP && (
            <span 
              className="px-1 py-0.5 text-[8px] font-bold rounded flex-shrink-0"
              style={{ backgroundColor: 'rgba(238,209,109,0.25)', color: '#eed16d' }}
            >
              BP
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 收藏按钮 */}
          {showFavorite && onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea.id); }}
              className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                idea.isFavorite 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10'
              }`}
              title={idea.isFavorite ? '取消收藏' : '收藏'}
            >
              <Star className={`w-3 h-3 ${idea.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEditIdea(idea); }}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            title="编辑"
          >
            <EditIcon className="w-3 h-3" />
          </button>
          {showDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteIdea(idea.id); }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="删除创意"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {/* 清除使用记录按钮（最近使用列表专用） */}
          {showClearRecent && onClearRecentUsage && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearRecentUsage(idea.id); }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
              title="清除使用记录"
            >
              <Clock className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderGroup = (title: string, ideas: CreativeIdea[], badge: string, badgeClass: string) => {
    if (ideas.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>{title}</span>
          <span className={`liquid-badge ${badgeClass}`}>{ideas.length}</span>
        </div>
        <div className="space-y-1.5">
          {ideas.slice(0, 5).map(idea => renderIdeaItem(idea))}
          {ideas.length > 5 && (
            <button 
              onClick={() => setView('library')}
              className="w-full py-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              查看全部 {ideas.length} 个...
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
  <aside className="w-[220px] flex-shrink-0 flex flex-col h-full liquid-panel border-l z-20">
     {/* 标题栏 */}
     <div className="liquid-panel-section flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center">
            <Star className="w-3 h-3 text-blue-400 fill-current" />
          </div>
          <h2 className="text-[12px] font-semibold" style={{ color: theme.colors.textPrimary }}>收藏创意</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAddIdeaModalOpen(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-105 press-scale"
            style={{ 
              background: 'var(--glass-bg)',
              color: theme.colors.textSecondary 
            }}
            title="新建创意"
          >
            <PlusCircleIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => setView('local-library')}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-105 press-scale"
            style={{ 
              background: 'var(--glass-bg)',
              color: theme.colors.textSecondary 
            }}
            title="全部创意库"
          >
            <Grid3x3 className="w-3 h-3" />
          </button>
        </div>
     </div>
     
     {/* 内容列表 */}
     <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {/* 最近使用 - 始终在最上方，最多显示3个 */}
        {recentIdeas.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>最近使用</span>
            </div>
            <div className="space-y-1.5">
              {recentIdeas.slice(0, 3).map(idea => renderIdeaItem(idea, true, false, true))}
            </div>
          </div>
        )}
        
        {/* 收藏列表 - 在下方 */}
        {favoriteIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-blue-400 fill-current" />
            </div>
            <p className="text-[11px] font-medium" style={{ color: theme.colors.textPrimary }}>还没有收藏</p>
            <p className="text-[10px] mt-1" style={{ color: theme.colors.textMuted }}>在创意库中点击星标收藏</p>
            <button
              onClick={() => setView('local-library')}
              className="mt-4 px-4 py-2 liquid-btn text-[11px]"
            >
              <LibraryIcon className="w-3.5 h-3.5 mr-1.5" />
              浏览创意库
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>收藏</span>
            </div>
            <div className="space-y-1.5">
              {favoriteIdeas.map(idea => renderIdeaItem(idea, false))}
            </div>
          </div>
        )}
     </div>
     
     {/* 底部统计 */}
     {creativeIdeas.length > 0 && (
       <div className="mx-3 mb-3 px-2.5 py-2 liquid-card">
         <div className="flex items-center justify-between text-[10px]">
           <span style={{ color: theme.colors.textMuted }}>共 {creativeIdeas.length} 个创意</span>
           <button
             onClick={() => setView('local-library')}
             className="text-blue-400 hover:text-blue-300 transition-colors"
           >
             管理全部 →
           </button>
         </div>
       </div>
     )}
  </aside>
);
};

const Canvas: React.FC<CanvasProps> = ({
  view,
  setView,
  files,
  onUploadClick,
  creativeIdeas,
  localCreativeIdeas,
  onBack,
  onAdd,
  onDelete,
  onDeleteMultiple,
  onEdit,
  onUse,
  status,
  error,
  content,
  onPreviewClick,
  onExportIdeas,
  onImportIdeas,
  onImportById,
  onReorderIdeas,
  onEditAgain,
  onRegenerate,
  onDismissResult,
  prompt,
  imageSize,
  history,
  onHistorySelect,
  onHistoryDelete,
  onHistoryClear,
  desktopItems,
  onDesktopItemsChange,
  onDesktopImageDoubleClick,
  desktopSelectedIds,
  onDesktopSelectionChange,
  openFolderId,
  onFolderOpen,
  onFolderClose,
  openStackId,
  onStackOpen,
  onStackClose,
  onRenameItem,
  onDesktopImagePreview,
  onDesktopImageEditAgain,
  onDesktopImageRegenerate,
    onFileDrop,
  onCreateCreativeIdea,
  isResultMinimized,
  setIsResultMinimized,
  onToggleFavorite,
  onUpdateCategory,
  isImporting,
  isImportingById,
  onCanvasImageGenerated,
  onCanvasCreated,
  pendingCanvasImage,
  onClearPendingCanvasImage,
  onAddToCanvas,
  canvasSaveRef,
}) => {
  const { theme, themeName } = useTheme();
  const isDark = themeName !== 'light';
  
  return (
   <main 
     className="flex-1 flex flex-col min-w-0 relative overflow-hidden select-none" 
     style={{ backgroundColor: theme.colors.bgPrimary }}
     onDragStart={(e) => e.preventDefault()}
   >
      {/* 背景效果 - 适配明暗主题 */}
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-gray-950 to-gray-950 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-white to-gray-50/20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),transparent)] pointer-events-none"></div>
        </>
      )}
      
      {/* 顶部切换标签 */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] liquid-tabs">
        <button
          onClick={() => setView('editor')}
          className={`liquid-tab flex items-center gap-1 ${
            view === 'editor' ? 'active' : ''
          }`}
        >
          <Monitor className="w-3 h-3" />
          桌面
        </button>
        <button
          onClick={() => setView('local-library')}
          className={`liquid-tab flex items-center gap-1 ${
            view === 'local-library' ? 'active' : ''
          }`}
        >
          <Folder className="w-3 h-3" />
          本地创意
          {localCreativeIdeas.length > 0 && (
            <span className="px-1 py-0.5 text-[8px] rounded bg-white/20 font-medium">
              {localCreativeIdeas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('canvas')}
          className={`liquid-tab flex items-center gap-1 ${
            view === 'canvas' ? 'active' : ''
          }`}
        >
          <Grid3x3 className="w-3 h-3" />
          画布
        </button>

      </div>
      
      {view === 'local-library' ? (
        /* 创意库全屏显示 - 支持卡片拖拽排序 */
        <div className="absolute inset-0 z-50 pt-12">
          <CreativeLibrary
            ideas={localCreativeIdeas}
            onBack={onBack}
            onAdd={onAdd}
            onDelete={onDelete}
            onDeleteMultiple={onDeleteMultiple}
            onEdit={onEdit}
            onUse={onUse}
            onExport={onExportIdeas}
            onImport={onImportIdeas}
            onImportById={onImportById}
            onReorder={onReorderIdeas}
            onToggleFavorite={onToggleFavorite}
            onUpdateCategory={onUpdateCategory}
            isImporting={isImporting}
            isImportingById={isImportingById}
          />
        </div>
      ) : view === 'canvas' ? (
        /* 画布全屏显示 - 覆盖整个区域，标签栏浮在上方 */
        <div className="absolute inset-0 z-50 overflow-hidden">
          <PebblingCanvas 
            onImageGenerated={onCanvasImageGenerated} 
            onCanvasCreated={onCanvasCreated}
            creativeIdeas={creativeIdeas}
            isActive={view === 'canvas'}
            pendingImageToAdd={pendingCanvasImage}
            onPendingImageAdded={onClearPendingCanvasImage}
            saveRef={canvasSaveRef}
          />
        </div>
      ) : null}
      
      {/* 桌面模式 - 非画布模式时显示 */}
      {view !== 'canvas' && (
      <div className="relative z-10 flex-1 overflow-hidden">
          <Desktop
            items={desktopItems}
            onItemsChange={onDesktopItemsChange}
            onImageDoubleClick={onDesktopImageDoubleClick}
            onFolderDoubleClick={(folder) => onFolderOpen(folder.id)}
            onStackDoubleClick={(stack) => onStackOpen(stack.id)}
            openFolderId={openFolderId}
            onFolderClose={onFolderClose}
            openStackId={openStackId}
            onStackClose={onStackClose}
            selectedIds={desktopSelectedIds}
            onSelectionChange={onDesktopSelectionChange}
            onRenameItem={onRenameItem}
            onImagePreview={onDesktopImagePreview}
            onImageEditAgain={onDesktopImageEditAgain}
            onImageRegenerate={onDesktopImageRegenerate}
            history={history}
            creativeIdeas={creativeIdeas}
            onFileDrop={onFileDrop}
            onCreateCreativeIdea={onCreateCreativeIdea}
            isActive={view !== 'canvas'}
            onAddToCanvas={onAddToCanvas}
          />
          
          {/* 生成结果浮层 - 毛玻璃效果 + 最小化联动 */}
          {(status === ApiStatus.Loading || (status === ApiStatus.Success && content) || (status === ApiStatus.Error && error)) && (
            <>
              {/* 正常展开状态 - 居中显示 */}
              {!isResultMinimized && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 animate-scale-in">
                  <div className="
                    bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90
                    backdrop-blur-xl backdrop-saturate-150
                    rounded-2xl
                    border-2 border-blue-400/50
                    shadow-[0_0_20px_rgba(59,130,246,0.3)]
                    ring-1 ring-blue-500/20
                    overflow-hidden p-5
                  ">
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        {status === ApiStatus.Loading ? (
                          <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : status === ApiStatus.Success ? (
                          <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-blue-300" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-500/30 flex items-center justify-center">
                            <WarningIcon className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {status === ApiStatus.Loading ? 'AI 正在创作中...' : status === ApiStatus.Success ? '作品已完成' : '生成遇到问题'}
                          </h3>
                          <p className="text-xs text-blue-300/70">
                            {status === ApiStatus.Loading ? '请稍等，魔法正在发生' : status === ApiStatus.Success ? '点击图片查看大图' : '请稍后重试'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsResultMinimized(true)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-300 hover:text-white hover:bg-white/10 transition-all"
                          title="收起到按钮旁"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {status !== ApiStatus.Loading && onDismissResult && (
                          <button
                            onClick={onDismissResult}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-300 hover:text-gray-300 hover:bg-gray-500/20 transition-all"
                            title="关闭"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <GeneratedImageDisplay
                      status={status}
                      error={error}
                      content={content}
                      onPreviewClick={onPreviewClick}
                      onEditAgain={onEditAgain}
                      onRegenerate={onRegenerate}
                      prompt={prompt}
                      imageSize={imageSize}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
   </main>
  );
};

export const defaultSmartPlusConfig: SmartPlusConfig = [
    { id: 1, label: 'Product', enabled: true, features: '' },
    { id: 2, label: 'Person', enabled: true, features: '' },
    { id: 3, label: 'Scene', enabled: true, features: '' },
];

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [status, setStatus] = useState<ApiStatus>(ApiStatus.Idle);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const [smartPromptGenStatus, setSmartPromptGenStatus] = useState<ApiStatus>(ApiStatus.Idle);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // 取消 BP/Smart 处理
  const handleCancelSmartPrompt = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setSmartPromptGenStatus(ApiStatus.Idle);
    }
  }, [abortController]);

  const [apiKey, setApiKey] = useState<string>('');
  
  // 创意库状态：本地存储
  const [localCreativeIdeas, setLocalCreativeIdeas] = useState<CreativeIdea[]>([]);
  
  // 本地版本直接使用本地创意库
  const creativeIdeas = useMemo(() => {
    return [...localCreativeIdeas].sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [localCreativeIdeas]);
  
  const [view, setViewInternal] = useState<'editor' | 'local-library' | 'canvas'>('editor'); // 默认桌面模式
  
  // 画布保存函数引用（用于切换TAB和关闭时自动保存）
  const canvasSaveRef = useRef<(() => Promise<void>) | null>(null);
  
  // 包装 setView，在离开画布时自动保存
  const setView = useCallback(async (newView: 'editor' | 'local-library' | 'canvas') => {
    // 如果从画布切换到其他视图，先保存画布
    if (view === 'canvas' && newView !== 'canvas' && canvasSaveRef.current) {
      try {
        await canvasSaveRef.current();
      } catch (e) {
        console.warn('切换TAB时保存画布失败:', e);
      }
    }
    setViewInternal(newView);
  }, [view]);
  const [isAddIdeaModalOpen, setAddIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<CreativeIdea | null>(null);
  const [presetImageForNewIdea, setPresetImageForNewIdea] = useState<string | null>(null); // 从桌面图片创建创意库时的预设图片
  const [presetPromptForNewIdea, setPresetPromptForNewIdea] = useState<string | null>(null); // 预设提示词
  const [presetAspectRatioForNewIdea, setPresetAspectRatioForNewIdea] = useState<string | null>(null); // 预设画面比例
  const [presetResolutionForNewIdea, setPresetResolutionForNewIdea] = useState<string | null>(null); // 预设分辨率
  
  const [activeSmartTemplate, setActiveSmartTemplate] = useState<CreativeIdea | null>(null);
  const [activeSmartPlusTemplate, setActiveSmartPlusTemplate] = useState<CreativeIdea | null>(null);
  const [smartPlusOverrides, setSmartPlusOverrides] = useState<SmartPlusConfig>(() => JSON.parse(JSON.stringify(defaultSmartPlusConfig)));

  // BP Mode States
  const [activeBPTemplate, setActiveBPTemplate] = useState<CreativeIdea | null>(null);
  const [bpInputs, setBpInputs] = useState<Record<string, string>>({});
  
  // 当前使用的创意库（用于获取扣费金额，不论类型）
  const [activeCreativeIdea, setActiveCreativeIdea] = useState<CreativeIdea | null>(null);
  
  // No global polish switch needed for BP anymore, as agents handle intelligence
  // const [bpPolish, setBpPolish] = useState(false); 

  // New State for Model Config
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('2K');
  const [batchCount, setBatchCount] = useState<number>(1); // 批量生成数量（1/2/4张）

  const [autoSave, setAutoSave] = useState(false);
  
  // 贞贞API配置状态
  const [thirdPartyApiConfig, setThirdPartyApiConfig] = useState<ThirdPartyApiConfig>({
    enabled: false,
    baseUrl: '',
    apiKey: '',
    model: 'nano-banana-2'
  });
  
  // 历史记录状态
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  
  // 设置弹窗状态
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  // 桌面状态
  const [desktopItems, setDesktopItems] = useState<DesktopItem[]>([]);
  const [desktopSelectedIds, setDesktopSelectedIds] = useState<string[]>([]);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [openStackId, setOpenStackId] = useState<string | null>(null); // 叠放打开状态
  
  // 待添加到画布的图片（用于桌面->画布联动）
  const [pendingCanvasImage, setPendingCanvasImage] = useState<{ imageUrl: string; imageName?: string } | null>(null);
  
  // 画布ID到桌面文件夹ID的映射（用于画布-桌面联动）
  const [canvasToFolderMap, setCanvasToFolderMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('canvas_folder_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
    const [isResultMinimized, setIsResultMinimized] = useState(false); // 生成结果最小化状态
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [isImporting, setIsImporting] = useState(false); // 导入状态
  const [isImportingById, setIsImportingById] = useState(false); // 按ID导入状态
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking'); // 后端连接状态

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importIdeasInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      initializeAiClient(savedApiKey);
    }
    
    // 加载贞贞API配置
    const savedThirdPartyConfig = localStorage.getItem('third_party_api_config');
    if (savedThirdPartyConfig) {
      try {
        const config = JSON.parse(savedThirdPartyConfig) as ThirdPartyApiConfig;
        // 确保所有必要字段都有默认值（兼容旧版本配置）
        if (!config.baseUrl) {
          config.baseUrl = 'https://ai.t8star.cn';
        }
        if (!config.model) {
          config.model = 'nano-banana-2';
        }
        if (!config.chatModel) {
          config.chatModel = 'gemini-2.5-pro';
        }
        setThirdPartyApiConfig(config);
        setThirdPartyConfig(config);
      } catch (e) {
        console.error('Failed to parse third party API config:', e);
      }
    } else {
      // 默认配置
      const defaultConfig: ThirdPartyApiConfig = {
        enabled: false,
        baseUrl: 'https://ai.t8star.cn',
        apiKey: '',
        model: 'nano-banana-2',
        chatModel: 'gemini-2.5-pro'
      };
      setThirdPartyApiConfig(defaultConfig);
      setThirdPartyConfig(defaultConfig);
    }
    
    // 本地版本：直接从本地加载数据
    loadDataFromLocal();
    
    const savedAutoSave = localStorage.getItem('auto_save_enabled');
    if (savedAutoSave) {
        setAutoSave(JSON.parse(savedAutoSave));
    }
  }, []);
  
  // 后端健康检查 - 定时检测连接状态
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/status', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5秒超时
        });
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (e) {
        setBackendStatus('disconnected');
      }
    };
    
    // 立即检查一次
    checkBackendHealth();
    
    // 每10秒检查一次
    const interval = setInterval(checkBackendHealth, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 关闭窗口/程序时自动保存画布
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 如果当前在画布视图且有保存函数，尝试同步保存
      if (view === 'canvas' && canvasSaveRef.current) {
        // 注意：beforeunload 不支持异步操作，但我们可以尝试触发
        // Electron 会等待一小段时间再关闭，这通常足够完成保存
        canvasSaveRef.current();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [view]);
  
  // 从 Node.js 后端加载数据（纯本地文件，不用浏览器缓存）
  const loadDataFromLocal = async () => {
    setIsLoading(true);
    try {
      const [ideasResult, historyResult, desktopResult] = await Promise.all([
        creativeIdeasApi.getAllCreativeIdeas(),
        historyApi.getAllHistory(),
        desktopApi.getDesktopItems()
      ]);
      
      if (ideasResult.success && ideasResult.data) {
        setLocalCreativeIdeas(ideasResult.data.sort((a, b) => (b.order || 0) - (a.order || 0)));
      } else {
        console.warn('加载创意库失败:', ideasResult.error);
        setLocalCreativeIdeas([]);
      }
      
      let loadedHistory: GenerationHistory[] = [];
      if (historyResult.success && historyResult.data) {
        loadedHistory = historyResult.data.sort((a, b) => b.timestamp - a.timestamp);
        setGenerationHistory(loadedHistory);
      } else {
        console.warn('加载历史记录失败:', historyResult.error);
        setGenerationHistory([]);
      }
      
      // 加载桌面状态，并恢复图片URL，清除卡住的loading状态
      if (desktopResult.success && desktopResult.data) {
        const restoredItems = desktopResult.data.map(item => {
          if (item.type === 'image') {
            const imageItem = item as DesktopImageItem;
            let restored = { ...imageItem };
            
            // 清除卡住的loading状态（重启后不应该还在loading）
            if (imageItem.isLoading) {
              restored.isLoading = false;
              // 如果没有图片URL，标记为加载失败
              if (!imageItem.imageUrl) {
                restored.loadingError = '加载中断，请重新生成';
              }
            }
            
            // 如果 imageUrl 为空且有 historyId，从历史记录恢复
            if ((!restored.imageUrl || restored.imageUrl === '') && restored.historyId) {
              const historyEntry = loadedHistory.find(h => h.id === restored.historyId);
              if (historyEntry) {
                restored.imageUrl = historyEntry.imageUrl;
                restored.loadingError = undefined; // 恢复成功，清除错误
              }
            }
            
            return restored;
          }
          return item;
        });
        setDesktopItems(restoredItems);
      } else {
        console.warn('加载桌面状态失败:', desktopResult.error);
        setDesktopItems([]);
      }
    } catch (e) {
      console.error('Node.js后端未运行，请先启动后端服务', e);
      setLocalCreativeIdeas([]);
      setGenerationHistory([]);
      setDesktopItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = useCallback(async (id: number) => {
    const targetIdea = localCreativeIdeas.find(idea => idea.id === id);
    if (!targetIdea) return;
    
    const updatedIdeas = localCreativeIdeas.map(idea => 
      idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea
    );
    setLocalCreativeIdeas(updatedIdeas);
    
    // 保存到Node.js后端
    try {
      await creativeIdeasApi.updateCreativeIdea(id, { isFavorite: !targetIdea.isFavorite });
    } catch (e) {
      console.error('保存收藏状态失败:', e);
    }
  }, [localCreativeIdeas]);

  // 更新分类
  const handleUpdateCategory = useCallback(async (id: number, category: CreativeCategoryType) => {
    const updatedIdeas = localCreativeIdeas.map(idea => 
      idea.id === id ? { ...idea, category } : idea
    );
    setLocalCreativeIdeas(updatedIdeas);
    
    // 保存到Node.js后端
    try {
      await creativeIdeasApi.updateCreativeIdea(id, { category });
    } catch (e) {
      console.error('保存分类失败:', e);
    }
  }, [localCreativeIdeas]);

  // 清除使用记录（重置order为0，从最近使用列表中移除）
  const handleClearRecentUsage = useCallback(async (id: number) => {
    const targetIdea = localCreativeIdeas.find(idea => idea.id === id);
    if (!targetIdea) return;
    
    const updatedIdeas = localCreativeIdeas.map(idea => 
      idea.id === id ? { ...idea, order: 0 } : idea
    );
    setLocalCreativeIdeas(updatedIdeas);
    
    // 保存到Node.js后端
    try {
      await creativeIdeasApi.updateCreativeIdea(id, { order: 0 });
    } catch (e) {
      console.error('清除使用记录失败:', e);
    }
  }, [localCreativeIdeas]);

  const handleSetPrompt = (value: string) => {
    setPrompt(value);
  };

  const handleFileSelection = useCallback(async (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles).filter(file => file.type.startsWith('image/'));
      
      // 保存每个图片到 input 目录
      for (const file of newFiles) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const imageData = reader.result as string;
            const result = await saveToInput(imageData, file.name);
            if (result.success) {
              console.log('[Input] 图片已保存:', result.data?.filename);
            } else {
              console.warn('[Input] 保存失败:', result.error);
            }
          };
          reader.readAsDataURL(file);
        } catch (e) {
          console.warn('[Input] 保存图片到input目录失败:', e);
        }
      }
      
      setFiles(prevFiles => {
        const wasEmpty = prevFiles.length === 0;
        const updatedFiles = [...prevFiles, ...newFiles];
        if (wasEmpty && updatedFiles.length > 0) {
          setTimeout(() => setActiveFileIndex(0), 0);
        }
        return updatedFiles;
      });
    }
  }, []);

  const handleFileRemove = (indexToRemove: number) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    if (activeFileIndex === indexToRemove) {
      setActiveFileIndex(files.length > 1 ? 0 : null);
    } else if (activeFileIndex !== null && activeFileIndex > indexToRemove) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files);
    if (event.target) {
        event.target.value = '';
    }
  }, [handleFileSelection]);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    initializeAiClient(key);
    setError(null); 
  };
  
  // 处理添加图片到画布
  const handleAddToCanvas = useCallback((imageUrl: string, imageName?: string) => {
    // 设置待添加的图片
    setPendingCanvasImage({ imageUrl, imageName });
    // 切换到画布视图
    setView('canvas');
  }, []);

  // 清除待添加的画布图片（由PebblingCanvas处理完成后调用）
  const handleClearPendingCanvasImage = useCallback(() => {
    setPendingCanvasImage(null);
  }, []);

  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSave(enabled);
    localStorage.setItem('auto_save_enabled', JSON.stringify(enabled));
  };
  
  // 贞贞API配置变更处理
  const handleThirdPartyConfigChange = (config: ThirdPartyApiConfig) => {
    setThirdPartyApiConfig(config);
    setThirdPartyConfig(config);
    localStorage.setItem('third_party_api_config', JSON.stringify(config));
  };
  
  // 历史记录操作
  const handleHistorySelect = async (item: GenerationHistory) => {
    // 从本地路径恢复输入图片
    let restoredFiles: File[] = [];
    if (item.inputImagePaths && item.inputImagePaths.length > 0) {
      try {
        restoredFiles = await Promise.all(item.inputImagePaths.map(async (path) => {
          const response = await fetch(path);
          const blob = await response.blob();
          const filename = path.split('/').pop() || 'restored-input.png';
          return new File([blob], filename, { type: blob.type });
        }));
        setFiles(restoredFiles);
        setActiveFileIndex(0);
      } catch (e) {
        console.warn('从本地路径恢复图片失败:', e);
        setFiles([]);
        setActiveFileIndex(null);
      }
    } else {
      // 没有输入图片，清空文件列表
      setFiles([]);
      setActiveFileIndex(null);
    }
    
    // 恢复创意库设置（用于重新生成）
    setActiveSmartTemplate(null);
    setActiveSmartPlusTemplate(null);
    setActiveBPTemplate(null);
    setActiveCreativeIdea(null);
    setBpInputs({});
    setSmartPlusOverrides(JSON.parse(JSON.stringify(defaultSmartPlusConfig)));
    
    if (item.creativeTemplateType && item.creativeTemplateType !== 'none' && item.creativeTemplateId) {
      const template = creativeIdeas.find(idea => idea.id === item.creativeTemplateId);
      if (template) {
        // 设置当前使用的创意库（用于扣费）
        setActiveCreativeIdea(template);
        
        if (item.creativeTemplateType === 'bp') {
          setActiveBPTemplate(template);
          if (item.bpInputs) {
            setBpInputs(item.bpInputs);
          }
        } else {
          // 非BP模式 = 普通模式模板
          setActiveSmartTemplate(template);
        }
      }
    }
    
    // 设置生成的内容，并保留原始图片引用用于“重新生成”
    setGeneratedContent({ 
      imageUrl: item.imageUrl, 
      text: null,
      originalFiles: restoredFiles 
    });
    setPrompt(item.prompt);
    setStatus(ApiStatus.Success);
    setView('editor'); // 切换到编辑器视图以显示图片
  };
  
  const handleHistoryDelete = async (id: number) => {
    try {
      await historyApi.deleteHistory(id);
      setGenerationHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error('删除历史记录失败:', e);
    }
  };
  
  const handleHistoryClear = async () => {
    if (!confirm('确定要清空所有历史记录吗？')) return;
    try {
      await historyApi.clearAllHistory();
      setGenerationHistory([]);
    } catch (e) {
      console.error('清空历史记录失败:', e);
    }
  };
  
  const saveToHistory = async (
    imageUrl: string, 
    promptText: string, 
    isThirdParty: boolean, 
    inputFiles?: File[], // 修改为数组支持多图
    creativeInfo?: {
      templateId?: number;
      templateType: 'smart' | 'smartPlus' | 'bp' | 'none';
      bpInputs?: Record<string, string>;
      smartPlusOverrides?: SmartPlusConfig;
    }
  ): Promise<{ historyId?: number; localImageUrl: string } | undefined> => {
    // 输入图片保存为本地文件，只存储路径（不再存base64）
    let inputImagePaths: string[] | undefined;
    
    if (inputFiles && inputFiles.length > 0) {
      try {
        // 并行保存所有输入图片到 input 目录
        inputImagePaths = await Promise.all(inputFiles.map(async (file) => {
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          // 保存到input目录
          const saveResult = await saveToInput(data, file.name);
          if (saveResult.success && saveResult.data) {
            return saveResult.data.url; // 返回本地路径
          }
          return ''; // 保存失败返回空
        }));
        // 过滤掉保存失败的
        inputImagePaths = inputImagePaths.filter(p => p);
      } catch (e) {
        console.warn('保存输入图片失败:', e);
      }
    }
    
    const historyId = Date.now();
    
    // 先保存图片到本地output目录，获取本地URL
    let localImageUrl = imageUrl;
    if (imageUrl.startsWith('data:')) {
      // base64 格式，直接保存
      try {
        const saveResult = await saveToOutput(imageUrl);
        if (saveResult.success && saveResult.data) {
          // 使用本地文件URL替代base64
          localImageUrl = saveResult.data.url;
        }
      } catch (e) {
        console.log('保存到output失败，使用base64:', e);
      }
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // 远程 URL（贞贞 API 等返回），通过后端下载保存到本地防止过期（避免CORS问题）
      try {
        const downloadResult = await downloadRemoteToOutput(imageUrl);
        if (downloadResult.success && downloadResult.data) {
          localImageUrl = downloadResult.data.url;
          console.log('远程URL图片已保存到本地:', localImageUrl);
        } else {
          console.warn('后端下载远程图片失败:', downloadResult.error);
        }
      } catch (e) {
        console.log('下载远程图片失败，使用原始URL:', e);
      }
    }
    
    const historyItem: GenerationHistory = {
      id: historyId,
      imageUrl: localImageUrl, // 使用本地URL
      prompt: promptText,
      timestamp: Date.now(),
      model: isThirdParty ? (thirdPartyApiConfig.model || 'nano-banana-2') : 'Gemini 3 Pro',
      isThirdParty,
      // 输入图片使用本地路径，不存base64
      inputImagePaths,
      // 创意库信息
      creativeTemplateId: creativeInfo?.templateId,
      creativeTemplateType: creativeInfo?.templateType || 'none',
      bpInputs: creativeInfo?.bpInputs,
      smartPlusOverrides: creativeInfo?.smartPlusOverrides
    };
    try {
      const { id, ...historyWithoutId } = historyItem;
      const result = await historyApi.createHistory(historyWithoutId as any);
      if (result.success && result.data) {
        setGenerationHistory(prev => [result.data!, ...prev].slice(0, 50));
        return { historyId: result.data.id, localImageUrl };
      }
      console.error('保存历史记录失败:', result.error);
    } catch (e) {
      console.error('保存历史记录失败:', e);
    }
    // 即使保存历史记录失败，也返回本地URL供桌面使用
    return { historyId: undefined, localImageUrl };
  };
  
  // 图片下载逻辑已迁移到 services/export/desktopExporter.ts
  // 使用 downloadImage from './services/export'

  // 导出创意库：将本地图片转换为base64确保跨设备导入时图片不丢失
  const handleExportIdeas = async () => {
    if (creativeIdeas.length === 0) {
        alert("库是空的 / Library is empty.");
        return;
    }
    
    // 转换本地图片为base64
    const convertImageToBase64 = async (url: string): Promise<string> => {
      // 如果已经是base64或外部URL，直接返回
      if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // 本地路径，fetch并转换为base64
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('图片转换失败:', url, e);
        return url; // 转换失败时保留原始路径
      }
    };
    
    try {
      // 显示导出中提示
      const ideasWithBase64 = await Promise.all(
        creativeIdeas.map(async (idea) => ({
          ...idea,
          imageUrl: await convertImageToBase64(idea.imageUrl)
        }))
      );
      
      const dataStr = JSON.stringify(ideasWithBase64, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'creative_library.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出失败:', e);
      alert('导出失败');
    }
  };
  
    const handleImportIdeas = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      // 防止重复导入
      if (isImporting) {
        alert('正在导入中，请稍候...');
        return;
      }
      
      setIsImporting(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result;
              if (typeof content !== 'string') throw new Error("File content is not a string.");
              let parsedData = JSON.parse(content);
              
              // 支持单个对象和数组两种格式
              const ideas = Array.isArray(parsedData) ? parsedData : [parsedData];

                            if (ideas.length > 0 && ideas.every(idea => 'title' in idea && 'prompt' in idea && 'imageUrl' in idea)) {
                  try {
                    const ideasWithoutId = ideas.map(({ id, ...rest }) => rest);
                    const result = await creativeIdeasApi.importCreativeIdeas(ideasWithoutId as any) as any;
                    if (result.success) {
                      await loadDataFromLocal();
                      // 显示后端返回的导入结果（包含跳过重复信息）
                      const msg = result.message || `已导入 ${result.imported || ideas.length} 个创意`;
                      alert(msg);
                    } else {
                      throw new Error(result.error || '导入失败');
                    }
                  } catch (apiError) {
                    console.error('导入失败:', apiError);
                    alert('导入失败');
                  }
              } else {
                  throw new Error("文件格式无效");
              }
          } catch (error) {
              console.error("Failed to import creative ideas:", error);
              alert("导入失败");
          } finally {
              setIsImporting(false);
              if (event.target) {
                  event.target.value = '';
              }
          }
      };
      reader.onerror = () => {
        setIsImporting(false);
        alert('文件读取失败');
      };
      reader.readAsText(file);
  };
  
  const handleImportCreativeById = async (idRange: string) => {
    // 防止重复导入
    if (isImportingById) {
      alert('正在导入中，请稍候...');
      return;
    }
      
    setIsImportingById(true);
      
    try {
      console.log('开始智能导入，ID范围:', idRange);
      
      // 调用后端智能导入API
      const response = await fetch('/api/creative-ideas/smart-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://opennana.com/awesome-prompt-gallery/data/prompts.json',
          idRange: idRange
        })
      });
      
      const result = await response.json();
      console.log('智能导入结果:', result);
      
      if (result.success) {
        await loadDataFromLocal();
        if (result.imported > 0) {
          alert(result.message || `已成功导入 ${result.imported} 个创意`);
        } else {
          alert('未找到符合条件的创意，请检查编号范围是否正确 (例如: 988-985)');
        }
      } else {
        throw new Error(result.error || '导入失败');
      }
    } catch (error) {
      console.error('智能导入失败:', error);
      let errorMessage = '未知错误';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`导入失败: ${errorMessage}`);
    } finally {
      setIsImportingById(false);
    }
  };
  
  const handleSaveCreativeIdea = async (idea: Partial<CreativeIdea>) => {
    console.log('[handleSaveCreativeIdea] 接收到数据:', {
      id: idea.id,
      suggestedAspectRatio: idea.suggestedAspectRatio,
      suggestedResolution: idea.suggestedResolution
    });
    
    try {
      if (idea.id) {
        // 更新现有创意
        const result = await creativeIdeasApi.updateCreativeIdea(idea.id, idea);
        if (!result.success) {
          throw new Error(result.error || '更新失败');
        }
      } else {
        // 创建新创意
        const newOrder = creativeIdeas.length > 0 ? Math.max(...creativeIdeas.map(i => i.order || 0)) + 1 : 1;
        const { id, ...ideaWithoutId } = idea as any;
        const result = await creativeIdeasApi.createCreativeIdea({ ...ideaWithoutId, order: newOrder });
        if (!result.success) {
          throw new Error(result.error || '创建失败');
        }
      }
      // 重新加载数据
      await loadDataFromLocal();
      setAddIdeaModalOpen(false);
      setEditingIdea(null);
    } catch (e) {
      console.error('保存创意失败:', e);
      alert(`保存失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCreativeIdea = async (id: number) => {
    try {
      const result = await creativeIdeasApi.deleteCreativeIdea(id);
      if (!result.success) {
        throw new Error(result.error || '删除失败');
      }
      await loadDataFromLocal();
    } catch (e) {
      console.error('删除创意失败:', e);
      alert(`删除失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };
  
  // 批量删除创意
  const handleDeleteMultipleCreativeIdeas = async (ids: number[]) => {
    try {
      // 逐个删除
      for (const id of ids) {
        const result = await creativeIdeasApi.deleteCreativeIdea(id);
        if (!result.success) {
          console.error(`删除ID ${id} 失败:`, result.error);
        }
      }
      await loadDataFromLocal();
    } catch (e) {
      console.error('批量删除创意失败:', e);
      alert(`删除失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };
  
  const handleStartEditIdea = (idea: CreativeIdea) => {
    setEditingIdea(idea);
    setAddIdeaModalOpen(true);
  };

  const handleAddNewIdea = () => {
    setEditingIdea(null);
    setPresetImageForNewIdea(null);
    setPresetPromptForNewIdea(null);
    setPresetAspectRatioForNewIdea(null);
    setPresetResolutionForNewIdea(null);
    setAddIdeaModalOpen(true);
  };

  // 从桌面图片创建创意库
  const handleCreateCreativeIdeaFromImage = (imageUrl: string, prompt?: string, aspectRatio?: string, resolution?: string) => {
    setEditingIdea(null);
    setPresetImageForNewIdea(imageUrl);
    setPresetPromptForNewIdea(prompt || null);
    setPresetAspectRatioForNewIdea(aspectRatio || null);
    setPresetResolutionForNewIdea(resolution || null);
    setAddIdeaModalOpen(true);
  };

  const handleReorderIdeas = async (reorderedIdeas: CreativeIdea[]) => {
    try {
        const ideasToUpdate = reorderedIdeas.map((idea, index) => ({
            ...idea,
            order: reorderedIdeas.length - index,
        }));
        setLocalCreativeIdeas(ideasToUpdate);
        
        const orderedIds = ideasToUpdate.map(i => i.id);
        await creativeIdeasApi.reorderCreativeIdeas(orderedIds);
    } catch (e) {
        console.error("重新排序失败:", e);
    }
  };


  const handleUseCreativeIdea = (idea: CreativeIdea) => {
    setActiveSmartTemplate(null);
    setActiveSmartPlusTemplate(null);
    setActiveBPTemplate(null);
    
    // 保存当前使用的创意库（用于扣费）
    setActiveCreativeIdea(idea);
    
    // 应用创意库建议的宽高比和分辨率
    if (idea.suggestedAspectRatio) {
      setAspectRatio(idea.suggestedAspectRatio);
    }
    if (idea.suggestedResolution) {
      setImageSize(idea.suggestedResolution);
    }
    
    // Reset BP
    setBpInputs({});

    if (idea.isBP) {
        // BP模式模板
        setActiveBPTemplate(idea);
        setPrompt(''); // BP starts empty, waits for generation/fill
        
        // Initialize inputs for 'input' type fields
        if (idea.bpFields) {
            const initialInputs: Record<string, string> = {};
            idea.bpFields.forEach(v => {
                if (v.type === 'input') {
                    initialInputs[v.id] = '';
                }
            });
            setBpInputs(initialInputs);
        } else if (idea.bpVariables) { 
            // Migration fallback
            const initialInputs: Record<string, string> = {};
            idea.bpVariables.forEach(v => initialInputs[v.id] = '');
            setBpInputs(initialInputs);
        }
    } else {
        // 非BP模式 = 普通模式模板，直接填充提示词
        setActiveSmartTemplate(idea);
        setPrompt(idea.prompt); // 直接填充模板的提示词
    }
    setView('editor');
  };

  const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;

  const handleGenerateSmartPrompt = useCallback(async () => {
    const activeTemplate = activeSmartTemplate || activeSmartPlusTemplate || activeBPTemplate;
    
    // 检查API配置：要么有Gemini Key，要么启用了贞贞API
    const hasValidApi = apiKey || (thirdPartyApiConfig.enabled && thirdPartyApiConfig.apiKey);

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);
    
    setSmartPromptGenStatus(ApiStatus.Loading);
    setError(null);

    try {
      // 无创意库模式 - 纯提示词优化
      if (!activeTemplate) {
        if (!hasValidApi) {
          alert('提示词优化需要配置 API Key（Gemini 或贞贞API）');
          setSmartPromptGenStatus(ApiStatus.Idle);
          return;
        }
        if (!prompt.trim()) {
          alert('请先输入提示词');
          setSmartPromptGenStatus(ApiStatus.Idle);
          return;
        }
        // 调用提示词优化函数
        const optimizedPrompt = await optimizePrompt(prompt);
        setPrompt(optimizedPrompt);
        setSmartPromptGenStatus(ApiStatus.Success);
        setAbortController(null);
        return;
      }

      if (activeBPTemplate) {
          // BP Mode Logic (New Orchestration)
          if (!hasValidApi) {
             alert('BP 模式运行智能体需要配置 API Key（Gemini 或贞贞API）');
             setSmartPromptGenStatus(ApiStatus.Idle);
             return;
          }
          // BP模式支持有图片或无图片，传递 activeFile（可能为 null）
          const finalPrompt = await processBPTemplate(activeFile, activeBPTemplate, bpInputs);
          setPrompt(finalPrompt);

      } else {
          // Standard/Smart Logic (Legacy)
          if (!hasValidApi) {
             alert('智能提示词生成需要配置 API Key（Gemini 或贞贞API）');
             setSmartPromptGenStatus(ApiStatus.Idle);
             return;
          }
          if (!activeFile) {
            alert('请先上传并选择一张图片');
            setSmartPromptGenStatus(ApiStatus.Idle);
            return;
          }
          if (activeSmartTemplate && !prompt.trim()) {
            alert('请输入关键词');
            setSmartPromptGenStatus(ApiStatus.Idle);
            return;
          }
          const newPromptText = await generateCreativePromptFromImage({
              file: activeFile,
              idea: activeTemplate,
              keyword: prompt, 
              smartPlusConfig: activeTemplate.isSmartPlus ? smartPlusOverrides : undefined,
          });
          setPrompt(newPromptText); 
      }
      
      setSmartPromptGenStatus(ApiStatus.Success);
      setAbortController(null); // 清除控制器

    } catch (e: unknown) {
      // 检查是否是用户主动取消
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('BP处理已被用户取消');
        setSmartPromptGenStatus(ApiStatus.Idle);
        setAbortController(null); // 清除控制器
        return;
      }
      
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(errorMessage);
      alert(`智能提示词生成失败: ${errorMessage}`);
      setSmartPromptGenStatus(ApiStatus.Error);
      setAbortController(null); // 清除控制器
    }
  }, [activeFile, prompt, apiKey, thirdPartyApiConfig, activeSmartTemplate, activeSmartPlusTemplate, activeBPTemplate, smartPlusOverrides, bpInputs, abortController]);
  
    // 安全保存桌面项目到后端 API（移除大型 base64 数据）
    const safeDesktopSave = useCallback(async (items: DesktopItem[]) => {
      try {
        // 保存前移除 base64 imageUrl 以节省空间（有 historyId 可恢复）
        const itemsForStorage = items.map(item => {
          if (item.type === 'image') {
            const imageItem = item as DesktopImageItem;
            // 如果 imageUrl 是 base64 且有 historyId，则不存储 imageUrl
            if (imageItem.imageUrl?.startsWith('data:') && imageItem.historyId) {
              const { imageUrl, ...rest } = imageItem;
              return { ...rest, imageUrl: '' }; // 留空标记，加载时从历史恢复
            }
            // 本地文件 URL 保留
            if (imageItem.imageUrl?.startsWith('/files/')) {
              return imageItem;
            }
          }
          return item;
        });
        // 保存到后端 API（本地文件）
        await desktopApi.saveDesktopItems(itemsForStorage);
      } catch (e) {
        console.error('Failed to save desktop items:', e);
      }
    }, []);

    // 桌面操作处理
    const handleDesktopItemsChange = useCallback((items: DesktopItem[]) => {
      setDesktopItems(items);
      safeDesktopSave(items);
    }, [safeDesktopSave]);
  
    // 查找桌面空闲位置
    const findNextFreePosition = useCallback((): { x: number, y: number } => {
      const gridSize = 100;
      const maxCols = 10; // 每行最多10个
      const occupiedPositions = new Set(
        desktopItems
          .filter(item => {
            // 只考虑不在文件夹内的项目
            const isInFolder = desktopItems.some(
              other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(item.id)
            );
            return !isInFolder;
          })
          .map(item => `${Math.round(item.position.x / gridSize)},${Math.round(item.position.y / gridSize)}`)
      );
      
      // 从左上角开始找空位
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < maxCols; x++) {
          const key = `${x},${y}`;
          if (!occupiedPositions.has(key)) {
            return { x: x * gridSize, y: y * gridSize };
          }
        }
      }
      return { x: 0, y: 0 };
    }, [desktopItems]);
  
    const handleAddToDesktop = useCallback((item: DesktopImageItem) => {
      // 添加图片到桌面 - 使用函数式更新确保使用最新状态
      setDesktopItems(prevItems => {
        // 在最新状态上查找空闲位置
        const gridSize = 100;
        const maxCols = 8; // 固定8列
        
        // 位置从0开始（渲染时会自动加上居中偏移）
        const occupiedPositions = new Set(
          prevItems
            .filter(existingItem => {
              const isInFolder = prevItems.some(
                other => other.type === 'folder' && (other as DesktopFolderItem).itemIds.includes(existingItem.id)
              );
              return !isInFolder;
            })
            .map(existingItem => `${Math.round(existingItem.position.x / gridSize)},${Math.round(existingItem.position.y / gridSize)}`)
        );
        
        // 从第0列、第0行开始找空位
        let freePos = { x: 0, y: 0 };
        for (let y = 0; y < 100; y++) {
          for (let x = 0; x < maxCols; x++) {
            const key = `${x},${y}`;
            if (!occupiedPositions.has(key)) {
              freePos = { x: x * gridSize, y: y * gridSize };
              break;
            }
          }
          // 检查是否已找到空位
          const foundKey = `${Math.round(freePos.x / gridSize)},${Math.round(freePos.y / gridSize)}`;
          if (!occupiedPositions.has(foundKey)) break;
        }
        
        // 更新项目位置
        const itemWithPosition = { ...item, position: freePos };
        const newItems = [...prevItems, itemWithPosition];
        // 延迟保存到后端 API
        setTimeout(() => {
          safeDesktopSave(newItems);
        }, 0);
        return newItems;
      });
    }, [safeDesktopSave]);

    // 画布创建时创建对应的桌面文件夹
    const handleCanvasCreated = useCallback((canvasId: string, canvasName: string) => {
      // 检查是否已有对应文件夹
      if (canvasToFolderMap[canvasId]) {
        console.log('[Canvas] 画布已有对应文件夹:', canvasToFolderMap[canvasId]);
        return;
      }
      
      // 创建新的桌面文件夹
      const now = Date.now();
      const folderId = `canvas-folder-${canvasId}-${now}`;
      const newFolder: DesktopFolderItem = {
        id: folderId,
        type: 'folder',
        name: `🎨 ${canvasName}`,
        position: { x: 0, y: 0 }, // 位置将由handleAddToDesktop自动计算
        itemIds: [],
        color: '#3b82f6', // 蓝色标识画布文件夹
        createdAt: now,
        updatedAt: now,
      };
      
      // 添加到桌面
      handleAddToDesktop(newFolder);
      
      // 保存映射关系
      const newMap = { ...canvasToFolderMap, [canvasId]: folderId };
      setCanvasToFolderMap(newMap);
      localStorage.setItem('canvas_folder_map', JSON.stringify(newMap));
      
      console.log('[Canvas] 创建画布文件夹:', canvasName, '->', folderId);
    }, [canvasToFolderMap, handleAddToDesktop]);

    // 画布生成图片同步到桌面（添加到对应画布文件夹）
    const handleCanvasImageGenerated = useCallback(async (imageUrl: string, prompt: string, canvasId?: string, canvasName?: string) => {
      // 先将base64图片保存到本地文件
      let finalImageUrl = imageUrl;
      if (imageUrl.startsWith('data:')) {
        try {
          const result = await saveToOutput(imageUrl, `canvas_${Date.now()}.png`);
          if (result.success && result.data?.url) {
            finalImageUrl = result.data.url; // 使用本地文件URL
            console.log('[Canvas] 图片已保存到:', finalImageUrl);
          }
        } catch (e) {
          console.error('[Canvas] 保存图片失败:', e);
        }
      }
      
      // 创建新的桌面图片项
      const now = Date.now();
      const newImageItem: DesktopImageItem = {
        id: `canvas-img-${now}-${Math.random().toString(36).substring(2, 8)}`,
        type: 'image',
        name: `画布(${prompt.slice(0, 10)}...)`,
        position: { x: 0, y: 0 }, // 位置将由handleAddToDesktop自动计算
        imageUrl: finalImageUrl,
        prompt: prompt,
        createdAt: now,
        updatedAt: now,
      };
      
      // 如果有画布ID，尝试添加到对应文件夹
      const folderId = canvasId ? canvasToFolderMap[canvasId] : undefined;
      
      if (folderId) {
        // 添加图片到桌面
        handleAddToDesktop(newImageItem);
        
        // 将图片添加到画布文件夹
        setDesktopItems(prev => {
          const folder = prev.find(item => item.id === folderId) as DesktopFolderItem | undefined;
          if (folder) {
            const updatedFolder: DesktopFolderItem = {
              ...folder,
              itemIds: [...folder.itemIds, newImageItem.id],
              updatedAt: now,
            };
            const newItems = prev.map(item => item.id === folderId ? updatedFolder : item);
            setTimeout(() => safeDesktopSave(newItems), 0);
            return newItems;
          }
          return prev;
        });
        console.log('[Canvas] 图片已添加到画布文件夹:', canvasName, newImageItem.name);
      } else {
        // 无对应文件夹，直接添加到桌面
        handleAddToDesktop(newImageItem);
        console.log('[Canvas] 图片已同步到桌面:', newImageItem.name);
      }
    }, [handleAddToDesktop, canvasToFolderMap, safeDesktopSave]);

  const handleGenerateClick = useCallback(async () => {
    // 检查API配置
    const hasValidApi = 
      (thirdPartyApiConfig.enabled && thirdPartyApiConfig.apiKey) ||  // 本地贞贞API
      apiKey;  // 本地Gemini
      
    if (!hasValidApi) {
      setError('请先配置 API Key（贞贞API 或 Gemini）');
      setStatus(ApiStatus.Error);
      return;
    }
      
    // 获取当前模板的权限设置
    const activeTemplate = activeBPTemplate || activeSmartPlusTemplate || activeSmartTemplate;
    const canViewPrompt = activeTemplate?.allowViewPrompt !== false;
      
    let finalPrompt = prompt;
      
    // 如果不允许查看提示词，需要先自动生成提示词
    if (!canViewPrompt && activeTemplate) {
      // 并发模式不设置全局 Loading 状态，使用占位项显示进度
      setError(null);
        
      try {
        console.log('[Generate] 不允许查看提示词，自动生成中...');
          
        if (activeBPTemplate) {
          const activeFile = files.length > 0 ? files[0] : null;
          finalPrompt = await processBPTemplate(activeFile, activeBPTemplate, bpInputs);
        } else if (activeSmartPlusTemplate || activeSmartTemplate) {
          const activeFile = files.length > 0 ? files[0] : null;
          if (!activeFile) {
            setError('Smart/Smart+模式需要上传图片');
            setStatus(ApiStatus.Error);
            return;
          }
          finalPrompt = await generateCreativePromptFromImage({
            file: activeFile,
            idea: activeTemplate,
            keyword: prompt,
            smartPlusConfig: activeTemplate.isSmartPlus ? smartPlusOverrides : undefined,
          });
        }
        console.log('[Generate] 提示词已生成，开始生图');
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '提示词生成失败';
        setError(`生成失败: ${errorMessage}`);
        setStatus(ApiStatus.Error);
        return;
      }
    } else {
      if (!prompt) {
        setError('请输入提示词');
        setStatus(ApiStatus.Error);
        return;
      }
      if ((activeSmartTemplate || activeSmartPlusTemplate || activeBPTemplate) && !prompt.trim()) {
        setError(`请先点击企鹅按钮生成/填入提示词`);
        setStatus(ApiStatus.Error);
        return;
      }
    }
      
    // 并发模式不设置全局 Loading 状态，使用占位项显示进度
    setError(null);
    setGeneratedContent(null);
  
    const creativeIdeaCost = activeCreativeIdea?.cost;
    const promptToSave = canViewPrompt ? finalPrompt : '[加密提示词]';
    const activeTemplateTitle = activeBPTemplate?.title || activeSmartPlusTemplate?.title || activeSmartTemplate?.title;
      
    // 计算基础命名
    let baseItemName = '';
    if (activeTemplateTitle) {
      baseItemName = activeTemplateTitle;
    } else {
      baseItemName = finalPrompt.slice(0, 15) + (finalPrompt.length > 15 ? '...' : '');
    }
      
    // 获取创意库类型
    let templateType: 'smart' | 'smartPlus' | 'bp' | 'none' = 'none';
    let templateId: number | undefined;
    if (activeBPTemplate) {
      templateType = 'bp';
      templateId = activeBPTemplate.id;
    } else if (activeSmartPlusTemplate) {
      templateType = 'smartPlus';
      templateId = activeSmartPlusTemplate.id;
    } else if (activeSmartTemplate) {
      templateType = 'smart';
      templateId = activeSmartTemplate.id;
    }
  
    // === 批量并发生成逻辑 ===
    if (batchCount > 1) {
      // 创建 loading 占位项
      const placeholderItems: DesktopImageItem[] = [];
      const existingCount = desktopItems.filter(item => 
        item.type === 'image' && item.name.startsWith(baseItemName)
      ).length;
        
      for (let i = 0; i < batchCount; i++) {
        const freePos = findNextFreePosition();
        const itemName = activeTemplateTitle 
          ? `${activeTemplateTitle}(${existingCount + i + 1})`
          : `${baseItemName} #${i + 1}`;
          
        const placeholderItem: DesktopImageItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i}`,
          type: 'image',
          name: itemName,
          position: { x: freePos.x + i * 100, y: freePos.y }, // 横向排列
          createdAt: Date.now(),
          updatedAt: Date.now(),
          imageUrl: '', // 空的，等待填充
          prompt: promptToSave,
          model: thirdPartyApiConfig.enabled ? 'nano-banana-2' : 'Gemini',
          isThirdParty: thirdPartyApiConfig.enabled,
          isLoading: true, // 标记为加载中
        };
        placeholderItems.push(placeholderItem);
      }
        
      // 添加所有占位项到桌面
      const newItems = [...desktopItems, ...placeholderItems];
      setDesktopItems(newItems);
      await desktopApi.saveDesktopItems(newItems);
        
      // 并发发起所有生成请求
      const generatePromises = placeholderItems.map(async (placeholder, index) => {
        try {
          const result = await editImageWithGemini(files, finalPrompt, { aspectRatio, imageSize }, creativeIdeaCost);
            
          if (result.imageUrl) {
            // 保存到历史记录
            const saveResult = await saveToHistory(result.imageUrl, promptToSave, thirdPartyApiConfig.enabled, files.length > 0 ? files : [], {
              templateId,
              templateType,
              bpInputs: templateType === 'bp' ? { ...bpInputs } : undefined,
              smartPlusOverrides: templateType === 'smartPlus' ? [...smartPlusOverrides] : undefined
            });
              
            const localImageUrl = saveResult?.localImageUrl || result.imageUrl;
            const historyId = saveResult?.historyId;
              
            // 更新桌面项：设置图片URL，清除loading状态，并保存到磁盘
            setDesktopItems(prev => {
              const updatedItems = prev.map(item => 
                item.id === placeholder.id 
                  ? { ...item, imageUrl: localImageUrl, isLoading: false, historyId } as DesktopImageItem
                  : item
              );
              // 立即保存更新后的状态到磁盘，避免数据丢失
              safeDesktopSave(updatedItems);
              return updatedItems;
            });
              
            console.log(`[Batch Generate] #${index + 1} 成功`);
            return { success: true, index };
          }
          throw new Error('API 未返回图片');
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : '生成失败';
          console.error(`[Batch Generate] #${index + 1} 失败:`, errorMessage);
            
          // 更新桌面项：设置错误状态，并保存到磁盘
          setDesktopItems(prev => {
            const updatedItems = prev.map(item => 
              item.id === placeholder.id 
                ? { ...item, isLoading: false, loadingError: errorMessage } as DesktopImageItem
                : item
            );
            // 保存错误状态到磁盘
            safeDesktopSave(updatedItems);
            return updatedItems;
          });
            
          return { success: false, index, error: errorMessage };
        }
      });
        
      // 等待所有请求完成
      const results = await Promise.all(generatePromises);
      const successCount = results.filter(r => r.success).length;
        
      console.log(`[Batch Generate] 完成: ${successCount}/${batchCount} 成功`);
        
      // 批量模式不设置全局状态，避免影响其他正在进行的批次
      // 如果有错误，只在控制台输出
      if (successCount < batchCount) {
        console.warn(`[批量生成] 部分失败: ${successCount}/${batchCount}`);
      }
        
      // 批量生成完成后的日志（单个生成结果已在各自回调中保存）
      console.log('[Batch Generate] 所有任务处理完成，状态已分别保存');
      return;
    }
  
    // === 单张生成逻辑（采用占位项模式，支持并发） ===
    // 先创建占位项
    const freePos = findNextFreePosition();
    const existingCount = desktopItems.filter(item => 
      item.type === 'image' && item.name.startsWith(baseItemName)
    ).length;
    const itemName = activeTemplateTitle 
      ? `${activeTemplateTitle}(${existingCount + 1})`
      : baseItemName;
    
    const placeholderId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const placeholderItem: DesktopImageItem = {
      id: placeholderId,
      type: 'image',
      name: itemName,
      position: freePos,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      imageUrl: '', // 空的，等待填充
      prompt: promptToSave,
      model: thirdPartyApiConfig.enabled ? 'nano-banana-2' : 'Gemini',
      isThirdParty: thirdPartyApiConfig.enabled,
      isLoading: true, // 标记为加载中
    };
    
    // 添加占位项到桌面
    const newItems = [...desktopItems, placeholderItem];
    setDesktopItems(newItems);
    desktopApi.saveDesktopItems(newItems);
    
    try {
      const result = await editImageWithGemini(files, finalPrompt, { aspectRatio, imageSize }, creativeIdeaCost);
      console.log('[Generate] 生成成功');
        
      if (result.imageUrl) {
        // 保存到历史记录
        const saveResult = await saveToHistory(result.imageUrl, promptToSave, thirdPartyApiConfig.enabled, files.length > 0 ? files : [], {
          templateId,
          templateType,
          bpInputs: templateType === 'bp' ? { ...bpInputs } : undefined,
          smartPlusOverrides: templateType === 'smartPlus' ? [...smartPlusOverrides] : undefined
        });
        
        const savedHistoryId = saveResult?.historyId;
        const localImageUrl = saveResult?.localImageUrl || result.imageUrl;
        
        // 更新占位项：设置图片URL，清除loading状态，并保存到磁盘
        setDesktopItems(prev => {
          const updatedItems = prev.map(item => 
            item.id === placeholderId 
              ? { ...item, imageUrl: localImageUrl, isLoading: false, historyId: savedHistoryId } as DesktopImageItem
              : item
          );
          // 立即保存更新后的状态到磁盘，避免数据丢失
          safeDesktopSave(updatedItems);
          return updatedItems;
        });
        
        // 显示结果浮层
        setGeneratedContent({ ...result, originalFiles: [...files] });
        setStatus(ApiStatus.Success);
        
        if (autoSave) {
          downloadImage(result.imageUrl);
        }
      } else {
        throw new Error('API 未返回图片');
      }
    } catch (e: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      
      // 更新占位项：设置错误状态，并保存到磁盘
      setDesktopItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === placeholderId 
            ? { ...item, isLoading: false, loadingError: errorMessage } as DesktopImageItem
            : item
        );
        // 保存错误状态到磁盘
        safeDesktopSave(updatedItems);
        return updatedItems;
      });
      
      if (errorMessage.includes('🐧') || errorMessage.includes('Pebbling') || errorMessage.includes('鹅卵石') || errorMessage.includes('余额')) {
        setError(errorMessage);
      } else {
        setError(`生成失败: ${errorMessage}`);
      }
      console.error('[Generate] 生成失败');
      setStatus(ApiStatus.Error);
    }
  }, [files, prompt, apiKey, thirdPartyApiConfig, activeSmartTemplate, activeSmartPlusTemplate, activeBPTemplate, autoSave, downloadImage, aspectRatio, imageSize, activeCreativeIdea, findNextFreePosition, handleAddToDesktop, bpInputs, smartPlusOverrides, batchCount, desktopItems, saveToHistory]);

  // 卸载创意库：清空所有模板设置和提示词
  const handleClearTemplate = useCallback(() => {
    setActiveSmartTemplate(null);
    setActiveSmartPlusTemplate(null);
    setActiveBPTemplate(null);
    setActiveCreativeIdea(null);
    setBpInputs({});
    setSmartPlusOverrides(JSON.parse(JSON.stringify(defaultSmartPlusConfig)));
    setPrompt(''); // 清空提示词
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleGenerateClick();
      }
      // Esc 键卸载创意库
      if (event.key === 'Escape') {
        const hasActiveTemplate = activeSmartTemplate || activeSmartPlusTemplate || activeBPTemplate;
        if (hasActiveTemplate) {
          event.preventDefault();
          handleClearTemplate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleGenerateClick, activeSmartTemplate, activeSmartPlusTemplate, activeBPTemplate, handleClearTemplate]);

  // 修改canGenerate条件
  // 如果不允许查看提示词，则只要有模板就可以生成
  // 完全支持并发，不受 Loading 状态限制（所有生成都采用占位项模式）
  const activeTemplateForCheck = activeBPTemplate || activeSmartPlusTemplate || activeSmartTemplate;
  const canViewPromptForCheck = activeTemplateForCheck?.allowViewPrompt !== false;
  const canGenerate = (canViewPromptForCheck ? prompt.trim().length > 0 : !!activeTemplateForCheck);
  
  const isSmartReady = !!activeSmartTemplate && prompt.trim().length > 0;
  const isSmartPlusReady = !!activeSmartPlusTemplate;
  const isBPReady = !!activeBPTemplate; // BP is ready to click penguin anytime to fill variables
  const isPromptOnlyReady = !activeSmartTemplate && !activeSmartPlusTemplate && !activeBPTemplate && prompt.trim().length > 0; // 无创意库但有提示词
  
  const canGenerateSmartPrompt = (((files.length > 0) && (isSmartReady || isSmartPlusReady)) || isBPReady || isPromptOnlyReady) && smartPromptGenStatus !== ApiStatus.Loading;

  const handleBpInputChange = (id: string, value: string) => {
      setBpInputs(prev => ({...prev, [id]: value}));
  };
  
  // 再次编辑：将生成的图片转换为File，清空其他图片，卸载创意库
  const handleEditAgain = useCallback(async () => {
    if (!generatedContent?.imageUrl) return;
    
    try {
      let blob: Blob;
      
      if (generatedContent.imageUrl.startsWith('data:')) {
        // base64 转 Blob
        const response = await fetch(generatedContent.imageUrl);
        blob = await response.blob();
      } else {
        // 外部URL，fetch获取
        const response = await fetch(generatedContent.imageUrl);
        blob = await response.blob();
      }
      
      // 创建 File 对象
      const timestamp = Date.now();
      const file = new File([blob], `generated-${timestamp}.png`, { type: 'image/png' });
      
      // 清空所有图片，仅保留结果图并选中
      setFiles([file]);
      setActiveFileIndex(0);
      
      // 清空创意库，还原默认状态
      setActiveSmartTemplate(null);
      setActiveSmartPlusTemplate(null);
      setActiveBPTemplate(null);
      setActiveCreativeIdea(null);
      setBpInputs({});
      setSmartPlusOverrides(JSON.parse(JSON.stringify(defaultSmartPlusConfig)));
      setPrompt(''); // 清空提示词
      
      // 清除当前生成结果，准备再次编辑
      setGeneratedContent(null);
      setStatus(ApiStatus.Idle);
    } catch (e) {
      console.error('转换图片失败:', e);
      setError('无法将图片添加到编辑列表');
    }
  }, [generatedContent]);
  
  // 重新生成：恢复原始输入状态，等待用户手动点击生成
  const handleRegenerate = useCallback(() => {
    // 保存当初使用的所有原始图片
    const originalFiles = generatedContent?.originalFiles || [];
    
    // 恢复原始输入图片到 UI 上
    if (originalFiles.length > 0) {
      setFiles(originalFiles);
      setActiveFileIndex(0);
    } else {
      setFiles([]);
      setActiveFileIndex(null);
    }
    
    // 关闭结果浮层，回到编辑状态
    setStatus(ApiStatus.Idle);
    setGeneratedContent(null);
    setError(null);
    
    // 提示已恢复 - 保留 prompt 不变，用户可以手动点生成
  }, [generatedContent]);

  const handleDesktopImageDoubleClick = useCallback((item: DesktopImageItem) => {
    // 双击图片预览
    setPreviewImageUrl(item.imageUrl);
  }, []);

  // 关闭生成结果浮层
  const handleDismissResult = useCallback(() => {
    setStatus(ApiStatus.Idle);
    setGeneratedContent(null);
    setError(null);
  }, []);

  const handleRenameItem = useCallback((id: string, newName: string) => {
    const updatedItems = desktopItems.map(item => {
      if (item.id === id) {
        return { ...item, name: newName, updatedAt: Date.now() };
      }
      return item;
    });
    handleDesktopItemsChange(updatedItems);
  }, [desktopItems, handleDesktopItemsChange]);

  // 桌面图片操作 - 预览
  const handleDesktopImagePreview = useCallback((item: DesktopImageItem) => {
    setPreviewImageUrl(item.imageUrl);
  }, []);

  // 桌面图片操作 - 再编辑（将图片添加到上传列表，不携带提示词）
  const handleDesktopImageEditAgain = useCallback(async (item: DesktopImageItem) => {
    try {
      // 将图片URL转换为File对象
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${item.name}.png`, { type: 'image/png' });
      
      // 添加到文件列表
      setFiles(prev => [...prev, file]);
      setActiveFileIndex(files.length); // 选中新添加的图片
      
      // 不携带提示词 - 让用户重新输入
      // if (item.prompt) {
      //   setPrompt(item.prompt);
      // }
    } catch (e) {
      console.error('添加图片到编辑列表失败:', e);
    }
  }, [files.length]);

  // 工具函数：将 data URL 转换为 Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // 桌面图片操作 - 重新生成（只恢复状态，不自动生成）
  const handleDesktopImageRegenerate = useCallback(async (item: DesktopImageItem) => {
    if (!item.prompt) {
      setError('此图片没有保存原始提示词，无法重新生成');
      setStatus(ApiStatus.Error);
      return;
    }
    
    // 恢复提示词
    setPrompt(item.prompt);
    
    // 尝试恢复原始输入图片和创意库配置（如果有历史记录）
    if (item.historyId) {
      const historyItem = generationHistory.find(h => h.id === item.historyId);
      if (historyItem) {
        // 优先从本地路径恢复输入图片（新版本）
        if (historyItem.inputImagePaths && historyItem.inputImagePaths.length > 0) {
          try {
            const restoredFiles = await Promise.all(historyItem.inputImagePaths.map(async (path) => {
              const response = await fetch(path);
              const blob = await response.blob();
              const filename = path.split('/').pop() || 'restored-input.png';
              return new File([blob], filename, { type: blob.type });
            }));
            
            setFiles(restoredFiles);
            setActiveFileIndex(0);
          } catch (e) {
            console.warn('从本地路径恢复图片失败:', e);
            setFiles([]);
            setActiveFileIndex(null);
          }
        }
        // 其次从 base64 数据恢复（兼容旧版本和贞贞 API）
        else if (historyItem.inputImages && historyItem.inputImages.length > 0) {
          try {
            const restoredFiles = historyItem.inputImages.map((img) => {
              const base64Data = `data:${img.type};base64,${img.data}`;
              const blob = dataURLtoBlob(base64Data);
              return new File([blob], img.name, { type: img.type });
            });
            
            setFiles(restoredFiles);
            setActiveFileIndex(0);
            console.log('[重新生成] 从 base64 数组恢复了', restoredFiles.length, '张图片');
          } catch (e) {
            console.warn('从 base64 数组恢复图片失败:', e);
            setFiles([]);
            setActiveFileIndex(null);
          }
        }
        // 最后尝试单图 base64（更旧的版本）
        else if (historyItem.inputImageData && historyItem.inputImageName && historyItem.inputImageType) {
          try {
            const base64Data = `data:${historyItem.inputImageType};base64,${historyItem.inputImageData}`;
            const blob = dataURLtoBlob(base64Data);
            const file = new File([blob], historyItem.inputImageName, { type: historyItem.inputImageType });
            
            setFiles([file]);
            setActiveFileIndex(0);
            console.log('[重新生成] 从单图 base64 恢复了图片');
          } catch (e) {
            console.warn('从单图 base64 恢复图片失败:', e);
            setFiles([]);
            setActiveFileIndex(null);
          }
        } else {
          // 没有输入图片
          setFiles([]);
          setActiveFileIndex(null);
        }
        
        // 恢复创意库配置
        setActiveSmartTemplate(null);
        setActiveSmartPlusTemplate(null);
        setActiveBPTemplate(null);
        setActiveCreativeIdea(null);
        setBpInputs({});
        setSmartPlusOverrides(JSON.parse(JSON.stringify(defaultSmartPlusConfig)));
        
        if (historyItem.creativeTemplateType && historyItem.creativeTemplateType !== 'none' && historyItem.creativeTemplateId) {
          const template = creativeIdeas.find(idea => idea.id === historyItem.creativeTemplateId);
          if (template) {
            // 设置当前使用的创意库（用于扣费）
            setActiveCreativeIdea(template);
            
            if (historyItem.creativeTemplateType === 'bp') {
              setActiveBPTemplate(template);
              if (historyItem.bpInputs) {
                setBpInputs(historyItem.bpInputs);
              }
            } else {
              // 非BP模式 = 普通模式模板
              setActiveSmartTemplate(template);
            }
          }
        }
      } else {
        // 找不到历史记录，清空输入
        setFiles([]);
        setActiveFileIndex(null);
      }
    } else {
      // 没有历史记录，清空输入
      setFiles([]);
      setActiveFileIndex(null);
    }
    
      // 关闭结果浮层，回到编辑状态
    setStatus(ApiStatus.Idle);
    setGeneratedContent(null);
    setError(null);
    
    // 取消桌面选中，让用户注意力回到编辑区
    setDesktopSelectedIds([]);
  }, [generationHistory, creativeIdeas]);

  const { theme, themeName } = useTheme();
  const isDark = themeName !== 'light';

  return (
    <div 
      className="h-screen font-sans flex flex-row overflow-hidden selection:bg-blue-500/30 transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary
      }}
    >
      {/* 雪花效果 */}
      <SnowfallEffect />
      
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
        multiple
      />
      <input
        ref={importIdeasInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportIdeas}
      />
      
      {/* 左侧面板 - 画布模式下隐藏 */}
      {view !== 'canvas' && (
      <div className="flex-shrink-0">
        <LeftPanel 
            files={files}
            activeFileIndex={activeFileIndex}
            onFileSelection={handleFileSelection}
            onFileRemove={handleFileRemove}
            onFileSelect={setActiveFileIndex}
            onTriggerUpload={() => fileInputRef.current?.click()}
            onSettingsClick={() => setSettingsModalOpen(true)}
            currentApiMode={
              thirdPartyApiConfig.enabled && thirdPartyApiConfig.apiKey && thirdPartyApiConfig.baseUrl
                ? 'local-thirdparty'
                : 'local-gemini'
            }
            prompt={prompt}
            setPrompt={handleSetPrompt}
            activeSmartTemplate={activeSmartTemplate}
            activeSmartPlusTemplate={activeSmartPlusTemplate}
            activeBPTemplate={activeBPTemplate}
            bpInputs={bpInputs}
            setBpInput={handleBpInputChange}
            smartPlusOverrides={smartPlusOverrides}
            setSmartPlusOverrides={setSmartPlusOverrides}
            handleGenerateSmartPrompt={handleGenerateSmartPrompt}
            canGenerateSmartPrompt={canGenerateSmartPrompt}
            smartPromptGenStatus={smartPromptGenStatus}
            onCancelSmartPrompt={handleCancelSmartPrompt}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            imageSize={imageSize}
            setImageSize={setImageSize}
            isThirdPartyApiEnabled={thirdPartyApiConfig.enabled}
            onClearTemplate={handleClearTemplate}
            backendStatus={backendStatus}
          />
        </div>
      )}
      <div className="relative flex-1 flex min-w-0">
        <Canvas 
          view={view}
          setView={setView}
          files={files}
          onUploadClick={() => fileInputRef.current?.click()}
          creativeIdeas={creativeIdeas}
          localCreativeIdeas={localCreativeIdeas}
          onBack={() => setView('editor')}
          onAdd={handleAddNewIdea}
          onDelete={handleDeleteCreativeIdea}
          onDeleteMultiple={handleDeleteMultipleCreativeIdeas}
          onEdit={handleStartEditIdea}
          onUse={handleUseCreativeIdea}
          status={status}
          error={error}
          content={generatedContent}
          onPreviewClick={setPreviewImageUrl}
          onExportIdeas={handleExportIdeas}
          onImportIdeas={() => importIdeasInputRef.current?.click()}
          onImportById={handleImportCreativeById}
          onReorderIdeas={handleReorderIdeas}
          onEditAgain={handleEditAgain}
          onRegenerate={handleRegenerate}
          onDismissResult={handleDismissResult}
          prompt={prompt}
          imageSize={imageSize}
          history={generationHistory}
          onHistorySelect={handleHistorySelect}
          onHistoryDelete={handleHistoryDelete}
          onHistoryClear={handleHistoryClear}
          desktopItems={desktopItems}
          onDesktopItemsChange={handleDesktopItemsChange}
          onDesktopImageDoubleClick={handleDesktopImageDoubleClick}
          desktopSelectedIds={desktopSelectedIds}
          onDesktopSelectionChange={setDesktopSelectedIds}
          openFolderId={openFolderId}
          onFolderOpen={setOpenFolderId}
          onFolderClose={() => setOpenFolderId(null)}
          openStackId={openStackId}
          onStackOpen={setOpenStackId}
          onStackClose={() => setOpenStackId(null)}
          onRenameItem={handleRenameItem}
          onDesktopImagePreview={handleDesktopImagePreview}
          onDesktopImageEditAgain={handleDesktopImageEditAgain}
          onDesktopImageRegenerate={handleDesktopImageRegenerate}
          onFileDrop={handleFileSelection}
          onCreateCreativeIdea={handleCreateCreativeIdeaFromImage}
                    isResultMinimized={isResultMinimized}
          setIsResultMinimized={setIsResultMinimized}
          onToggleFavorite={handleToggleFavorite}
          onUpdateCategory={handleUpdateCategory}
          isImporting={isImporting}
          isImportingById={isImportingById}
          onCanvasImageGenerated={handleCanvasImageGenerated}
          onCanvasCreated={handleCanvasCreated}
          pendingCanvasImage={pendingCanvasImage}
          onClearPendingCanvasImage={handleClearPendingCanvasImage}
          onAddToCanvas={handleAddToCanvas}
          canvasSaveRef={canvasSaveRef}
        />
        {view === 'editor' && (
             <div className="absolute left-1/2 -translate-x-1/2 z-30 transition-all duration-300 bottom-6 flex items-center gap-3">
                {/* 批量生成数量选择器 - 简洁设计 */}
                <div 
                  className="flex items-center backdrop-blur-xl rounded-full px-1.5 py-1 border transition-colors"
                  style={{
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* 减少按钮 */}
                  <button
                    onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                    disabled={batchCount <= 1}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                    }}
                    onMouseEnter={(e) => {
                      if (!(batchCount <= 1)) {
                        e.currentTarget.style.color = isDark ? 'white' : 'black';
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  {/* 数量显示 */}
                  <span 
                    className="w-6 text-center text-xs font-medium"
                    style={{ color: isDark ? 'white' : 'black' }}
                  >
                    {batchCount}
                  </span>
                  {/* 增加按钮 */}
                  <button
                    onClick={() => setBatchCount(Math.min(20, batchCount + 1))}
                    disabled={batchCount >= 20}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                    }}
                    onMouseEnter={(e) => {
                      if (!(batchCount >= 20)) {
                        e.currentTarget.style.color = isDark ? 'white' : 'black';
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <GenerateButton 
                    onClick={handleGenerateClick}
                    disabled={!canGenerate}
                    status={status}
                    hasMinimizedResult={isResultMinimized && (status === ApiStatus.Loading || status === ApiStatus.Success || status === ApiStatus.Error)}
                    onExpandResult={() => setIsResultMinimized(false)}
                />
             </div>
        )}
      </div>
      {/* 右侧面板 - 画布模式下隐藏 */}
      {view !== 'canvas' && (
      <div className="flex-shrink-0">
        <RightPanel 
          creativeIdeas={creativeIdeas}
          handleUseCreativeIdea={handleUseCreativeIdea}
          setAddIdeaModalOpen={() => setAddIdeaModalOpen(true)}
          setView={setView}
          onDeleteIdea={handleDeleteCreativeIdea}
          onEditIdea={handleStartEditIdea}
          onToggleFavorite={handleToggleFavorite}
          onClearRecentUsage={handleClearRecentUsage}
        />
      </div>
      )}
      
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.2); }
      `}</style>
      
      {previewImageUrl && (
        <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      )}
      <AddCreativeIdeaModal
        isOpen={isAddIdeaModalOpen}
        onClose={() => { 
          setAddIdeaModalOpen(false); 
          setEditingIdea(null); 
          setPresetImageForNewIdea(null);
          setPresetPromptForNewIdea(null);
          setPresetAspectRatioForNewIdea(null);
          setPresetResolutionForNewIdea(null);
        }}
        onSave={handleSaveCreativeIdea}
        ideaToEdit={editingIdea}
        presetImageUrl={presetImageForNewIdea}
        presetPrompt={presetPromptForNewIdea}
        presetAspectRatio={presetAspectRatioForNewIdea}
        presetResolution={presetResolutionForNewIdea}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        thirdPartyConfig={thirdPartyApiConfig}
        onThirdPartyConfigChange={handleThirdPartyConfigChange}
        geminiApiKey={apiKey}
        onGeminiApiKeySave={handleApiKeySave}
        autoSaveEnabled={autoSave}
        onAutoSaveToggle={handleAutoSaveToggle}
      />
      
      {/* 加载小窗 */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#171717] rounded-2xl border border-white/10 shadow-2xl shadow-black/50 px-8 py-6 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 加载动画 */}
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/icons/p-icon-white.svg" alt="P" className="w-7 h-7 opacity-80" />
              </div>
              <div className="absolute inset-0 rounded-xl border border-white/10 animate-spin" style={{ animationDuration: '3s' }}>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
              </div>
            </div>
            {/* 文字 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">正在加载</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1 h-1 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 包裹应用的主题Provider
const AppWithTheme: React.FC = () => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

export default AppWithTheme;
