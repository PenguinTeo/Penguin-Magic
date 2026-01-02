import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 主题类型定义
export type ThemeName = 'dark' | 'light' | 'christmas' | 'forest' | 'lavender' | 'sunset' | 'ocean';

export interface ThemeColors {
  // 主色调
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // 强调色
  accent: string;
  accentLight: string;
  
  // 背景色
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgPanel: string;
  
  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // 边框颜色
  border: string;
  borderLight: string;
  
  // 渐变
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  
  // 特殊效果
  glow: string;
  shadow: string;
}

export interface ThemeDecorations {
  // 装饰性元素
  snowflakes?: boolean;
  particles?: boolean;
  sparkles?: boolean;
  
  // 背景效果
  backgroundPattern?: string;
  backgroundAnimation?: string;
  
  // 图标/装饰物
  decorations?: string[];
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  icon: string;
  colors: ThemeColors;
  decorations: ThemeDecorations;
}

// 黑暗主题 - 默认
const darkTheme: Theme = {
  name: 'dark',
  displayName: '深色',
  icon: '🌙',
  colors: {
    primary: '#3b82f6',
    primaryLight: '#a5b4fc',
    primaryDark: '#2563eb',
    accent: '#3b82f6',
    accentLight: '#3b82f6',
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a24',
    bgPanel: 'rgba(18, 18, 26, 0.95)',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    gradientStart: '#3b82f6',
    gradientMiddle: '#60a5fa',
    gradientEnd: '#ffffff',
    glow: 'rgba(59, 130, 246, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
  decorations: {
    snowflakes: false,
    particles: false,
    sparkles: false,
  }
};

// 明亮主题
const lightTheme: Theme = {
  name: 'light',
  displayName: '浅色',
  icon: '☀️',
  colors: {
    primary: '#3b82f6',
    primaryLight: '#818cf8',
    primaryDark: '#2563eb',
    accent: '#3b82f6',
    accentLight: '#3b82f6',
    bgPrimary: '#f8fafc',
    bgSecondary: '#f1f5f9',
    bgTertiary: '#e2e8f0',
    bgPanel: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.04)',
    gradientStart: '#3b82f6',
    gradientMiddle: '#60a5fa',
    gradientEnd: '#ffffff',
    glow: 'rgba(59, 130, 246, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  decorations: {
    snowflakes: false,
    particles: false,
    sparkles: false,
  }
};

// 圣诞主题 🎄
const christmasTheme: Theme = {
  name: 'christmas',
  displayName: '圣诞节',
  icon: '🎄',
  colors: {
    primary: '#dc2626', // 红色
    primaryLight: '#ef4444',
    primaryDark: '#b91c1c',
    accent: '#16a34a', // 绿色
    accentLight: '#22c55e',
    bgPrimary: '#0f172a', // 深蓝夜空
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    bgPanel: 'rgba(15, 23, 42, 0.6)',
    textPrimary: '#f8fafc',
    textSecondary: '#e2e8f0',
    textMuted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.15)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
    gradientStart: '#dc2626',
    gradientMiddle: '#16a34a',
    gradientEnd: '#eab308',
    glow: 'rgba(220, 38, 38, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.6)',
  },
  decorations: {
    snowflakes: true,
    particles: true,
    sparkles: true,
    decorations: ['🎄', '⭐', '🎁', '❄️', '🔔', '🎅'],
  }
};

// 森林主题 🌲
const forestTheme: Theme = {
  name: 'forest',
  displayName: '森林',
  icon: '🌲',
  colors: {
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    accent: '#84cc16',
    accentLight: '#a3e635',
    bgPrimary: '#0a1a0f',
    bgSecondary: '#0f2416',
    bgTertiary: '#1a3a23',
    bgPanel: 'rgba(10, 26, 15, 0.95)',
    textPrimary: '#f0fdf4',
    textSecondary: '#bbf7d0',
    textMuted: '#86efac',
    border: 'rgba(34, 197, 94, 0.2)',
    borderLight: 'rgba(34, 197, 94, 0.1)',
    gradientStart: '#22c55e',
    gradientMiddle: '#84cc16',
    gradientEnd: '#fbbf24',
    glow: 'rgba(34, 197, 94, 0.5)',
    shadow: 'rgba(0, 20, 10, 0.6)',
  },
  decorations: {
    snowflakes: false,
    particles: false,
    sparkles: false,
  }
};

