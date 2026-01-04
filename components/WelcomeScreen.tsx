import React, { useState, useCallback } from 'react';
import { Sparkles as SparklesIcon, Upload as UploadIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface WelcomeScreenProps {
  onUploadClick: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUploadClick }) => {
  const { theme } = useTheme();
  
  return (
    <div className="w-full h-full flex items-center justify-center p-8 text-center animate-fade-in">
      <div className="max-w-md">
        <div className="mx-auto w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-blue-500 shadow-lg">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <h2 
          className="text-3xl font-bold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          欢迎来到 Pebbling UI
        </h2>
        <p 
          className="text-base mb-6"
          style={{ color: theme.colors.textMuted }}
        >
          直接输入提示词生成图片，或上传图片进行编辑创作
        </p>
        <button
          onClick={onUploadClick}
          className="font-medium py-2.5 px-5 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
          style={{ 
            backgroundColor: theme.colors.bgTertiary,
            color: theme.colors.textSecondary,
            border: `1px solid ${theme.colors.border}`
          }}
        >
          <UploadIcon className="w-4 h-4" />
          <span>上传参考图（可选）</span>
        </button>
      </div>
    </div>
  );
};