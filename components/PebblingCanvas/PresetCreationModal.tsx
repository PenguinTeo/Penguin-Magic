
import React, { useState, useEffect, useMemo } from 'react';
import { CanvasNode, PresetInput } from '../types';
import { Icons } from './Icons';

interface PresetCreationModalProps {
  selectedNodes: CanvasNode[];
  onSave: (title: string, description: string, inputs: PresetInput[]) => void;
  onCancel: () => void;
}

const PresetCreationModal: React.FC<PresetCreationModalProps> = ({ selectedNodes, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [potentialInputs, setPotentialInputs] = useState<PresetInput[]>([]);
  const [selectedInputIndices, setSelectedInputIndices] = useState<Set<number>>(new Set());

  // Only scan once when mounted or when node IDs change to avoid reference instability loop
  const nodeSignature = selectedNodes.map(n => n.id).join(',');

  useEffect(() => {
    // Scan nodes for possible inputs
    const found: PresetInput[] = [];
    
    selectedNodes.forEach(node => {
        // 1. Text Content (for Text/Idea nodes)
        if (['text', 'idea'].includes(node.type) && node.content) {
            found.push({
                nodeId: node.id,
                field: 'content',
                label: `${node.title || 'Text'} Content`,
                defaultValue: node.content
            });
        }
        
        // 2. User Prompt
        if (node.data?.prompt) {
             found.push({
                nodeId: node.id,
                field: 'prompt',
                label: `${node.title || node.type} Prompt`,
                defaultValue: node.data.prompt
            });
        }

        // 3. System Instruction
        if (node.data?.systemInstruction) {
             found.push({
                nodeId: node.id,
                field: 'systemInstruction',
                label: `${node.title || node.type} System Instruction`,
                defaultValue: node.data.systemInstruction
            });
        }
    });
    setPotentialInputs(found);
  }, [nodeSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleInput = (index: number) => {
      const newSet = new Set(selectedInputIndices);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      setSelectedInputIndices(newSet);
  };

  const handleLabelChange = (index: number, newLabel: string) => {
      const newInputs = [...potentialInputs];
      newInputs[index].label = newLabel;
      setPotentialInputs(newInputs);
  };

  const handleSave = () => {
      if (!title.trim()) return;
      const inputsToSave = potentialInputs.filter((_, i) => selectedInputIndices.has(i));
      onSave(title, description, inputsToSave);
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
                <Icons.Layers size={16} className="text-purple-400"/> Save to Creative Library
            </h2>
            <button onClick={onCancel} className="text-zinc-500 hover:text-white"><Icons.Close size={16}/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Metadata */}
            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Preset Name</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Character Generator"
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-purple-500/50"
                        autoFocus
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Description</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does this workflow do?"
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs text-zinc-300 outline-none focus:border-purple-500/50 resize-none h-20"
                    />
                </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Input Configuration */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Define Input Conditions</label>
                    <span className="text-[10px] text-zinc-600">{potentialInputs.length} potential inputs found</span>
                </div>
                
                {potentialInputs.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-zinc-600 italic">
                        No configurable text or prompts found in selection.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {potentialInputs.map((input, i) => {
                            const isSelected = selectedInputIndices.has(i);
                            return (
                                <div key={i} className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${isSelected ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-transparent'}`}>
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => handleToggleInput(i)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-zinc-600 hover:border-zinc-400'}`}
                                        >
                                            {isSelected && <Icons.Check size={10} />}
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        {isSelected ? (
                                            <input 
                                                value={input.label}
                                                onChange={(e) => handleLabelChange(i, e.target.value)}
                                                className="w-full bg-transparent border-b border-white/20 pb-0.5 text-sm font-bold text-white outline-none focus:border-purple-400 placeholder-zinc-500"
                                                placeholder="Input Label"
                                            />
                                        ) : (
                                            <div className="text-sm font-medium text-zinc-400">{input.label}</div>
                                        )}
                                        
                                        <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[300px]">
                                            Original: "{input.defaultValue.substring(0, 50)}..."
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-white/5">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
            </button>
            <button 
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 transition-all"
            >
                Save to Library
            </button>
        </div>
      </div>
    </div>
  );
};

export default PresetCreationModal;
