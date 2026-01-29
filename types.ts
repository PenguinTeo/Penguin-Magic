
export interface GeneratedContent {
  text: string | null;
  imageUrl: string | null;
  originalFiles?: File[]; // 保存生成时使用的所有原始图片，用于重新生成（支持多图）
  coinsDeducted?: number; // 本次扣除的 Pebbling 鹅卵石
  coinsRemaining?: number; // 扣除后的余额
}

export enum ApiStatus {
  Idle = 'Idle',
  Loading = 'Loading',
  Success = 'Success',
  Error = 'Error',
}

export interface SmartPlusComponent {
  id: number;
  label: string;
  enabled: boolean;
  features: string;
}

export type SmartPlusConfig = SmartPlusComponent[];

export type BPFieldType = 'input' | 'agent';

export type BPAgentModel = 'gemini-2.5-flash' | 'gemini-3-pro-preview';

export interface BPField {
  id: string;
  type: BPFieldType;
  name: string; // Variable name without prefix. e.g. "role" for /role or {role}
  label: string; // Display label
  agentConfig?: {
    instruction: string; // The rule/prompt for the agent
    model: BPAgentModel;
  }
}

// 支持的宽高比类型
export type AspectRatioType = 'Auto' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2' | '1:1' | '4:5' | '5:4' | '21:9';

// 支持的分辨率类型
export type ImageSizeType = '1K' | '2K' | '4K';

// 创意分类类型
export type CreativeCategoryType = 'character' | 'scene' | 'product' | 'art' | 'tool' | 'other';

// 分类配置
export const CREATIVE_CATEGORIES: { key: CreativeCategoryType; label: string; icon: string }[] = [
  { key: 'character', label: '人物', icon: '👤' },
  { key: 'scene', label: '场景', icon: '🏞️' },
  { key: 'product', label: '产品', icon: '📦' },
  { key: 'art', label: '艺术', icon: '🎨' },
  { key: 'tool', label: '工具', icon: '🔧' },
  { key: 'other', label: '其他', icon: '📁' },
];

export interface CreativeIdea {
  id: number;
  title: string;
  prompt: string; // Template string
  imageUrl: string;
  author?: string; // 作者，显示为 @xxx
  category?: CreativeCategoryType; // 分类
  isSmart?: boolean;
  isSmartPlus?: boolean;
  isBP?: boolean;
  isRunningHub?: boolean; // 新增：RunningHub 工作流
  isFavorite?: boolean; // 新增：是否收藏
  isCloudIdea?: boolean; // 新增：是否为云端创意
  smartPlusConfig?: SmartPlusConfig;
  bpFields?: BPField[]; // Renamed from bpVariables to support generic fields
  runningHubConfig?: RunningHubConfig; // 新增：RunningHub 配置
  order?: number;
  cost?: number; // 使用此创意库生成图片需要扣除的 Pebbling 鹅卵石数量 🪨
  createdAt?: string; // 创建时间

  // 画布工作流模式（节点图谱）
  isWorkflow?: boolean; // 是否为画布工作流
  workflowNodes?: WorkflowNode[]; // 工作流节点
  workflowConnections?: WorkflowConnection[]; // 工作流连接
  workflowInputs?: WorkflowInput[]; // 工作流可编辑输入

  // 建议的宽高比和分辨率
  suggestedAspectRatio?: AspectRatioType;
  suggestedResolution?: ImageSizeType;

  // 权限设置（用于BP/SmartPlus模式）
  allowViewPrompt?: boolean;  // 是否允许查看提示词
  allowEditPrompt?: boolean;  // 是否允许编辑提示词

  // Deprecated but kept for type compatibility during migration if needed
  bpVariables?: any[];
}

// 工作流节点类型
export type WorkflowNodeType = 'text' | 'image' | 'idea' | 'edit' | 'video' | 'llm' | 'resize' | 'relay' | 'remove-bg' | 'upscale';

// 工作流节点
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title?: string;
  content: string; // 文本内容或图片URL
  x: number;
  y: number;
  width: number;
  height: number;
  data?: {
    prompt?: string;
    systemInstruction?: string;
    settings?: Record<string, any>;
  };
}

// 工作流连接
export interface WorkflowConnection {
  id: string;
  fromNode: string;
  toNode: string;
}

// 工作流输入定义
export interface WorkflowInput {
  nodeId: string;
  field: 'content' | 'prompt' | 'systemInstruction';
  label: string; // 显示标签
  defaultValue: string;
}

// RunningHub 配置
export interface RunningHubConfig {
  workflowId: string;           // RunningHub 工作流 ID 或 AI 应用 ID (webappId)
  isAIApp?: boolean;            // 是否为 AI 应用 (使用 webappId)
  inputFields: RHInputField[];  // 用户输入字段定义
}

// RunningHub 输入字段
export interface RHInputField {
  id: string;
  type: 'text' | 'image' | 'select' | 'number';
  label: string;                // 显示标签
  placeholder?: string;         // 占位符
  required: boolean;
  nodeId: string;               // 对应的节点 ID
  fieldName: string;            // 对应的字段名
  options?: string[];           // select 类型的选项
  defaultValue?: string;        // 默认值
}

// RunningHub API 配置状态
export interface RHApiConfig {
  configured: boolean;
  baseUrl: string;
  apiKeyPreview: string | null;
}

