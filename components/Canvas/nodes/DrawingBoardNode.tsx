import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  X, Play, Download, Pencil, Type, Square, Circle, 
  Minus, Plus, Trash2, Move, RotateCcw, Image as ImageIcon
} from 'lucide-react';

// 画板内元素类型
interface BoardElement {
  id: string;
  type: 'image' | 'text' | 'path' | 'rect' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  // 图片元素
  imageUrl?: string;
  imageData?: HTMLImageElement;
  // 文字元素
  text?: string;
  fontSize?: number;
  color?: string;
  // 路径元素（画笔）
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  strokeColor?: string;
  // 图形元素
  fillColor?: string;
  // 拖拽状态
  isDragging?: boolean;
}

// 画板节点扩展数据
interface DrawingBoardData extends CanvasNodeData {
  elements?: BoardElement[];
  boardWidth?: number;
  boardHeight?: number;
  outputImageUrl?: string;
  isReceiving?: boolean;
  isExporting?: boolean;
  onReceive?: () => void;
  onExport?: () => void;
  onSaveOutput?: (imageDataUrl: string, filename: string) => void;
}

// 工具类型
type ToolType = 'select' | 'pencil' | 'text' | 'rect' | 'circle' | 'line';

// 预设颜色
const COLORS = [
  { name: '红', value: '#ef4444' },
  { name: '黄', value: '#eab308' },
  { name: '蓝', value: '#3b82f6' },
  { name: '绿', value: '#22c55e' },
  { name: '黑', value: '#1f2937' },
  { name: '白', value: '#ffffff' },
];

// 画笔大小预设
const BRUSH_SIZES = [2, 4, 6, 10, 16, 24];

const DrawingBoardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as DrawingBoardData;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 画板状态
  const [elements, setElements] = useState<BoardElement[]>(nodeData.elements || []);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(4);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // 绘图状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 文字输入状态
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  // 画板尺寸
  const boardWidth = nodeData.boardWidth || 500;
  const boardHeight = nodeData.boardHeight || 380;

  // 同步元素到节点数据
  useEffect(() => {
    nodeData.onEdit?.(id, { elements });
  }, [elements]);

  // 重绘画布
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    // 绘制所有元素
    elements.forEach(el => {
      switch (el.type) {
        case 'image':
          if (el.imageData) {
            ctx.drawImage(el.imageData, el.x, el.y, el.width || 100, el.height || 100);
          }
          break;
        case 'path':
          if (el.points && el.points.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = el.strokeColor || '#000';
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(el.points[0].x, el.points[0].y);
            el.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
          break;
        case 'text':
          ctx.font = `${el.fontSize || 16}px sans-serif`;
          ctx.fillStyle = el.color || '#000';
          ctx.fillText(el.text || '', el.x, el.y);
          break;
        case 'rect':
          ctx.fillStyle = el.fillColor || el.strokeColor || '#000';
          ctx.fillRect(el.x, el.y, el.width || 50, el.height || 50);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.fillStyle = el.fillColor || el.strokeColor || '#000';
          const radius = Math.min(el.width || 50, el.height || 50) / 2;
          ctx.arc(el.x + radius, el.y + radius, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'line':
          if (el.points && el.points.length >= 2) {
            ctx.beginPath();
            ctx.strokeStyle = el.strokeColor || '#000';
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.moveTo(el.points[0].x, el.points[0].y);
            ctx.lineTo(el.points[1].x, el.points[1].y);
            ctx.stroke();
          }
          break;
      }

      // 绘制选中框
      if (el.id === selectedElementId && el.type !== 'path') {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(el.x - 4, el.y - 4, (el.width || 50) + 8, (el.height || 50) + 8);
        ctx.setLineDash([]);
      }
    });

    // 绘制正在进行的路径
    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }, [elements, selectedElementId, currentPath, selectedColor, brushSize, boardWidth, boardHeight]);

  // 监听元素变化重绘
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // 获取鼠标在画布上的坐标
  const getCanvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // 查找点击的元素
  const findElementAtPoint = (x: number, y: number): BoardElement | null => {
    // 从后往前查找（后添加的在上面）
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'path') continue; // 路径不可选中拖拽
      const w = el.width || 50;
      const h = el.height || 50;
      if (x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h) {
        return el;
      }
    }
    return null;
  };

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const coords = getCanvasCoords(e);

    if (selectedTool === 'select') {
      const el = findElementAtPoint(coords.x, coords.y);
      if (el) {
        setSelectedElementId(el.id);
        setDragStart(coords);
        setDragOffset({ x: coords.x - el.x, y: coords.y - el.y });
      } else {
        setSelectedElementId(null);
      }
    } else if (selectedTool === 'pencil') {
      setIsDrawing(true);
      setCurrentPath([coords]);
    } else if (selectedTool === 'text') {
      setTextPosition(coords);
    } else if (['rect', 'circle', 'line'].includes(selectedTool)) {
      setIsDrawing(true);
      setDragStart(coords);
    }
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing && !dragStart) return;
    const coords = getCanvasCoords(e);

    if (selectedTool === 'select' && dragStart && selectedElementId) {
      // 拖拽元素
      setElements(prev => prev.map(el => 
        el.id === selectedElementId 
          ? { ...el, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : el
      ));
    } else if (selectedTool === 'pencil' && isDrawing) {
      setCurrentPath(prev => [...prev, coords]);
    }
  };

  // 鼠标释放
  const handleMouseUp = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (selectedTool === 'pencil' && currentPath.length > 1) {
      const newElement: BoardElement = {
        id: `path-${Date.now()}`,
        type: 'path',
        x: 0,
        y: 0,
        points: currentPath,
        strokeColor: selectedColor,
        strokeWidth: brushSize,
      };
      setElements(prev => [...prev, newElement]);
    } else if (selectedTool === 'rect' && dragStart) {
      const newElement: BoardElement = {
        id: `rect-${Date.now()}`,
        type: 'rect',
        x: Math.min(dragStart.x, coords.x),
        y: Math.min(dragStart.y, coords.y),
        width: Math.abs(coords.x - dragStart.x),
        height: Math.abs(coords.y - dragStart.y),
        fillColor: selectedColor,
      };
      if (newElement.width! > 5 && newElement.height! > 5) {
        setElements(prev => [...prev, newElement]);
      }
    } else if (selectedTool === 'circle' && dragStart) {
      const size = Math.max(Math.abs(coords.x - dragStart.x), Math.abs(coords.y - dragStart.y));
      const newElement: BoardElement = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        x: Math.min(dragStart.x, coords.x),
        y: Math.min(dragStart.y, coords.y),
        width: size,
        height: size,
        fillColor: selectedColor,
      };
      if (size > 5) {
        setElements(prev => [...prev, newElement]);
      }
    } else if (selectedTool === 'line' && dragStart) {
      const newElement: BoardElement = {
        id: `line-${Date.now()}`,
        type: 'line',
        x: dragStart.x,
        y: dragStart.y,
        points: [dragStart, coords],
        strokeColor: selectedColor,
        strokeWidth: brushSize,
      };
      setElements(prev => [...prev, newElement]);
    }

    setIsDrawing(false);
    setCurrentPath([]);
    setDragStart(null);
  };

  // 添加文字
  const handleAddText = () => {
    if (!textInput.trim() || !textPosition) return;
    const newElement: BoardElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y + 16, // 文字基线调整
      text: textInput,
      fontSize: brushSize * 4,
      color: selectedColor,
      width: textInput.length * brushSize * 2.5,
      height: brushSize * 5,
    };
    setElements(prev => [...prev, newElement]);
    setTextInput('');
    setTextPosition(null);
  };

  // 删除选中元素
  const handleDeleteSelected = () => {
    if (selectedElementId) {
      setElements(prev => prev.filter(el => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  };

  // 清空画板
  const handleClear = () => {
    setElements([]);
    setSelectedElementId(null);
  };

  // 第一个RUN：接收输入图片
  const handleReceive = async () => {
    const onReceive = (nodeData as any).onReceive;
    if (onReceive) {
      await onReceive();
    }
  };

  // 第二个RUN：导出画板内容
  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 生成PNG
    const imageDataUrl = canvas.toDataURL('image/png');
    const onExport = (nodeData as any).onExport;
    if (onExport) {
      await onExport(imageDataUrl);
    }
  };

  // 加载图片到画板
  const loadImageToBoard = useCallback((imageUrl: string, index: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 🔧 图片尺寸等比缩放，最长边不超过1600
      const maxSize = 1600;
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w *= ratio;
        h *= ratio;
      }
      const newElement: BoardElement = {
        id: `img-${Date.now()}-${index}`,
        type: 'image',
        x: 20 + (index % 3) * 160,
        y: 20 + Math.floor(index / 3) * 120,
        width: w,
        height: h,
        imageUrl,
        imageData: img,
      };
      setElements(prev => [...prev, newElement]);
    };
    img.src = imageUrl;
  }, []);

  // 监听接收的图片
  useEffect(() => {
    const receivedImages = (nodeData as any).receivedImages;
    if (receivedImages && Array.isArray(receivedImages)) {
      receivedImages.forEach((url: string, idx: number) => {
        if (!elements.some(el => el.imageUrl === url)) {
          loadImageToBoard(url, idx);
        }
      });
    }
  }, [(nodeData as any).receivedImages]);

  const isReceiving = (nodeData as any).isReceiving;
  const isExporting = (nodeData as any).isExporting;

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl"
      style={{
        width: boardWidth + 40,
        borderColor: selected ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))',
        boxShadow: selected ? '0 10px 40px -10px rgba(245, 158, 11, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-amber-400 !border-2 !border-amber-600 hover:!scale-125 transition-transform"
        title="图片输入（支持多图）"
      />

      {/* 节点头部 */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-xl">🎨</span>
        <span className="text-sm font-bold text-amber-300 flex-1">画板</span>
        
        {/* 接收按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); handleReceive(); }}
          disabled={isReceiving}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/80 hover:bg-blue-400 text-white transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-blue-500/30"
          title="接收上游图片"
        >
          {isReceiving ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          <span>接收</span>
        </button>

        {/* 输出按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); handleExport(); }}
          disabled={isExporting || elements.length === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/80 hover:bg-emerald-400 text-white transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-500/30"
          title="输出为PNG"
        >
          {isExporting ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3" fill="currentColor" />
          )}
          <span>输出</span>
        </button>

        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 工具栏 */}
      <div className="px-3 py-2 flex items-center gap-2 border-b flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)' }}>
        {/* 工具选择 */}
        <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
          <button
            onClick={() => setSelectedTool('select')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${selectedTool === 'select' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="选择/移动"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedTool('pencil')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${selectedTool === 'pencil' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="画笔"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedTool('text')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${selectedTool === 'text' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="文字"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedTool('rect')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${selectedTool === 'rect' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="矩形"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedTool('circle')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${selectedTool === 'circle' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="圆形"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 颜色选择 */}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* 画笔大小 */}
        <div className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1">
          <button
            onClick={() => setBrushSize(s => Math.max(1, s - 2))}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-300 w-6 text-center">{brushSize}</span>
          <button
            onClick={() => setBrushSize(s => Math.min(32, s + 2))}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedElementId}
            className="w-7 h-7 rounded bg-black/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all disabled:opacity-30"
            title="删除选中"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            disabled={elements.length === 0}
            className="w-7 h-7 rounded bg-black/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all disabled:opacity-30"
            title="清空画板"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <div 
        ref={containerRef}
        className="p-4 relative"
        style={{ background: 'rgba(0,0,0,0.1)' }}
      >
        <canvas
          ref={canvasRef}
          width={boardWidth}
          height={boardHeight}
          className="rounded-lg cursor-crosshair bg-white shadow-inner"
          style={{ display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* 文字输入弹窗 */}
        {textPosition && (
          <div 
            className="absolute bg-gray-900/95 rounded-lg border border-amber-500/50 p-2 shadow-xl z-50"
            style={{ left: textPosition.x + 16, top: textPosition.y + 60 }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="输入文字..."
              className="w-36 px-2 py-1 text-xs bg-black/50 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText();
                if (e.key === 'Escape') setTextPosition(null);
              }}
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleAddText}
                className="flex-1 px-2 py-1 text-xs bg-amber-500 rounded text-white hover:bg-amber-400"
              >
                确定
              </button>
              <button
                onClick={() => setTextPosition(null)}
                className="px-2 py-1 text-xs bg-gray-600 rounded text-white hover:bg-gray-500"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div 
        className="px-4 py-2 flex items-center justify-between text-xs"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-gray-500">
          {elements.length} 个元素 | {boardWidth}×{boardHeight}
        </span>
        <span className="text-amber-400/70">
          {selectedTool === 'select' ? '拖拽移动元素' : 
           selectedTool === 'pencil' ? '自由绘制' :
           selectedTool === 'text' ? '点击添加文字' :
           selectedTool === 'rect' ? '拖拽绘制矩形' :
           selectedTool === 'circle' ? '拖拽绘制圆形' : ''}
        </span>
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-amber-400 !border-2 !border-amber-600 hover:!scale-125 transition-transform"
        title="PNG 图片输出"
      />
    </div>
  );
};

export default memo(DrawingBoardNode);