// 薄荷主题 💜
const lavenderTheme: Theme = {
  name: 'lavender',
  displayName: '薄荷',
  icon: '💜',
  colors: {
    primary: '#a78bfa',
    primaryLight: '#c4b5fd',
    primaryDark: '#8b5cf6',
    accent: '#e879f9',
    accentLight: '#f0abfc',
    bgPrimary: '#0f0a1a',
    bgSecondary: '#1a1029',
    bgTertiary: '#2a1a40',
    bgPanel: 'rgba(15, 10, 26, 0.95)',
    textPrimary: '#faf5ff',
    textSecondary: '#e9d5ff',
    textMuted: '#c4b5fd',
    border: 'rgba(167, 139, 250, 0.2)',
    borderLight: 'rgba(167, 139, 250, 0.1)',
    gradientStart: '#a78bfa',
    gradientMiddle: '#e879f9',
    gradientEnd: '#f472b6',
    glow: 'rgba(167, 139, 250, 0.5)',
    shadow: 'rgba(15, 0, 30, 0.6)',
  },
  decorations: {
    snowflakes: false,
    particles: false,
    sparkles: true,
  }
};

// 日落主题 🌅
const sunsetTheme: Theme = {
  name: 'sunset',
  displayName: '日落',
  icon: '🌅',
  colors: {
    primary: '#f97316',
    primaryLight: '#fb923c',
    primaryDark: '#ea580c',
    accent: '#f43f5e',
    accentLight: '#fb7185',
    bgPrimary: '#1a0a0a',
    bgSecondary: '#2a1010',
    bgTertiary: '#3d1818',
    bgPanel: 'rgba(26, 10, 10, 0.95)',
    textPrimary: '#fff7ed',
    textSecondary: '#fed7aa',
    textMuted: '#fdba74',
    border: 'rgba(249, 115, 22, 0.2)',
    borderLight: 'rgba(249, 115, 22, 0.1)',
    gradientStart: '#f97316',
    gradientMiddle: '#f43f5e',
    gradientEnd: '#fbbf24',
    glow: 'rgba(249, 115, 22, 0.5)',
    shadow: 'rgba(30, 10, 0, 0.6)',
  },
  decorations: {
    snowflakes: false,
    particles: false,
    sparkles: false,
  }
};

// 海洋主题
const oceanTheme: Theme = {
  name: 'ocean',
  displayName: '深海',
  icon: '🌊',
  colors: {
    primary: '#0ea5e9',
    primaryLight: '#38bdf8',
    primaryDark: '#0284c7',
    accent: '#3b82f6',
    accentLight: '#3b82f6',
    bgPrimary: '#0c1929',
    bgSecondary: '#0f2942',
    bgTertiary: '#164e63',
    bgPanel: 'rgba(12, 25, 41, 0.6)',
    textPrimary: '#f0f9ff',
    textSecondary: '#bae6fd',
    textMuted: '#7dd3fc',
    border: 'rgba(14, 165, 233, 0.2)',
    borderLight: 'rgba(14, 165, 233, 0.1)',
    gradientStart: '#0ea5e9',
    gradientMiddle: '#3b82f6',
    gradientEnd: '#14b8a6',
    glow: 'rgba(14, 165, 233, 0.5)',
    shadow: 'rgba(0, 20, 40, 0.6)',
  },
  decorations: {
    snowflakes: false,
    particles: true,
    sparkles: false,
    backgroundAnimation: 'waves',
  }
};

// 所有可用主题
export const themes: Record<ThemeName, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  christmas: christmasTheme,
  forest: forestTheme,
  lavender: lavenderTheme,
  sunset: sunsetTheme,
  ocean: oceanTheme,
};

// Context
interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  allThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('app_theme');
    // 处理旧版本的 'default' 主题名
    if (saved === 'default') return 'dark';
    // 默认使用深色主题
    return (saved as ThemeName) || 'dark';
  });

  const theme = themes[themeName];

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem('app_theme', name);
  };

  // 应用CSS变量
  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-light', colors.accentLight);
    root.style.setProperty('--color-bg-primary', colors.bgPrimary);
    root.style.setProperty('--color-bg-secondary', colors.bgSecondary);
    root.style.setProperty('--color-bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--color-bg-panel', colors.bgPanel);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-border-light', colors.borderLight);
    root.style.setProperty('--color-gradient-start', colors.gradientStart);
    root.style.setProperty('--color-gradient-middle', colors.gradientMiddle);
    root.style.setProperty('--color-gradient-end', colors.gradientEnd);
    root.style.setProperty('--color-glow', colors.glow);
    root.style.setProperty('--color-shadow', colors.shadow);
    
    // 设置主题类名
    root.className = `theme-${themeName}`;
  }, [theme, themeName]);

  const value: ThemeContextValue = {
    theme,
    themeName,
    setTheme,
    allThemes: Object.values(themes),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 雪花装饰组件 - 已禁用，影响打字性能
export const SnowfallEffect: React.FC = () => {
  // 直接返回 null，不再渲染雪花效果
  return null;
};

// 主题选择器组件
export const ThemeSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { themeName, setTheme, allThemes } = useTheme();
  
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {allThemes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
            themeName === t.name
              ? 'bg-white/20 ring-2 ring-white/40 scale-110'
              : 'bg-white/5 hover:bg-white/10 hover:scale-105'
          }`}
          title={t.displayName}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};
