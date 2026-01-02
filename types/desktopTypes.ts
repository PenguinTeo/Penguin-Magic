/**
 * 桌面交互模式类型
 * 用于替代多个 boolean 状态，避免非法组合
 */

// 桌面主要交互模式
export type DesktopMode = 
  | 'idle'           // 空闲状态
  | 'dragging'       // 拖拽项目中
  | 'selecting'      // 框选中
  | 'file-dropping'  // 外部文件拖入中
  | 'exporting';     // 导出中

// 桌面模式工具函数
export const DesktopModeUtils = {
  // 检查是否处于交互状态（不可进行其他交互）
  isInteracting: (mode: DesktopMode): boolean => {
    return mode !== 'idle';
  },
  
  // 检查是否可以开始拖拽
  canStartDrag: (mode: DesktopMode): boolean => {
    return mode === 'idle';
  },
  
  // 检查是否可以开始框选
  canStartSelect: (mode: DesktopMode): boolean => {
    return mode === 'idle';
  },
  
  // 检查是否可以接收文件拖放
  canReceiveFileDrop: (mode: DesktopMode): boolean => {
    return mode === 'idle' || mode === 'file-dropping';
  },
};

// 桌面上下文菜单状态
export interface ContextMenuState {
  x: number;
  y: number;
  itemId?: string;
}

// 剪贴板状态
export interface ClipboardState {
  items: any[];
  action: 'copy' | 'cut';
}

// 选区框状态
export interface SelectionBoxState {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

// 拖拽状态
export interface DragState {
  itemId: string;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number } | null;
  targetFolderId: string | null;
}
