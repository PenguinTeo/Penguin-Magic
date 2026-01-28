import React, { useState, useCallback } from 'react';
import { NodeGroup } from '../../types/pebblingTypes';

interface NodeGroupBoxProps {
  group: NodeGroup;
  nodeCount: number;
  isLightCanvas?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onUpdateGroup: (groupId: string, updates: Partial<NodeGroup>) => void;
}

// 预定义的组颜色
export const GROUP_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4',
  '#EF4444', '#84CC16', '#F97316', '#14B8A6', '#A855F7', '#64748B',
];

// SVG 编辑图标
const EditIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const NodeGroupBox: React.FC<NodeGroupBoxProps> = ({
  group,
  nodeCount,
  isLightCanvas = false,
  isDragging = false,
  isResizing = false,
  onContextMenu,
  onDragStart,
  onResizeStart,
  onUpdateGroup,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const headerHeight = 48;

  // 获取组颜色
  const color = group.color || GROUP_COLORS[parseInt(group.id.slice(-2), 16) % GROUP_COLORS.length];

  // 主题颜色
  const themeColors = {
    bg: isLightCanvas ? 'rgba(255,255,255,0.35)' : 'rgba(30,30,35,0.35)',
    border: color,
    text: isLightCanvas ? '#1d1d1f' : '#ffffff',
    headerBg: isLightCanvas ? 'rgba(255,255,255,0.9)' : 'rgba(40,40,45,0.95)',
    subText: isLightCanvas ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
  };

  // 保存名称
  const handleSaveName = useCallback(() => {
    if (editName.trim() && editName !== group.name) {
      onUpdateGroup(group.id, { name: editName.trim() });
    } else {
      setEditName(group.name);
    }
    setIsEditingName(false);
  }, [editName, group.id, group.name, onUpdateGroup]);

  // 选择颜色
  const handleSelectColor = useCallback((newColor: string) => {
    onUpdateGroup(group.id, { color: newColor });
    setShowColorPicker(false);
  }, [group.id, onUpdateGroup]);

  const isActive = isDragging || isResizing;

  return (
    <g>
      {/* 组背景 - 实线边框 */}
      <rect
        x={group.x}
        y={group.y}
        width={group.width}
        height={group.height}
        rx={16}
        ry={16}
        fill={themeColors.bg}
        stroke={isActive ? '#ffffff' : themeColors.border}
        strokeWidth={isActive ? 2.5 : 2}
        style={{ 
          cursor: 'move',
          pointerEvents: 'all',
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
        onContextMenu={onContextMenu}
        onMouseDown={(e) => {
          if (e.button === 0 && !isEditingName && !showColorPicker) {
            e.stopPropagation();
            onDragStart(e);
          }
        }}
      />
      
      {/* 组标签背景 */}
      <rect
        x={group.x}
        y={group.y}
        width={group.width}
        height={headerHeight}
        rx={16}
        ry={16}
        fill={themeColors.headerBg}
        style={{ 
          clipPath: 'inset(0 0 50% 0)',
          pointerEvents: 'none',
        }}
      />
      
      {/* 修正圆角：底部覆盖 */}
      <rect
        x={group.x}
        y={group.y + 16}
        width={group.width}
        height={headerHeight - 16}
        fill={themeColors.headerBg}
        style={{ pointerEvents: 'none' }}
      />

      {/* 颜色指示器（可点击打开色轮） */}
      <circle
        cx={group.x + 22}
        cy={group.y + headerHeight / 2}
        r={10}
        fill={color}
        stroke={isLightCanvas ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)'}
        strokeWidth={2}
        style={{ 
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowColorPicker(!showColorPicker);
        }}
      />
      
      {/* 组名称 - 支持双击编辑 */}
      {!isEditingName ? (
        <text
          x={group.x + 44}
          y={group.y + headerHeight / 2 + 7}
          fill={themeColors.text}
          fontSize={20}
          fontWeight={700}
          style={{ 
            userSelect: 'none',
            cursor: 'text',
            pointerEvents: 'all',
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditName(group.name);
            setIsEditingName(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {group.name}
        </text>
      ) : (
        <foreignObject
          x={group.x + 42}
          y={group.y + 8}
          width={Math.min(220, group.width - 140)}
          height={32}
        >
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setEditName(group.name);
                setIsEditingName(false);
              }
            }}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              background: isLightCanvas ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              border: `2px solid ${color}`,
              borderRadius: '8px',
              padding: '2px 10px',
              fontSize: '18px',
              fontWeight: 700,
              color: themeColors.text,
              outline: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </foreignObject>
      )}

      {/* 编辑按钮 - SVG图标 */}
      {!isEditingName && (
        <g
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          onClick={(e) => {
            e.stopPropagation();
            setEditName(group.name);
            setIsEditingName(true);
          }}
        >
          <rect
            x={group.x + group.width - 88}
            y={group.y + 12}
            width={26}
            height={26}
            rx={6}
            ry={6}
            fill={isLightCanvas ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
          />
          <foreignObject
            x={group.x + group.width - 82}
            y={group.y + 18}
            width={14}
            height={14}
          >
            <EditIcon color={themeColors.subText} />
          </foreignObject>
        </g>
      )}
      
      {/* 节点数量标签 */}
      <text
        x={group.x + group.width - 16}
        y={group.y + headerHeight / 2 + 5}
        fill={themeColors.subText}
        fontSize={13}
        fontWeight={500}
        textAnchor="end"
        style={{ 
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {nodeCount} 节点
      </text>

      {/* 右下角调整大小手柄 */}
      <g
        style={{ cursor: 'nwse-resize', pointerEvents: 'all' }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            onResizeStart(e);
          }
        }}
      >
        {/* 手柄背景 */}
        <rect
          x={group.x + group.width - 24}
          y={group.y + group.height - 24}
          width={20}
          height={20}
          rx={4}
          fill="transparent"
        />
        {/* 三条斜线 */}
        <line
          x1={group.x + group.width - 8}
          y1={group.y + group.height - 18}
          x2={group.x + group.width - 18}
          y2={group.y + group.height - 8}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.6}
        />
        <line
          x1={group.x + group.width - 8}
          y1={group.y + group.height - 12}
          x2={group.x + group.width - 12}
          y2={group.y + group.height - 8}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.6}
        />
      </g>

      {/* 颜色选择器 */}
      {showColorPicker && (
        <>
          {/* 点击外部关闭的透明覆盖层 */}
          <rect
            x={group.x - 500}
            y={group.y - 500}
            width={group.width + 1000}
            height={group.height + 1000}
            fill="transparent"
            style={{ pointerEvents: 'all', cursor: 'default' }}
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(false);
            }}
          />
          
          {/* 颜色选择器背景 */}
          <rect
            x={group.x + 4}
            y={group.y + headerHeight + 4}
            width={Math.min(280, group.width - 8)}
            height={48}
            rx={10}
            ry={10}
            fill={isLightCanvas ? 'rgba(255,255,255,0.98)' : 'rgba(30,30,35,0.98)'}
            stroke={isLightCanvas ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={1}
            style={{ pointerEvents: 'all' }}
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.3))"
          />
          
          {/* 颜色圆点 */}
          {GROUP_COLORS.map((c, i) => (
            <circle
              key={c}
              cx={group.x + 22 + (i % 12) * 22}
              cy={group.y + headerHeight + 28}
              r={8}
              fill={c}
              stroke={c === color ? '#ffffff' : 'transparent'}
              strokeWidth={2}
              style={{ 
                cursor: 'pointer',
                pointerEvents: 'all',
                filter: c === color ? 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' : 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectColor(c);
              }}
            />
          ))}
        </>
      )}
    </g>
  );
};

export default NodeGroupBox;
