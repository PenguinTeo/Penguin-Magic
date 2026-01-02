
import React from 'react';

interface PresetState {
  lens: string;
  mood: string;
  style: string;
  framing: string;
  scenario: string;
}

interface PromptPresetsProps {
  presets: PresetState;
  onPresetsChange: (presets: PresetState) => void;
  categories?: (keyof typeof PRESET_OPTIONS)[];
}

const PRESET_OPTIONS = {
  framing: {
    label: '构图 / Framing',
    options: ['自拍', '大头照', '半身照', '全身照', '特写', '远景'],
  },
  lens: {
    label: '镜头 / Lens',
    options: ['广角', '长焦', '微距', '鱼眼', '人像'],
  },
  mood: {
    label: '情绪 / Mood',
    options: ['快乐', '忧郁', '神秘', '史诗感', '浪漫', '悬疑'],
  },
  style: {
    label: '风格 / Style',
    options: ['电影感', '复古', '赛博朋克', '水彩', '蒸汽波', '极简主义'],
  },
  scenario: {
    label: '创意方案 / Creative Scenarios',
    options: ['走秀 / Catwalk Show', '动漫真人化 / Coser', '手办制作 / Figure Production'],
  }
};

type PresetCategory = keyof typeof PRESET_OPTIONS;

export const PromptPresets: React.FC<PromptPresetsProps> = ({ presets, onPresetsChange, categories }) => {

  const handleSelect = (category: PresetCategory, value: string) => {
    const currentSelection = presets[category];
    const newSelection = currentSelection === value ? '' : value; // Toggle behavior
    onPresetsChange({
      ...presets,
      [category]: newSelection,
    });
  };
  
  const categoriesToRender = categories || (Object.keys(PRESET_OPTIONS) as PresetCategory[]);

  return (
    <div className="space-y-4">
      {categoriesToRender.map(category => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">{PRESET_OPTIONS[category].label}</h4>
          <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS[category].options.map(option => {
                  const isActive = presets[category] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(category, option)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-400 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
          </div>
        </div>
      ))}
    </div>
  );
};
