import React from 'react';

interface FolderIconProps {
  className?: string;
  color?: string;
}

export const FolderIcon: React.FC<FolderIconProps> = ({ className, color }) => (
  <svg 
    className={className} 
    fill={color || 'currentColor'} 
    viewBox="0 0 24 24"
  >
    <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
  </svg>
);

export const FolderOpenIcon: React.FC<FolderIconProps> = ({ className, color }) => (
  <svg 
    className={className} 
    fill={color || 'currentColor'} 
    viewBox="0 0 24 24"
  >
    <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
    <path d="M4 8H20L18 18H6L4 8Z" fill="white" fillOpacity="0.3" />
  </svg>
);
