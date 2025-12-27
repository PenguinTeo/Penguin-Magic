import React, { useState } from 'react';
import { CreativeIdea } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ImportCreativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (idRange: string) => Promise<void>;
  isImporting: boolean;
}

export const ImportCreativeModal: React.FC<ImportCreativeModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isImporting
}) => {
  const { theme, themeName } = useTheme();
  const isLight = themeName === 'light';
  const [idRange, setIdRange] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!idRange.trim()) {
      setError('请输入创意编号');
      return;
    }

    // 验证ID格式 (支持: "791-785", "791", "id791-785")
    const idPattern = /^(\d+)(-\d+)?$/;
    if (!idPattern.test(idRange.trim().replace(/^id/i, ''))) {
      setError('请输入有效的编号格式，例如: 791, 791-785');
      return;
    }

    try {
      await onImport(idRange.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div 
        className="relative w-[480px] max-w-[90vw] rounded-2xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
            : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          border: `1px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: theme.colors.border }}>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center ring-1"
              style={{
                backgroundColor: isLight ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.15)',
                ringColor: theme.colors.border
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-base font-bold" style={{ color: theme.colors.textPrimary }}>
              智能导入
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-white/10"
            style={{ color: theme.colors.textMuted }}
            title="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              编号范围
            </label>
            <input
              type="text"
              value={idRange}
              onChange={(e) => setIdRange(e.target.value)}
              placeholder="输入编号，例如: 791 或 791-785"
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary
              }}
              disabled={isImporting}
            />
            <p className="text-xs mt-1.5" style={{ color: theme.colors.textMuted }}>
              支持单个编号 (如: 791) 或范围 (如: 791-785)
            </p>
          </div>
          
          {error && (
            <div 
              className="p-3 rounded-lg text-sm"
              style={{ 
                background: isLight ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.15)',
                border: isLight ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.3)'
              }}
            >
              <span style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}
          
          {/* 按钮组 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ 
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                color: theme.colors.textMuted
              }}
              disabled={isImporting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isImporting}
              className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              style={{ 
                background: isLight ? '#3b82f6' : '#2563eb',
                color: '#ffffff'
              }}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>导入中...</span>
                </>
              ) : (
                <span>智能导入</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};