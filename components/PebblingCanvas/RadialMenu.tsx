import React, { useEffect, useRef, useState } from 'react';
import { NodeType } from '../../types/pebblingTypes';
import { Icons } from './Icons';

// 工具定义
interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  nodeType: NodeType;
  color: string;
  description: string;
}

// 预定义工具列表
const RADIAL_TOOLS: ToolItem[] = [
  {
    id: 'magic',
    label: 'Magic',
    icon: <Icons.Sparkles />,
    nodeType: 'edit',
    color: '#10B981', // 绿色
    description: '联合图片生成'
  },
  {
    id: 'video',
    label: 'Video',
    icon: <Icons.Video />,
    nodeType: 'video',
    color: '#3B82F6', // 蓝色
    description: '视频生成'
  },
  {
    id: 'llm',
    label: 'LLM',
    icon: <Icons.Magic />,
    nodeType: 'llm',
    color: '#8B5CF6', // 紫色
    description: '大语言模型'
  },
  {
    id: 'text',
    label: 'Text',
    icon: <Icons.Type />,
    nodeType: 'text',
    color: '#F59E0B', // 橙色
    description: '文本节点'
  },
  {
    id: 'image',
    label: 'Image',
    icon: <Icons.Image />,
    nodeType: 'image',
    color: '#EC4899', // 粉色
    description: '图片节点'
  },
  {
    id: 'drawing',
    label: 'Drawing',
    icon: <Icons.Palette />,
    nodeType: 'drawing-board',
    color: '#F97316', // 深橙
    description: '画板'
  },
];

interface RadialMenuProps {
  x: number;
  y: number;
  onSelect: (nodeType: NodeType) => void;
  onClose: () => void;
  isLightCanvas?: boolean;
}

const RadialMenu: React.FC<RadialMenuProps> = ({ 
  x, 
  y, 
  onSelect, 
  onClose,
  isLightCanvas = false 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // 圆形布局参数
  const radius = 100; // 工具按钮距离中心的距离
  const itemSize = 56; // 工具按钮尺寸
  const centerSize = 64; // 中心圆尺寸

  // 动画延迟打开
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    // 延迟添加监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSelect = (tool: ToolItem) => {
    setIsClosing(true);
    setTimeout(() => {
      onSelect(tool.nodeType);
    }, 150);
  };

  // 计算每个工具的位置（圆形布局）
  const getToolPosition = (index: number, total: number) => {
    // 从顶部开始，顺时针排列
    const angleOffset = -90; // 从12点钟方向开始
    const angle = (360 / total) * index + angleOffset;
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
      angle
    };
  };

  // 主题颜色
  const themeColors = {
    bg: isLightCanvas ? 'rgba(255,255,255,0.95)' : 'rgba(20,20,25,0.95)',
    border: isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    text: isLightCanvas ? '#1d1d1f' : '#ffffff',
    textSecondary: isLightCanvas ? '#6e6e73' : '#a1a1aa',
    centerBg: isLightCanvas ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
    hoverBg: isLightCanvas ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] pointer-events-auto"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 背景模糊层 */}
      <div
        className={`absolute rounded-full transition-all duration-300 ${
          isVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          width: radius * 2 + itemSize + 40,
          height: radius * 2 + itemSize + 40,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${themeColors.bg} 0%, transparent 70%)`,
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* 中心指示器 */}
      <div
        className={`absolute rounded-full flex items-center justify-center transition-all duration-300 ${
          isVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}
        style={{
          width: centerSize,
          height: centerSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: themeColors.centerBg,
          border: `2px solid ${themeColors.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        {hoveredTool ? (
          <span 
            className="text-xs font-bold text-center px-1 leading-tight"
            style={{ color: themeColors.text }}
          >
            {RADIAL_TOOLS.find(t => t.id === hoveredTool)?.label}
          </span>
        ) : (
          <Icons.Plus size={24} color={themeColors.textSecondary} />
        )}
      </div>

      {/* 连接线（装饰） */}
      <svg
        className={`absolute pointer-events-none transition-all duration-500 ${
          isVisible && !isClosing ? 'opacity-30' : 'opacity-0'
        }`}
        style={{
          width: radius * 2 + itemSize + 40,
          height: radius * 2 + itemSize + 40,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {RADIAL_TOOLS.map((tool, index) => {
          const pos = getToolPosition(index, RADIAL_TOOLS.length);
          const centerX = (radius * 2 + itemSize + 40) / 2;
          const centerY = (radius * 2 + itemSize + 40) / 2;
          return (
            <line
              key={tool.id}
              x1={centerX}
              y1={centerY}
              x2={centerX + pos.x}
              y2={centerY + pos.y}
              stroke={hoveredTool === tool.id ? tool.color : themeColors.border}
              strokeWidth={hoveredTool === tool.id ? 2 : 1}
              strokeDasharray={hoveredTool === tool.id ? 'none' : '4 4'}
              className="transition-all duration-200"
            />
          );
        })}
      </svg>

      {/* 工具按钮 */}
      {RADIAL_TOOLS.map((tool, index) => {
        const pos = getToolPosition(index, RADIAL_TOOLS.length);
        const isHovered = hoveredTool === tool.id;
        const delay = index * 30; // 依次展开的动画延迟
        
        return (
          <button
            key={tool.id}
            className={`absolute rounded-full flex items-center justify-center cursor-pointer
              transition-all duration-300 hover:scale-110 active:scale-95
              ${isVisible && !isClosing ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              width: isHovered ? itemSize + 8 : itemSize,
              height: isHovered ? itemSize + 8 : itemSize,
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${isVisible && !isClosing ? pos.x : 0}px), calc(-50% + ${isVisible && !isClosing ? pos.y : 0}px))`,
              background: isHovered 
                ? `linear-gradient(135deg, ${tool.color}20, ${tool.color}40)` 
                : themeColors.bg,
              border: `2px solid ${isHovered ? tool.color : themeColors.border}`,
              boxShadow: isHovered 
                ? `0 0 20px ${tool.color}40, 0 4px 15px rgba(0,0,0,0.2)` 
                : '0 4px 15px rgba(0,0,0,0.15)',
              transitionDelay: isVisible && !isClosing ? `${delay}ms` : '0ms',
            }}
            onMouseEnter={() => setHoveredTool(tool.id)}
            onMouseLeave={() => setHoveredTool(null)}
            onClick={() => handleSelect(tool)}
          >
            <div 
              className="transition-transform duration-200"
              style={{ 
                transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                color: isHovered ? tool.color : themeColors.textSecondary 
              }}
            >
              {React.cloneElement(tool.icon as React.ReactElement<any>, { 
                size: isHovered ? 26 : 22,
                color: isHovered ? tool.color : themeColors.textSecondary
              })}
            </div>
          </button>
        );
      })}

      {/* 悬浮时的描述提示 */}
      {hoveredTool && (
        <div
          className={`absolute px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            transition-all duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            left: '50%',
            top: radius + itemSize + 20,
            transform: 'translateX(-50%)',
            background: themeColors.bg,
            border: `1px solid ${themeColors.border}`,
            color: themeColors.text,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {RADIAL_TOOLS.find(t => t.id === hoveredTool)?.description}
        </div>
      )}

      {/* 外圈装饰环 */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-500 ${
          isVisible && !isClosing ? 'opacity-20 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          width: radius * 2 + itemSize + 60,
          height: radius * 2 + itemSize + 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: `1px dashed ${themeColors.border}`,
        }}
      />
    </div>
  );
};

export default RadialMenu;
