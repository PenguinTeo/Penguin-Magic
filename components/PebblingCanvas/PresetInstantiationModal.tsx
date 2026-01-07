
import React, { useState } from 'react';
import { CanvasPreset, PresetInput } from '../types';
import { Icons } from './Icons';

interface PresetInstantiationModalProps {
  preset: CanvasPreset;
  onConfirm: (inputValues: Record<string, string>) => void;
  onCancel: () => void;
}

const PresetInstantiationModal: React.FC<PresetInstantiationModalProps> = ({ preset, onConfirm, onCancel }) => {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    preset.inputs.forEach(inp => {
        initial[`${inp.nodeId}-${inp.field}`] = inp.defaultValue || '';
    });
    return initial;
  });

  const handleChange = (nodeId: string, field: string, val: string) => {
      setValues(prev => ({
          ...prev,
          [`${nodeId}-${field}`]: val
      }));
  };

  const handleSubmit = () => {
      onConfirm(values);
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[500px] bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Icons.Layers size={16} className="text-purple-400"/>
                {preset.title}
            </h2>
            <button onClick={onCancel} className="text-zinc-500 hover:text-white"><Icons.Close size={16}/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-zinc-400 leading-relaxed">
                Configure the inputs for this workflow.
            </p>

            <div className="space-y-4">
                {preset.inputs.map((input, i) => (
                    <div key={i} className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                            {input.label}
                        </label>
                        <textarea 
                            value={values[`${input.nodeId}-${input.field}`] || ''}
                            onChange={(e) => handleChange(input.nodeId, input.field, e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-purple-500/50 resize-y min-h-[80px]"
                            placeholder="Enter value..."
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-white/5">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
            >
                Add to Canvas
            </button>
        </div>
      </div>
    </div>
  );
};

export default PresetInstantiationModal;
