import React from 'react';

// P 字母图标 - 用于 Penguin UI 品牌标识
export const PIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "w-6 h-6", style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 粗厚的P字母 - 填充式设计 */}
    <path 
      d="M6 3h7a6 6 0 0 1 0 12H9v6H6V3z" 
      fill="currentColor"
    />
    <path 
      d="M9 6h4a3 3 0 0 1 0 6H9V6z" 
      fill="currentColor"
      style={{ opacity: 0 }}
    />
  </svg>
);

// 实心 P 图标
export const PIconSolid: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 3a1 1 0 0 0-1 1v16a1 1 0 1 0 2 0v-6h5a6 6 0 0 0 0-12H6zm1 2h5a4 4 0 0 1 0 8H7V5z"/>
  </svg>
);

// 圆形背景 P 图标
export const PIconCircle: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
    <path 
      d="M9 7h4a3 3 0 0 1 0 6H9V7z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 7v10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
  </svg>
);

// 用于金币/鹅卵石的图标
export const PebbleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="14" rx="8" ry="6" fill="currentColor" opacity="0.3"/>
    <ellipse cx="12" cy="12" rx="8" ry="6" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="4" ry="3" fill="currentColor" opacity="0.5"/>
  </svg>
);

// 云端图标
export const CloudIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

// 本地/插件图标
export const PlugIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// 钻石图标 (Gemini)
export const DiamondIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l8 6-8 12-8-12 8-6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9h16" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v6m0 12V9" />
  </svg>
);

// 警告图标
export const WarningIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
