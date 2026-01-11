import React, { memo, useState, useMemo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { X, RotateCw, ArrowUpDown, ZoomIn } from 'lucide-react';

// 类型定义
interface AngleParams {
  rotate: number;      // 水平角度 0-360
  vertical: number;    // 垂直角度 -30 到 90
  zoom: number;        // 缩放距离 0-10
  addAnglePrompt: boolean; // 是否添加详细角度信息
}

interface AngleResult {
  prompt: string;
  hDirection: string;
  vDirection: string;
  distance: string;
}

// 获取水平方向描述
function getHorizontalDirection(angle: number, addAnglePrompt: boolean): string {
  const hAngle = angle % 360;
  const suffix = addAnglePrompt ? "" : " quarter";
  
  if (hAngle < 22.5 || hAngle >= 337.5) return "front view";
  if (hAngle < 67.5) return `front-right${suffix} view`;
  if (hAngle < 112.5) return "right side view";
  if (hAngle < 157.5) return `back-right${suffix} view`;
  if (hAngle < 202.5) return "back view";
  if (hAngle < 247.5) return `back-left${suffix} view`;
  if (hAngle < 292.5) return "left side view";
  return `front-left${suffix} view`;
}

// 获取垂直方向描述
function getVerticalDirection(vertical: number, addAnglePrompt: boolean): string {
  if (addAnglePrompt) {
    if (vertical < -15) return "low angle";
    if (vertical < 15) return "eye level";
    if (vertical < 45) return "high angle";
    if (vertical < 75) return "bird's eye view";
    return "top-down view";
  } else {
    if (vertical < -15) return "low-angle shot";
    if (vertical < 15) return "eye-level shot";
    if (vertical < 75) return "elevated shot";
    return "high-angle shot";
  }
}

// 获取距离/缩放描述
function getDistanceDescription(zoom: number, addAnglePrompt: boolean): string {
  if (addAnglePrompt) {
    if (zoom < 2) return "wide shot";
    if (zoom < 4) return "medium-wide shot";
    if (zoom < 6) return "medium shot";
    if (zoom < 8) return "medium close-up";
    return "close-up";
  } else {
    if (zoom < 2) return "wide shot";
    if (zoom < 6) return "medium shot";
    return "close-up";
  }
}

// 主转换函数
function convertAngleToPrompt(params: AngleParams): AngleResult {
  const { rotate, vertical, zoom, addAnglePrompt = true } = params;
  
  const hDirection = getHorizontalDirection(rotate, addAnglePrompt);
  const vDirection = getVerticalDirection(vertical, addAnglePrompt);
  const distance = getDistanceDescription(zoom, addAnglePrompt);
  
  let prompt: string;
  if (addAnglePrompt) {
    prompt = `${hDirection}, ${vDirection}, ${distance} (horizontal: ${Math.round(rotate)}, vertical: ${Math.round(vertical)}, zoom: ${zoom.toFixed(1)})`;
  } else {
    prompt = `${hDirection} ${vDirection} ${distance}`;
  }
  
  return { prompt, hDirection, vDirection, distance };
}

// 获取水平角度对应的中文
function getHorizontalLabel(angle: number): string {
  const hAngle = angle % 360;
  if (hAngle < 22.5 || hAngle >= 337.5) return "正面";
  if (hAngle < 67.5) return "右前";
  if (hAngle < 112.5) return "右侧";
  if (hAngle < 157.5) return "右后";
  if (hAngle < 202.5) return "背面";
  if (hAngle < 247.5) return "左后";
  if (hAngle < 292.5) return "左侧";
  return "左前";
}

// 获取垂直角度对应的中文
function getVerticalLabel(vertical: number): string {
  if (vertical < -15) return "仰视";
  if (vertical < 15) return "平视";
  if (vertical < 45) return "高角度";
  if (vertical < 75) return "鸟瞰";
  return "俯视";
}

// 获取距离对应的中文
function getZoomLabel(zoom: number): string {
  if (zoom < 2) return "远景";
  if (zoom < 4) return "中远景";
  if (zoom < 6) return "中景";
  if (zoom < 8) return "中近景";
  return "特写";
}

const MultiAngleNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as CanvasNodeData;
  
  // 从 nodeData 中获取初始值
  const [rotate, setRotate] = useState<number>((nodeData as any).rotate ?? 0);
  const [vertical, setVertical] = useState<number>((nodeData as any).vertical ?? 0);
  const [zoom, setZoom] = useState<number>((nodeData as any).zoom ?? 5);
  const [addAnglePrompt, setAddAnglePrompt] = useState<boolean>((nodeData as any).addAnglePrompt ?? true);

  // 计算提示词
  const result = useMemo(() => convertAngleToPrompt({ rotate, vertical, zoom, addAnglePrompt }), 
    [rotate, vertical, zoom, addAnglePrompt]);

  // 更新节点数据
  const updateNodeData = useCallback((updates: Partial<AngleParams>) => {
    const newParams = {
      rotate: updates.rotate ?? rotate,
      vertical: updates.vertical ?? vertical,
      zoom: updates.zoom ?? zoom,
      addAnglePrompt: updates.addAnglePrompt ?? addAnglePrompt,
    };
    const newResult = convertAngleToPrompt(newParams);
    
    nodeData.onEdit?.(id, {
      ...newParams,
      anglePrompt: newResult.prompt,
      angleResult: newResult,
    } as any);
  }, [id, nodeData, rotate, vertical, zoom, addAnglePrompt]);

  // 处理滑块变化
  const handleRotateChange = (value: number) => {
    setRotate(value);
    updateNodeData({ rotate: value });
  };

  const handleVerticalChange = (value: number) => {
    setVertical(value);
    updateNodeData({ vertical: value });
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
    updateNodeData({ zoom: value });
  };

  const handleDetailModeChange = (checked: boolean) => {
    setAddAnglePrompt(checked);
    updateNodeData({ addAnglePrompt: checked });
  };

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl`}
      style={{
        borderColor: selected ? '#a855f7' : 'rgba(168, 85, 247, 0.4)',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.15))',
        boxShadow: selected ? '0 10px 40px -10px rgba(168, 85, 247, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
        width: '280px',
      }}
    >
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-purple-400 !border-2 !border-purple-600 hover:!scale-125 transition-transform"
      />

      {/* 节点头部 */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="text-lg">🎬</span>
        <span className="text-sm font-bold text-purple-300 flex-1">视角控制</span>
        <button
          onClick={() => nodeData.onDelete?.(id)}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 控制区域 */}
      <div className="p-4 space-y-4">
        {/* 水平角度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <RotateCw className="w-3.5 h-3.5 text-purple-400" />
              水平角度
            </label>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
              {Math.round(rotate)}° · {getHorizontalLabel(rotate)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={rotate}
            onChange={(e) => handleRotateChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer nodrag"
            style={{
              background: `linear-gradient(to right, #a855f7 ${(rotate / 360) * 100}%, rgba(255,255,255,0.1) ${(rotate / 360) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>正面</span>
            <span>右侧</span>
            <span>背面</span>
            <span>左侧</span>
            <span>正面</span>
          </div>
        </div>

        {/* 垂直角度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              垂直角度
            </label>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
              {Math.round(vertical)}° · {getVerticalLabel(vertical)}
            </span>
          </div>
          <input
            type="range"
            min={-30}
            max={90}
            value={vertical}
            onChange={(e) => handleVerticalChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer nodrag"
            style={{
              background: `linear-gradient(to right, #a855f7 ${((vertical + 30) / 120) * 100}%, rgba(255,255,255,0.1) ${((vertical + 30) / 120) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>仰视</span>
            <span>平视</span>
            <span>俯视</span>
          </div>
        </div>

        {/* 缩放距离 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
              景别距离
            </label>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
              {zoom.toFixed(1)} · {getZoomLabel(zoom)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer nodrag"
            style={{
              background: `linear-gradient(to right, #a855f7 ${(zoom / 10) * 100}%, rgba(255,255,255,0.1) ${(zoom / 10) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>远景</span>
            <span>中景</span>
            <span>特写</span>
          </div>
        </div>

        {/* 详细模式开关 */}
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={addAnglePrompt}
            onChange={(e) => handleDetailModeChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 nodrag"
          />
          <span>附加详细角度参数</span>
        </label>

        {/* 生成的提示词预览 */}
        <div className="rounded-xl bg-black/30 border border-purple-500/20 p-3 space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">生成的视角提示词</div>
          <div className="text-xs text-purple-300 leading-relaxed break-words">
            {result.prompt}
          </div>
          <div className="flex gap-2 flex-wrap text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              📐 {result.hDirection}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              📏 {result.vDirection}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              🔍 {result.distance}
            </span>
          </div>
        </div>
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-purple-400 !border-2 !border-purple-600 hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(MultiAngleNode);
