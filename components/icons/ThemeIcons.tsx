import React from 'react';

interface IconProps {
  className?: string;
}

// 月亮图标 - 深色主题
export const MoonIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
  </svg>
);

// 太阳图标 - 浅色主题
export const SunIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 圣诞树图标 - 圣诞主题
export const ChristmasTreeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 2L8 8h2L6 14h3l-2 6h10l-2-6h3l-4-6h2L12 2z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <rect x="10" y="20" width="4" height="2" rx="1" fill="currentColor"/>
  </svg>
);

// 松树图标 - 森林主题
export const ForestIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 3L7 10h2l-3 5h2l-2 4h12l-2-4h2l-3-5h2L12 3z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <rect x="10" y="19" width="4" height="3" rx="1" fill="currentColor" fillOpacity="0.5"/>
  </svg>
);

// 花朵图标 - 薄荷/薰衣草主题
export const FlowerIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
    <path 
      d="M12 2c1.5 2 1.5 4 0 6M12 16c-1.5 2-1.5 4 0 6M2 12c2 1.5 4 1.5 6 0M16 12c2-1.5 4-1.5 6 0M5.64 5.64c2.12.71 3.54 2.12 4.24 4.24M14.12 14.12c.7 2.12 2.12 3.54 4.24 4.24M5.64 18.36c2.12-.71 3.54-2.12 4.24-4.24M14.12 9.88c.7-2.12 2.12-3.54 4.24-4.24" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// 日落图标 - 日落主题
export const SunsetIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M17 18a5 5 0 1 0-10 0" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M12 2v3M4.22 10.22l2.12 2.12M1 18h4M19 18h4M17.66 12.34l2.12-2.12M12 9v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 海浪图标 - 海洋主题
export const WaveIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M2 6c2-2 4-2 6 0s4 2 6 0 4-2 6 0" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path 
      d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 保存/硬盘图标 - 用于自动保存
export const SaveIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// CPU/芯片图标 - 用于当前模型
export const CpuIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect 
      x="4" y="4" width="16" height="16" rx="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 信息图标 - 用于版本号
export const InfoIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 外部链接图标 - 用于获取Key按钮
export const ExternalLinkSmallIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
