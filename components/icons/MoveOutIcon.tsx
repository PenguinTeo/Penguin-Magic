import React from 'react';

interface MoveOutIconProps {
  className?: string;
}

export const MoveOutIcon: React.FC<MoveOutIconProps> = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 19H4a2 2 0 01-2-2V7a2 2 0 012-2h5" />
    <polyline points="13 17 18 12 13 7" />
    <line x1="18" y1="12" x2="9" y2="12" />
  </svg>
);
