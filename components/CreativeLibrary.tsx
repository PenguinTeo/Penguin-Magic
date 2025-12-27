

import React, { useState, useMemo, useRef } from 'react';
import type { CreativeIdea } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LibraryIcon } from './icons/LibraryIcon';
import { EditIcon } from './icons/EditIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { useTheme } from '../contexts/ThemeContext';
import { normalizeImageUrl } from '../utils/image';
import { ImportCreativeModal } from './ImportCreativeModal';


interface CreativeLibraryProps {
  ideas: CreativeIdea[];
  onBack: () => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
  onEdit: (idea: CreativeIdea) => void;
  onUse: (idea: CreativeIdea) => void;
  onExport: () => void;
  onImport: () => void;
  onImportById: (idRange: string) => Promise<void>;
  onReorder: (reorderedIdeas: CreativeIdea[]) => void;
  onToggleFavorite?: (id: number) => void;
  isImporting?: boolean; // 导入状态
  isImportingById?: boolean; // 按ID导入状态
}

type FilterType = 'all' | 'bp';

export const CreativeLibrary: React.FC<CreativeLibraryProps> = ({ ideas, onBack, onAdd, onDelete, onEdit, onUse, onExport, onImport, onImportById, onReorder, onToggleFavorite, isImporting, isImportingById }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { themeName, theme } = useTheme();
  const isLight = themeName === 'light';
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const dragItem = useRef<CreativeIdea | null>(null);
  const dragOverItem = useRef<CreativeIdea | null>(null);

  // 单个创意导出功能
  const handleExportSingle = async (idea: CreativeIdea) => {
    try {
      // 转换图片为base64
      const convertImageToBase64 = async (url: string): Promise<string> => {
        if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
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
          return url;
        }
      };

      const ideaWithBase64 = {
        ...idea,
        imageUrl: await convertImageToBase64(idea.imageUrl)
      };

      const dataStr = JSON.stringify(ideaWithBase64, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      // 文件名用创意标题
      const safeTitle = idea.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      link.download = `creative_${safeTitle}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出失败:', e);
      alert('导出失败');
    }
  };

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter(idea => {
        if (filter === 'all') return true;
        if (filter === 'bp') return !!idea.isBP;
        return true;
      })
      .filter(idea =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [ideas, searchTerm, filter]);

  const handleDragSort = () => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current.id === dragOverItem.current.id) {
      return;
    }

    const newIdeas = [...ideas];
    const dragItemIndex = ideas.findIndex(i => i.id === dragItem.current!.id);
    const dragOverItemIndex = ideas.findIndex(i => i.id === dragOverItem.current!.id);

    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;

    const [draggedItem] = newIdeas.splice(dragItemIndex, 1);
    newIdeas.splice(dragOverItemIndex, 0, draggedItem);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    onReorder(newIdeas);
  };

  const filterButtons: { key: FilterType, label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'bp', label: 'BP' },
  ];

  return (
    <div 
      className="flex flex-col w-full h-full p-4 animate-fade-in transition-colors duration-300"
      style={{ background: theme.colors.bgPrimary }}
    >
      <header 
        className="flex-shrink-0 flex items-center justify-between gap-3 pb-3"
        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
            创意库
          </h1>
          <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>管理和使用您的创意灵感</p>
        </div>
        <div className="flex items-center gap-2">
                    <button
            onClick={onImport}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary
            }}
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>导入中...</span>
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4" />
                <span>导入</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            disabled={isImportingById}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary
            }}
          >
            {isImportingById ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>导入中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>智能导入</span>
              </>
            )}
          </button>
           <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary
            }}
          >
            <DownloadIcon className="w-4 h-4" />
            <span>导出</span>
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition-all duration-200"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>新增</span>
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg text-xs transition-all duration-200"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary
            }}
          >
            &larr; 返回
          </button>
        </div>
      </header>

      <div className="flex-shrink-0 flex items-center justify-between gap-3 py-3">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.colors.textMuted }} />
          <input
            type="text"
            placeholder="搜索标题..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg py-2 pl-8 pr-3 text-xs transition-all duration-200"
            style={{ 
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary
            }}
          />
        </div>
        <div 
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ 
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.border}`
          }}
        >
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                filter === key
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : ''
              }`}
              style={{
                color: filter === key ? undefined : theme.colors.textMuted
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <main className="flex-grow overflow-y-auto py-1 pr-1 -mr-1">
        {filteredIdeas.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {filteredIdeas.map(idea => (
              <div 
                key={idea.id} 
                className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                style={{ 
                  background: theme.colors.bgSecondary,
                  border: `1px solid ${theme.colors.border}`
                }}
                title={idea.title}
                onClick={() => onUse(idea)}
                draggable
                onDragStart={() => (dragItem.current = idea)}
                onDragEnter={() => (dragOverItem.current = idea)}
                onDragEnd={handleDragSort}
                onDragOver={(e) => e.preventDefault()}
                >
                  <img src={normalizeImageUrl(idea.imageUrl)} alt={idea.title} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-0.5 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                      <h3 className="font-medium text-white truncate text-xs">{idea.title}</h3>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ cursor: 'default' }}>
                     {/* 收藏按钮 */}
                     {onToggleFavorite && (
                       <button
                          onClick={(e) => { 
                              e.stopPropagation(); 
                              onToggleFavorite(idea.id);
                          }}
                          className={`p-1 rounded-full backdrop-blur-sm transition-all duration-200 ${
                            idea.isFavorite 
                              ? 'bg-yellow-500/80 text-white' 
                              : 'bg-black/60 text-white hover:bg-yellow-500/60'
                          }`}
                          title="收藏"
                          style={{ cursor: 'pointer' }}
                      >
                          <svg className="w-3 h-3" fill={idea.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                      </button>
                     )}
                     <button
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onEdit(idea);
                        }}
                        className="p-1 bg-black/60 text-white hover:bg-blue-500 rounded-full backdrop-blur-sm transition-all duration-200"
                        title="编辑"
                        style={{ cursor: 'pointer' }}
                    >
                        <EditIcon className="w-3 h-3" />
                    </button>
                    {/* 单个导出按钮 */}
                    <button
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleExportSingle(idea);
                        }}
                        className="p-1 bg-black/60 text-white hover:bg-green-500 rounded-full backdrop-blur-sm transition-all duration-200"
                        title="导出"
                        style={{ cursor: 'pointer' }}
                    >
                        <DownloadIcon className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if(window.confirm(`确认删除 "${idea.title}"?`)) {
                                onDelete(idea.id); 
                            }
                        }}
                        className="p-1 bg-black/60 text-white hover:bg-red-500 rounded-full backdrop-blur-sm transition-all duration-200"
                        title="删除"
                        style={{ cursor: 'pointer' }}
                    >
                        <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                   <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                      <div className="flex gap-0.5">
                        {idea.isBP && (
                            <div 
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded-full backdrop-blur-sm pointer-events-none shadow-lg"
                              style={{ backgroundColor: '#eed16d', color: '#1a1a2e', boxShadow: '0 4px 6px -1px rgba(238,209,109,0.3)' }}
                            >
                                BP
                            </div>
                        )}
                        {/* 显示作者信息（非BP模式也显示） */}
                        {idea.author && (
                            <div 
                              className="px-1.5 py-0.5 text-[9px] font-medium rounded-full backdrop-blur-sm pointer-events-none"
                              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                            >
                                @{idea.author}
                            </div>
                        )}
                      </div>
                      {/* 价格显示 */}
                      {idea.cost !== undefined && idea.cost > 0 && (
                        <div className="px-1.5 py-0.5 bg-blue-500/90 text-white text-[8px] font-bold rounded-full backdrop-blur-sm pointer-events-none flex items-center gap-0.5">
                          <span>🪨</span>
                          <span>{idea.cost}</span>
                        </div>
                      )}
                    </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <LibraryIcon className="w-12 h-12 mb-3" style={{ color: theme.colors.textMuted }}/>
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.textSecondary }}>
              {searchTerm || filter !== 'all' ? '未找到创意' : '创意库是空的'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: theme.colors.textMuted }}>
              {searchTerm || filter !== 'all' ? '请尝试其他关键词或筛选条件' : '点击 "新增" 来添加您的第一个灵感！'}
            </p>
          </div>
        )}
      </main>
      
      <ImportCreativeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onImportById}
        isImporting={isImportingById}
      />
    </div>
  );
};

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
