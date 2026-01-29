
export type NodeType = 'text' | 'image' | 'idea' | 'edit' | 'video' | 'video-output' | 'frame-extractor' | 'combine' | 'llm' | 'resize' | 'relay' | 'remove-bg' | 'upscale' | 'bp' | 'runninghub' | 'rh-config' | 'rh-magic' | 'drawing-board' | 'browser' | 'image-compare';

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
  
  // 🔥 图片元数据(宽高/大小/格式)
  imageMetadata?: {
    width: number;
    height: number;
    size: string; // 格式化后的大小, 如 "125 KB"
    format: string; // 图片格式, 如 "PNG", "JPEG"
  };
  
  // Resize Node Specifics
  resizeMode?: 'longest' | 'shortest' | 'width' | 'height' | 'exact';
  resizeWidth?: number;
  resizeHeight?: number;
  
  // MultiAngle Node Specifics
  nodeMode?: '3d' | 'resize'; // 节点模式：3D旋转或调整尺寸
  angleRotate?: number; // 水平旋转角度
  angleVertical?: number; // 垂直旋转角度
  angleZoom?: number; // 缩放级别
  angleDetailMode?: boolean; // 是否精细模式
  anglePrompt?: string; // 3D生成提示词
  inputImageUrl?: string; // 输入图片URL
  previewImage?: string; // 预览图片
  
  // Video Node Specifics
  videoService?: 'sora' | 'veo' | 'grok';
  videoModel?: string;
  videoSize?: string;
  videoSeconds?: string;
  veoMode?: 'text2video' | 'image2video' | 'keyframes' | 'multi-reference';
  veoModel?: string;
  veoAspectRatio?: string;
  veoEnhancePrompt?: boolean;
  veoEnableUpsample?: boolean;
  grokRatio?: '2:3' | '3:2' | '1:1';        // Grok 视频宽高比
  grokResolution?: '720P' | '1080P';         // Grok 视频分辨率
  videoTaskId?: string;
  videoProgress?: number;
  videoTaskStatus?: string;
  videoFailReason?: string;
  videoUrl?: string; // 原始URL（下载失败时保留）
  output?: string; // LLM/BP节点输出
  
  // Frame Extractor Node Specifics
  sourceVideoUrl?: string; // 源视频URL
  currentFrameTime?: number; // 当前选中的帧时间（秒）
  videoDuration?: number; // 视频时长（秒）
  frameThumbnails?: string[]; // 帧缩略图列表
  
  // BP Node Specifics - 存储BP创意库配置
  bpTemplate?: {
    id: number;
    title: string;
    prompt: string; // 模板提示词
    bpFields?: Array<{
      id: string;
      type: 'input' | 'agent';
      name: string;
      label: string;
      agentConfig?: {
        instruction: string;
        model: string;
      };
    }>;
    imageUrl?: string; // 缩略图
  };
  bpInputs?: Record<string, string>; // 用户填写的BP输入值
  
  // RunningHub Node Specifics
  webappId?: string; // RunningHub AI应用ID
  appInfo?: {
    title?: string;
    webappName?: string;
    nodeInfoList?: Array<{
      nodeId: string;
      nodeName?: string;
      fieldName: string;
      fieldValue?: string;
      fieldData?: string;
      fieldType?: string;
      description?: string;
    }>;
    covers?: Array<{
      url?: string;
      thumbnailUri?: string;
    }>;
  };
  nodeInputs?: Record<string, string>; // 用户填写的应用参数
  outputUrl?: string; // RunningHub输出文件URL
  outputType?: string; // 输出文件类型
  coverUrl?: string; // 应用封面URL
  error?: string; // 错误信息
  
  // Drawing Board Node Specifics
  boardElements?: Array<{
    id: string;
    type: 'image' | 'text' | 'path' | 'rect' | 'circle' | 'line';
    x: number;
    y: number;
    width?: number;
    height?: number;
    imageUrl?: string;
    text?: string;
    fontSize?: number;
    color?: string;
    points?: Array<{ x: number; y: number }>;
    strokeWidth?: number;
    strokeColor?: string;
    fillColor?: string;
  }>;
  boardWidth?: number;
  boardHeight?: number;
  receivedImages?: string[]; // 接收到的上游图片URL列表
  outputImageUrl?: string; // 画板输出的PNG图片URL
  
  // Magic 节点统一配置（支持本地API和RunningHub两种来源）
  magicSource?: 'local' | 'runninghub'; // API来源：本地API / RunningHub
  bananaOfficial?: boolean; // RunningHub模式：官方/非官方（仅runninghub模式有效）
  bananaMode?: 'text2image' | 'image2image'; // 文生图/图生图
  bananaResolution?: '1K' | '2K' | '4K'; // 分辨率
  bananaAspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '16:9' | '9:16' | '21:9'; // 宽高比
  bananaTaskId?: string; // 任务ID
  bananaProgress?: string; // 进度信息
  
  // Browser Node Specifics
  browserUrl?: string; // 当前浏览URL
  browserTitle?: string; // 页面标题
  browserExpanded?: boolean; // 是否展开
  
  // Image Compare Node Specifics
  compareImage1?: string; // 图1（上方连接的图片）
  compareImage2?: string; // 图2（下方连接的图片）
  comparePosition?: number; // 滑块位置（0-100）
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
  toPortKey?: string; // rh-config 节点的参数端口标识
  toPortOffsetY?: number; // 端口相对于目标节点的 Y 偏移（连接时记录，渲染时直接使用）
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