// RunningHub AI 应用节点信息（从MAPI返回）
export interface RHAIAppNodeInfoItem {
  nodeId: string;
  nodeName: string;
  fieldName: string;
  fieldValue: string;
  fieldData?: string;
  fieldType: 'IMAGE' | 'STRING' | 'LIST' | 'AUDIO' | 'VIDEO';
  description: string;
  descriptionEn?: string;
}

// RunningHub AI 应用信息
export interface RHAIAppInfo {
  webappName: string;
  nodeInfoList: RHAIAppNodeInfoItem[];
  covers: Array<{
    id: string;
    url: string;
    thumbnailUri: string;
    imageWidth?: string;
    imageHeight?: string;
  }>;
  tags?: Array<{ id: string; name: string; nameEn?: string }>;
  statisticsInfo?: {
    likeCount: string;
    downloadCount: string;
    useCount: string;
    pv: string;
    collectCount: string;
  };
}

// RH 应用创意包项目
export interface RHAppPreset {
  id: string;           // 自动生成的唯一ID
  webappId: string;     // RunningHub AI应用ID
  title: string;        // 应用标题
  coverUrl?: string;    // 封面图URL
  addedAt: number;      // 添加时间戳
}

export interface PromptPreset {
  id: number;
  title: string;
  prompt: string;
}

// 第三方API配置
export interface ThirdPartyApiConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string; // 图片生成模型，默认使用 nano-banana-2
  chatModel?: string; // 分析模型，用于BP智能体和Smart模式，如 gemini-2.5-pro
}

// Nano-banana API 请求参数
export interface NanoBananaRequest {
  model: string;
  prompt: string;
  response_format?: 'url' | 'b64_json';
  aspect_ratio?: '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2' | '1:1' | '4:5' | '5:4' | '21:9';
  image?: string[]; // 参考图数组，url 或 b64_json
  image_size?: '1K' | '2K' | '4K';
  seed?: number; // 随机种子，用于重复生成相同结果或变化生成
}

// Nano-banana API 响应
export interface NanoBananaResponse {
  created?: number;
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

// OpenAI Chat API 请求 (用于文字处理)
export interface OpenAIChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 历史生图记录
export interface GenerationHistory {
  id: number;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  model: string; // 使用的模型
  isThirdParty: boolean; // 是否使用第三方API
  // 输入图片本地路径（用于重新生成）
  inputImagePaths?: string[];
  // 输入图片数据（兼容旧版本）
  inputImages?: Array<{ data: string; name: string; type: string }> | string[]; // 多图输入数据（新版对象数组 / 旧版字符串数组）
  inputImageData?: string; // 单图输入数据 (base64)
  inputImageName?: string; // 输入图片名称
  inputImageType?: string; // 输入图片类型
  // 创意库相关信息（用于重新生成时恢复）
  creativeTemplateId?: number; // 使用的创意库模板 ID
  creativeTemplateType?: 'smart' | 'smartPlus' | 'bp' | 'none'; // 创意库类型
  bpInputs?: Record<string, string>; // BP 模式的输入值
  smartPlusOverrides?: SmartPlusConfig; // SmartPlus 模式的配置
  coinsDeducted?: number; // 扣除的 Pebbling 鹅卵石数量
}

// 价格配置
export interface PriceConfig {
  generateImage: number;
  analyzeImage: number;
  chat: number;
}

// ========== 桌面系统类型 ==========

// 桌面项目类型
export type DesktopItemType = 'image' | 'folder' | 'stack' | 'video';

// 桌面项目位置
export interface DesktopPosition {
  x: number;
  y: number;
}

// 基础桌面项目
export interface BaseDesktopItem {
  id: string;
  type: DesktopItemType;
  name: string;
  position: DesktopPosition;
  createdAt: number;
  updatedAt: number;
}

// 图片项目
export interface DesktopImageItem extends BaseDesktopItem {
  type: 'image';
  imageUrl: string;
  thumbnailUrl?: string;
  prompt?: string;
  model?: string;
  isThirdParty?: boolean;
  historyId?: number; // 关联的历史记录ID
  // 多并发生成支持
  isLoading?: boolean; // 是否正在生成中
  loadingError?: string; // 生成失败的错误信息
}

// 文件夹项目
export interface DesktopFolderItem extends BaseDesktopItem {
  type: 'folder';
  color?: string; // 文件夹颜色
  icon?: string; // 自定义图标
  itemIds: string[]; // 包含的项目ID列表
  isOpen?: boolean; // 是否打开
}

// 叠放项目（Mac风格的堆叠显示）
export interface DesktopStackItem extends BaseDesktopItem {
  type: 'stack';
  itemIds: string[]; // 包含的图片ID列表
  isExpanded?: boolean; // 是否展开
}

// 视频项目
export interface DesktopVideoItem extends BaseDesktopItem {
  type: 'video';
  videoUrl: string;
  thumbnailUrl?: string;
  prompt?: string;
  duration?: number; // 视频时长（秒）
  isLoading?: boolean;
  loadingError?: string;
}

// 联合类型
export type DesktopItem = DesktopImageItem | DesktopFolderItem | DesktopStackItem | DesktopVideoItem;

// 桌面状态
export interface DesktopState {
  items: DesktopItem[];
  selectedIds: string[];
  openFolderId: string | null; // 当前打开的文件夹ID
  gridSize: number; // 网格大小
  showGrid: boolean; // 是否显示网格
}
