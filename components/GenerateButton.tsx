import React from 'react';
import { Sparkles as SparklesIcon, AlertTriangle, Check } from 'lucide-react';
import { ApiStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface GenerateButtonProps {
    onClick: () => void;
    disabled: boolean;
    status: ApiStatus;
    // 最小化结果联动
    hasMinimizedResult?: boolean;
    onExpandResult?: () => void;
    isError?: boolean; // 是否是错误状态
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ 
    onClick, 
    disabled, 
    status,
    hasMinimizedResult,
    onExpandResult
}) => {
    const { theme, isDark } = useTheme();
    // 判断状态
    const isError = status === ApiStatus.Error;
    const isLoading = status === ApiStatus.Loading;
    const isSuccess = status === ApiStatus.Success;
    
    // 如果有最小化结果，按钮本身切换状态（不添加延伸区域）
    if (hasMinimizedResult) {
        // 根据状态确定颜色 - 冰雪主题（黑白灰冰蓝）
        const gradientClass = isLoading 
            ? 'bg-gradient-to-r from-blue-400 via-white to-blue-400'
            : isError 
                ? 'bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500'
                : 'bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400';
        
        const buttonGradient = isLoading
            ? 'bg-gradient-to-br from-white via-blue-100 to-white'
            : isError 
                ? 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700'
                : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';
        
        return (
            <div 
              className="group relative cursor-pointer"
              onClick={onExpandResult}
              title={isLoading ? "点击查看生成进度" : "点击查看生成结果"}
            >
                {/* 发光效果 - 根据状态变色 */}
                <div className={`absolute -inset-3 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse ${gradientClass}`}></div>
                
                {/* 主按钮 - 只改变颜色和图标 */}
                <button
                    className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300
                        text-white shadow-2xl hover:scale-110 active:scale-95 border-2 border-white/40
                        ${buttonGradient}
                    `}
                >
                    {isLoading ? (
                        <>
                            <div className="w-7 h-7 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-[9px] font-bold mt-1 uppercase tracking-wide text-black">生成中</span>
                        </>
                    ) : isError ? (
                        <>
                            <AlertTriangle className="w-7 h-7" strokeWidth={2.5} />
                            <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">查看</span>
                        </>
                    ) : (
                        <>
                            <Check className="w-7 h-7" strokeWidth={2.5} />
                            <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">完成</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    // 正常生成按钮
    return (
        <div 
          className="group relative"
          title="Magic Generate (Ctrl+Enter)"
        >
            {/* 发光效果 - 冰蓝 */}
            <div className={`absolute -inset-3 bg-blue-400 rounded-full blur-lg opacity-40 group-hover:opacity-60 animate-pulse transition-opacity duration-500 ${disabled ? 'hidden' : 'block'}`}></div>
            
            <button
                onClick={onClick}
                disabled={disabled || status === ApiStatus.Loading}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ease-out
                    ${disabled 
                        ? 'cursor-not-allowed border' 
                        : isDark
                            ? 'bg-white text-black shadow-2xl shadow-white/20 hover:scale-105 active:scale-95 border border-white/20'
                            : 'bg-blue-500 text-white shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 border border-blue-400/30'
                    }
                `}
                style={disabled ? {
                    backgroundColor: isDark ? theme.colors.bgTertiary : theme.colors.bgSecondary,
                    color: isDark ? theme.colors.textMuted : theme.colors.textMuted,
                    borderColor: theme.colors.border
                } : {}}
            >
                {status === ApiStatus.Loading ? (
                    <div 
                        className="w-8 h-8 border-2 rounded-full animate-spin"
                        style={{
                            borderColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                            borderTopColor: isDark ? '#000' : '#fff'
                        }}
                    ></div>
                ) : (
                    <SparklesIcon className={`w-8 h-8 transform transition-transform duration-500 ${disabled ? '' : 'group-hover:rotate-12'}`} />
                )}
            </button>
        </div>
    );
};