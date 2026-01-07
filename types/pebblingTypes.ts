
export type NodeType = 'text' | 'image' | 'idea' | 'edit' | 'video' | 'combine' | 'llm' | 'resize' | 'relay' | 'remove-bg' | 'upscale';

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

export interface GenerationConfig {
  aspectRatio?: string; // "1:1", "16:9", "9:16", "4:3" - 可选，不传则保持原图比例
  resolution?: string; // "1K", "2K", "4K"
}

export interface NodeData {
  crop?: { x: number; y: number; scale: number };
  prompt?: string; // Main User Prompt
  systemInstruction?: string; // System Context/Persona
  settings?: Record<string, any>;
  files?: Array<{ name: string; type: string; data: string }>; // Base64 files
  
  // Resize Node Specifics
  resizeMode?: 'longest' | 'shortest' | 'width' | 'height' | 'exact';
  resizeWidth?: number;
  resizeHeight?: number;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: NodeType;
  content: string; // Text content or Image Base64/URL
  title?: string;
  data?: NodeData;
  isEditing?: boolean;
  status?: NodeStatus;
}

export interface Connection {
  id: string;
  fromNode: string;
  toNode: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface PresetInput {
  nodeId: string;
  field: 'content' | 'prompt' | 'systemInstruction';
  label: string; // User defined label e.g., "Main Topic"
  defaultValue: string;
}

export interface CanvasPreset {
  id: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  connections: Connection[];
  inputs: PresetInput[];
}

// 北极冰原配色方案 - 低饱和度冷色调
export const ARCTIC_COLORS = {
  // 冰川蓝 - Image类节点（image/edit/remove-bg/upscale/resize）
  glacierBlue: 'rgb(125, 163, 184)',
  glacierBlueLight: 'rgb(168, 197, 214)',
  
  // 苔原灰绿 - Text类节点（text/idea）
  tundraGreen: 'rgb(158, 179, 168)',
  tundraGreenLight: 'rgb(184, 207, 194)',
  
  // 极光紫灰 - LLM类节点
  auroraViolet: 'rgb(168, 155, 184)',
  auroraVioletLight: 'rgb(194, 184, 207)',
  
  // 冰雪白蓝 - Video类节点
  snowBlue: 'rgb(184, 197, 207)',
  snowBlueLight: 'rgb(209, 220, 229)',
  
  // 冰原灰 - Default/Relay节点
  arcticGray: 'rgb(155, 163, 171)',
  arcticGrayLight: 'rgb(184, 192, 200)',
} as const;

// 节点类型颜色映射
export const getNodeTypeColor = (type: NodeType): { primary: string; light: string } => {
  switch (type) {
    case 'image':
    case 'edit':
    case 'remove-bg':
    case 'upscale':
    case 'resize':
      return { primary: ARCTIC_COLORS.glacierBlue, light: ARCTIC_COLORS.glacierBlueLight };
    
    case 'text':
    case 'idea':
      return { primary: ARCTIC_COLORS.tundraGreen, light: ARCTIC_COLORS.tundraGreenLight };
    
    case 'llm':
      return { primary: ARCTIC_COLORS.auroraViolet, light: ARCTIC_COLORS.auroraVioletLight };
    
    case 'video':
      return { primary: ARCTIC_COLORS.snowBlue, light: ARCTIC_COLORS.snowBlueLight };
    
    default:
      return { primary: ARCTIC_COLORS.arcticGray, light: ARCTIC_COLORS.arcticGrayLight };
  };
};
