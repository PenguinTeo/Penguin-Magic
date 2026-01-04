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
