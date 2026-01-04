
import React, { useState } from 'react';
import { ChevronDown as ChevronDownIcon } from 'lucide-react';

interface AccordionProps {
  title: string;
  // FIX: The type for the `icon` prop was changed from the generic `React.ReactElement` to the more specific `React.ReactElement<React.SVGProps<SVGSVGElement>>`.
  // This resolves a TypeScript error when cloning the element with a `className`, as it correctly informs the type system that the icon component accepts SVG attributes.
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
  isOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, icon, children, isOpen = false }) => {
  const [isContentOpen, setIsContentOpen] = useState(isOpen);

  return (
    <div className="flex flex-col bg-gray-800/50 rounded-lg border border-gray-700/50 flex-shrink-0 transition-all duration-300">
      <button
        onClick={() => setIsContentOpen(!isContentOpen)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-700/30 rounded-t-lg transition-colors"
        aria-expanded={isContentOpen}
      >
        <div className="flex items-center gap-3">
          <span className="text-blue-400">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
          <h3 className="font-semibold text-gray-200 text-base">{title}</h3>
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isContentOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isContentOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className="p-4 border-t border-gray-700/50">
              {children}
            </div>
        </div>
      </div>
    </div>
  );
};
