import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { NodeType, GenerationConfig } from '../../types/pebblingTypes';

interface FloatingInputProps {
  onGenerate: (type: NodeType, prompt: string, config?: GenerationConfig, files?: File[]) => void;
  isGenerating: boolean;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Settings
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('1K');
  const [files, setFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch to AUTO aspect ratio when files are added (Img2Img default)
  useEffect(() => {
    if (files.length > 0) {
        setAspectRatio('AUTO');
    } else {
        // Revert to 1:1 if files are removed and it was AUTO (optional, but cleaner)
        if (aspectRatio === 'AUTO') setAspectRatio('1:1');
    }
  }, [files.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && files.length === 0) || isGenerating) return;
    
    // Determine type: If files exist -> Edit, else -> Image (default)
    const type = files.length > 0 ? 'edit' : 'image';
    
    onGenerate(type, prompt, { aspectRatio, resolution }, files);
    
    // Reset
    setPrompt('');
    setFiles([]);
    setIsExpanded(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setFiles(Array.from(e.target.files));
      }
  };

  const aspectRatios = ['AUTO', '1:1', '16:9', '9:16', '4:3', '3:4'];

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${isExpanded ? 'w-[540px]' : 'w-[500px]'}`}>
      
      {/* Attached Files Pills */}
      {files.length > 0 && (
          <div className="flex gap-2 mb-2 px-2 animate-in slide-in-from-bottom-2">
               {files.map((f, i) => (
                   <div key={i} className="bg-[#1c1c1e] border border-white/20 text-white text-xs px-2 py-1 rounded-md flex items-center gap-2 shadow-lg">
                       <span className="max-w-[120px] truncate">{f.name}</span>
                       <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-red-400"><Icons.Close size={10} /></button>
                   </div>
               ))}
          </div>
      )}

      {/* Main Bar */}
      <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-visible ring-1 ring-white/5 relative">
        
        {/* Input Area */}
        <div className="relative p-2 flex items-center gap-3 px-4 py-2">
            
            {/* File Upload Trigger */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`transition-colors ${files.length > 0 ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                title="Attach Images for Editing"
            >
                <Icons.Paperclip className="w-5 h-5" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png,image/jpeg"
                multiple 
                onChange={handleFileChange}
            />

            <div className="h-6 w-px bg-white/10 mx-1" />

            <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={files.length > 0 ? "Describe how to edit these images..." : "Describe an image to generate..."}
                className="w-full bg-transparent text-white placeholder-zinc-500 outline-none h-10 text-sm"
                disabled={isGenerating}
                autoFocus
            />
            
            {/* Popover Toggle */}
            <div className="relative">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                         <Icons.More size={16} />
                </button>

                {/* Settings Popover */}
                {isExpanded && (
                    <div className="absolute bottom-full right-0 mb-3 w-64 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 origin-bottom-right z-50">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Aspect Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {aspectRatios.map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setAspectRatio(r)}
                                            className={`text-xs py-1.5 rounded-md border transition-all ${aspectRatio === r ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-zinc-400 hover:bg-white/5'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Resolution</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1K', '2K', '4K'].map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setResolution(r)}
                                            className={`text-xs py-1.5 rounded-md border transition-all ${resolution === r ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-zinc-400 hover:bg-white/5'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Button */}
             <button 
                onClick={handleSubmit}
                disabled={isGenerating || (!prompt && files.length === 0)}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Icons.Magic size={16} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingInput;