
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  text: string;
  subtext?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, text, subtext }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full p-4">
      <div className="mb-4">{icon}</div>
      <p className="text-base font-semibold text-gray-400">{text}</p>
      {subtext && <p className="text-sm mt-1">{subtext}</p>}
    </div>
  );
};