// 节点组 - 可编辑区域，节点可拖入拖出
export interface NodeGroup {
  id: string;
  name: string;
  x: number;          // 组区域左上角X坐标
  y: number;          // 组区域左上角Y坐标
  width: number;      // 组区域宽度
  height: number;     // 组区域高度
  color?: string;     // 组边框颜色（可选）
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
  
  // BP蓝 - BP节点（智能体模式）
  bpBlue: 'rgb(96, 165, 250)',
  bpBlueLight: 'rgb(147, 197, 253)',
  
  // RunningHub深绿 - RunningHub节点
  rhGreen: 'rgb(16, 185, 129)',
  rhGreenLight: 'rgb(52, 211, 153)',
  
  // 画板橙色 - DrawingBoard节点
  boardOrange: 'rgb(245, 158, 11)',
  boardOrangeLight: 'rgb(251, 191, 36)',
  
  // 浏览器橙红 - Browser节点
  browserOrange: 'rgb(249, 115, 22)',
  browserOrangeLight: 'rgb(251, 146, 60)',
  
  // 对比紫 - ImageCompare节点
  comparePurple: 'rgb(168, 85, 247)',
  comparePurpleLight: 'rgb(192, 132, 252)',
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
    case 'video-output':
    case 'frame-extractor':
      return { primary: ARCTIC_COLORS.snowBlue, light: ARCTIC_COLORS.snowBlueLight };
    
    case 'bp':
      return { primary: ARCTIC_COLORS.bpBlue, light: ARCTIC_COLORS.bpBlueLight };
    
    case 'runninghub':
    case 'rh-config':
    case 'rh-magic':
      return { primary: ARCTIC_COLORS.rhGreen, light: ARCTIC_COLORS.rhGreenLight };
    
    case 'drawing-board':
      return { primary: ARCTIC_COLORS.boardOrange, light: ARCTIC_COLORS.boardOrangeLight };
    
    case 'browser':
      return { primary: ARCTIC_COLORS.browserOrange, light: ARCTIC_COLORS.browserOrangeLight };
    
    case 'image-compare':
      return { primary: ARCTIC_COLORS.comparePurple, light: ARCTIC_COLORS.comparePurpleLight };
    
    default:
      return { primary: ARCTIC_COLORS.arcticGray, light: ARCTIC_COLORS.arcticGrayLight };
  };
};
