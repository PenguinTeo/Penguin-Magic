/**
 * ComfyUI-Easy-Use: 可视化调节视角功能 - React/TypeScript 版本
 * ============================================================
 * 
 * 这个文件展示如何用 React + TypeScript 实现相同的视角调节功能
 * 适用于 Node.js + React 项目
 */

import React, { useState, useCallback, useMemo } from 'react';

// ============================================
// 类型定义
// ============================================

interface AngleParams {
  rotate: number;      // 水平角度 0-360
  vertical: number;    // 垂直角度 -30 到 90
  zoom: number;        // 缩放距离 0-10
  addAnglePrompt?: boolean; // 是否添加详细角度信息
}

interface AngleResult {
  prompt: string;
  hDirection: string;
  vDirection: string;
  distance: string;
}

// ============================================
// 核心逻辑函数 - 角度到提示词的映射
// ============================================

/**
 * 获取水平方向描述
 */
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

/**
 * 获取垂直方向描述
 */
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

/**
 * 获取距离/缩放描述
 */
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

/**
 * 主转换函数 - 将角度参数转换为提示词
 */
export function convertAngleToPrompt(params: AngleParams): AngleResult {
  const { 
    rotate: rawRotate, 
    vertical: rawVertical, 
    zoom: rawZoom, 
    addAnglePrompt = true 
  } = params;
  
  // 限制输入范围
  const rotate = Math.max(0, Math.min(360, Math.round(rawRotate)));
  const vertical = Math.max(-30, Math.min(90, Math.round(rawVertical)));
  const zoom = Math.max(0, Math.min(10, rawZoom));
  
  const hDirection = getHorizontalDirection(rotate, addAnglePrompt);
  const vDirection = getVerticalDirection(vertical, addAnglePrompt);
  const distance = getDistanceDescription(zoom, addAnglePrompt);
  
  let prompt: string;
  if (addAnglePrompt) {
    prompt = `${hDirection}, ${vDirection}, ${distance} (horizontal: ${rotate}, vertical: ${vertical}, zoom: ${zoom.toFixed(1)})`;
  } else {
    prompt = `${hDirection} ${vDirection} ${distance}`;
  }
  
  return { prompt, hDirection, vDirection, distance };
}

// ============================================
// React Hook - 使用角度控制
// ============================================

export function useMultiAngle(initialParams?: Partial<AngleParams>) {
  const [params, setParams] = useState<AngleParams>({
    rotate: initialParams?.rotate ?? 0,
    vertical: initialParams?.vertical ?? 0,
    zoom: initialParams?.zoom ?? 5,
    addAnglePrompt: initialParams?.addAnglePrompt ?? true,
  });
  
  const result = useMemo(() => convertAngleToPrompt(params), [params]);
  
  const setRotate = useCallback((value: number) => {
    setParams(prev => ({ ...prev, rotate: value }));
  }, []);
  
  const setVertical = useCallback((value: number) => {
    setParams(prev => ({ ...prev, vertical: value }));
  }, []);
  
  const setZoom = useCallback((value: number) => {
    setParams(prev => ({ ...prev, zoom: value }));
  }, []);
  
  const setAddAnglePrompt = useCallback((value: boolean) => {
    setParams(prev => ({ ...prev, addAnglePrompt: value }));
  }, []);
  
  return {
    params,
    setParams,
    setRotate,
    setVertical,
    setZoom,
    setAddAnglePrompt,
    result,
  };
}

// ============================================
// React 组件 - 可视化视角控制器
// ============================================

interface MultiAngleControlProps {
  value?: AngleParams;
  onChange?: (params: AngleParams, result: AngleResult) => void;
  showPreview?: boolean;
}

export const MultiAngleControl: React.FC<MultiAngleControlProps> = ({
  value,
  onChange,
  showPreview = true,
}) => {
  const {
    params,
    setParams,
    setRotate,
    setVertical,
    setZoom,
    setAddAnglePrompt,
    result,
  } = useMultiAngle(value);
  
  // 当参数改变时触发回调
  React.useEffect(() => {
    onChange?.(params, result);
  }, [params, result, onChange]);
  
  // 同步外部value
  React.useEffect(() => {
    if (value) {
      setParams(value);
    }
  }, [value, setParams]);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🎬 可视化视角控制</h3>
      
      {/* 水平角度滑块 */}
      <div style={styles.sliderGroup}>
        <label style={styles.label}>
          水平角度 (Rotate): {params.rotate}°
        </label>
        <input
          type="range"
          min={0}
          max={360}
          value={params.rotate}
          onChange={(e) => setRotate(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.hint}>
          0°正面 → 90°右侧 → 180°背面 → 270°左侧
        </div>
      </div>
      
      {/* 垂直角度滑块 */}
      <div style={styles.sliderGroup}>
        <label style={styles.label}>
          垂直角度 (Vertical): {params.vertical}°
        </label>
        <input
          type="range"
          min={-30}
          max={90}
          value={params.vertical}
          onChange={(e) => setVertical(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.hint}>
          -30°仰视 → 0°平视 → 90°俯视
        </div>
      </div>
      
      {/* 缩放滑块 */}
      <div style={styles.sliderGroup}>
        <label style={styles.label}>
          缩放距离 (Zoom): {params.zoom.toFixed(1)}
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={params.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.hint}>
          0远景 → 5中景 → 10特写
        </div>
      </div>
      
      {/* 详细模式开关 */}
      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={params.addAnglePrompt}
            onChange={(e) => setAddAnglePrompt(e.target.checked)}
          />
          添加详细角度信息
        </label>
      </div>
      
      {/* 预览区域 */}
      {showPreview && (
        <div style={styles.preview}>
          <div style={styles.previewTitle}>生成的提示词:</div>
          <div style={styles.promptText}>{result.prompt}</div>
          <div style={styles.breakdown}>
            <span>📐 {result.hDirection}</span>
            <span>📏 {result.vDirection}</span>
            <span>🔍 {result.distance}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// 样式定义
// ============================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 600,
  },
  sliderGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#e0e0e0',
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '11px',
    color: '#888',
    marginTop: '4px',
  },
  checkboxGroup: {
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  preview: {
    backgroundColor: '#2d2d2d',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '20px',
  },
  previewTitle: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
  },
  promptText: {
    fontSize: '14px',
    color: '#4fc3f7',
    wordBreak: 'break-word',
    lineHeight: 1.5,
  },
  breakdown: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    fontSize: '12px',
    color: '#aaa',
  },
};

// ============================================
// 导出纯函数版本（用于Node.js服务端）
// ============================================

export { convertAngleToPrompt as multiAngleConvert };

// 使用示例
/*
// 方式1: 纯函数调用
import { convertAngleToPrompt } from './multiAngle_react';

const result = convertAngleToPrompt({
  rotate: 45,
  vertical: 30,
  zoom: 7,
  addAnglePrompt: true,
});
console.log(result.prompt);
// 输出: "front-right view, high angle, medium close-up (horizontal: 45, vertical: 30, zoom: 7.0)"

// 方式2: React组件
import { MultiAngleControl } from './multiAngle_react';

function App() {
  return (
    <MultiAngleControl
      onChange={(params, result) => {
        console.log('当前参数:', params);
        console.log('生成提示词:', result.prompt);
      }}
    />
  );
}

// 方式3: React Hook
import { useMultiAngle } from './multiAngle_react';

function MyComponent() {
  const { params, setRotate, result } = useMultiAngle();
  
  return (
    <div>
      <button onClick={() => setRotate(90)}>设置右侧视角</button>
      <p>{result.prompt}</p>
    </div>
  );
}
*/
