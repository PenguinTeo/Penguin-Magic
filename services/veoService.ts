/**
 * Google Veo3.1 视频生成服务
 * 使用 /v2/videos/generations 接口
 * 参考文档: veo3.1.md
 */

// Veo 模型类型 - veo3.1 系列7个模型
export type VeoModel = 
  | 'veo3.1-fast'           // 快速模式
  | 'veo3.1'                // 标准模式
  | 'veo3.1-4k'             // 4K 标准
  | 'veo3.1-pro'            // 高质量
  | 'veo3.1-pro-4k'         // 4K 高质量
  | 'veo3.1-components'     // 多图参考
  | 'veo3.1-components-4k'; // 4K 多图参考

// Veo 视频模式
export type VeoVideoMode = 
  | 'text2video'      // 文生视频（不传图）
  | 'image2video'     // 图生视频（单图）
  | 'keyframes'       // 首尾帧视频（2张图，上下坐标关系）
  | 'multi-reference';// 多图参考（1-3张）

// 视频宽高比
export type VeoAspectRatio = '16:9' | '9:16';

// 任务状态
export type VeoTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILURE';

export interface VeoConfig {
  apiKey: string;
  baseUrl: string;
}

// Veo 创建任务响应 - 支持新旧两种格式
interface VeoCreateResponse {
  // 新格式: { task_id: "xxx" }
  task_id?: string;
  // 旧格式: { code: "success", data: "xxx" }
  code?: string;
  data?: string;
}

// Veo 任务查询响应 - v2 API 格式
interface VeoTaskResponse {
  task_id?: string;
  platform?: string;
  action?: string;
  status?: string;           // "SUCCESS" | "RUNNING" | "FAILURE" | "PENDING"
  fail_reason?: string;
  submit_time?: number;
  start_time?: number;
  finish_time?: number;
  progress?: string;         // "100%"
  data?: {
    output?: string;         // 视频 URL
  };
  cost?: number;
}

export interface VeoGenerationParams {
  prompt: string;
  model?: VeoModel;
  images?: string[];       // Base64 格式的图片数组
  aspectRatio?: VeoAspectRatio;
  seed?: number;
  enhancePrompt?: boolean;
  enableUpsample?: boolean;
}

// 获取 Veo 配置
export function getVeoConfig(): VeoConfig {
  const saved = localStorage.getItem('veoConfig');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    apiKey: '',
    baseUrl: 'https://ai.t8star.cn'
  };
}

// 保存 Veo 配置
export function saveVeoConfig(config: VeoConfig) {
  localStorage.setItem('veoConfig', JSON.stringify(config));
}

/**
 * 根据视频模式和图片数量自动选择合适的模型
 */
export function autoSelectVeoModel(mode: VeoVideoMode, imageCount: number): VeoModel {
  switch (mode) {
    case 'text2video':
      return 'veo3.1-fast';
    case 'image2video':
      return 'veo3.1-fast';
    case 'keyframes':
      return 'veo3.1-pro'; // 首尾帧用 pro
    case 'multi-reference':
      return 'veo3.1-components'; // 多图参考
    default:
      return 'veo3.1-fast';
  }
}

/**
 * 将图片转换为 base64 格式 data URI
 */
export function imageToBase64DataUri(base64Content: string): string {
  // 如果已经是 data URI 格式，直接返回
  if (base64Content.startsWith('data:image')) {
    return base64Content;
  }
  // 否则添加前缀
  return `data:image/png;base64,${base64Content}`;
}

/**
 * 创建 Veo 视频生成任务
 * POST /v2/videos/generations
 */
export async function createVeoTask(params: VeoGenerationParams): Promise<string> {
  const config = getVeoConfig();
  
  if (!config.apiKey) {
    throw new Error('请先配置 Veo API Key');
  }

  const url = `${config.baseUrl}/v2/videos/generations`;

  // 构建请求体
  const requestBody: any = {
    prompt: params.prompt,
    model: params.model || 'veo3.1-fast',
  };

  // 添加可选参数
  if (params.enhancePrompt !== undefined) {
    requestBody.enhance_prompt = params.enhancePrompt;
  }

  // seed > 0 时才写入
  if (params.seed && params.seed > 0) {
    requestBody.seed = params.seed;
  }

  // aspect_ratio 仅在非 components 系列模型时写入
  const isComponentsModel = params.model?.includes('components');
  if (params.aspectRatio && !isComponentsModel) {
    requestBody.aspect_ratio = params.aspectRatio;
  }

  // enable_upsample 仅在非 components 系列模型时写入
  if (params.enableUpsample !== undefined && !isComponentsModel) {
    requestBody.enable_upsample = params.enableUpsample;
  }

  // 图片列表（图生视频或多图参考）
  if (params.images && params.images.length > 0) {
    requestBody.images = params.images.map(img => imageToBase64DataUri(img));
  }

  console.log('[Veo API] 创建任务请求:', {
    url,
    model: requestBody.model,
    prompt: requestBody.prompt.slice(0, 100),
    imagesCount: params.images?.length || 0,
    aspectRatio: requestBody.aspect_ratio,
    enhancePrompt: requestBody.enhance_prompt,
    enableUpsample: requestBody.enable_upsample
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo API 请求失败 (${response.status}): ${errorText}`);
    }

    const data: VeoCreateResponse = await response.json();
    console.log('[Veo API] 任务创建响应:', data);
    
    // 支持新旧两种响应格式
    const taskId = data.task_id || data.data;
    
    if (!taskId) {
      throw new Error(`Veo 任务创建失败: ${JSON.stringify(data)}`);
    }
    
    return taskId; // 返回 task_id
  } catch (error) {
    console.error('[Veo API] 创建任务失败:', error);
    throw error;
  }
}

/**
 * 查询 Veo 任务状态
 * GET /v2/videos/generations/{taskId}
 */
export async function getVeoTaskStatus(taskId: string): Promise<{
  status: VeoTaskStatus;
  progress: number;
  videoUrl?: string;
  failReason?: string;
}> {
  const config = getVeoConfig();
  
  const url = `${config.baseUrl}/v2/videos/generations/${taskId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo 查询任务失败 (${response.status}): ${errorText}`);
    }

    const result: VeoTaskResponse = await response.json();
    
    // 🔍 调试：打印完整原始响应
    console.log('[Veo API] 原始响应:', JSON.stringify(result, null, 2));
    
    // 解析新的 v2 API 响应格式
    // 结构: { task_id, status, progress, data: { output: "url" } }
    const rawStatus = result.status || '';
    const rawProgress = result.progress;
    // 视频 URL 在 data.output 字段
    const videoUrl = (result.data as any)?.output;
    const failReason = result.fail_reason;
    
    // 转换 status: "completed" -> "SUCCESS", "running" -> "RUNNING", "failed" -> "FAILURE"
    let status: VeoTaskStatus = 'PENDING';
    const statusLower = rawStatus.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success') {
      status = 'SUCCESS';
    } else if (statusLower === 'running' || statusLower === 'in_progress') {
      status = 'RUNNING';
    } else if (statusLower === 'failed' || statusLower === 'failure') {
      status = 'FAILURE';
    } else if (statusLower === 'pending' || statusLower === 'not_start') {
      status = 'PENDING';
    }
    
    // 解析进度
    let progress = 0;
    if (typeof rawProgress === 'number') {
      progress = rawProgress;
    } else if (typeof rawProgress === 'string') {
      const progressMatch = rawProgress.match(/(\d+)/);
      progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
    }
    
    console.log('[Veo API] 解析后状态:', { status, progress, hasVideoUrl: !!videoUrl, failReason });

    return {
      status,
      progress,
      videoUrl,
      failReason
    };
  } catch (error) {
    console.error('[Veo API] 获取任务状态失败:', error);
    throw error;
  }
}

/**
 * 轮询等待 Veo 视频生成完成
 */
export async function waitForVeoCompletion(
  taskId: string,
  onProgress?: (progress: number, status: VeoTaskStatus) => void,
  maxAttempts: number = 60,  // 最多等待10分钟
  interval: number = 10000   // 每10秒查询一次
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const task = await getVeoTaskStatus(taskId);

    // 回调进度
    if (onProgress) {
      onProgress(task.progress, task.status);
    }

    if (task.status === 'SUCCESS') {
      if (task.videoUrl) {
        return task.videoUrl;
      }
      throw new Error('Veo 视频生成成功但未返回 URL');
    }

    if (task.status === 'FAILURE') {
      throw new Error(task.failReason || 'Veo 视频生成失败');
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Veo 视频生成超时');
}

/**
 * 完整的 Veo 视频生成流程
 * 创建任务 -> 轮询等待 -> 返回视频 URL
 */
export async function createVeoVideo(
  prompt: string,
  options?: {
    mode?: VeoVideoMode;
    model?: VeoModel;
    images?: string[];
    aspectRatio?: VeoAspectRatio;
    seed?: number;
    enhancePrompt?: boolean;
    enableUpsample?: boolean;
    onProgress?: (progress: number, status: VeoTaskStatus) => void;
  }
): Promise<string> {
  // 自动选择模型（如果未指定）
  const model = options?.model || autoSelectVeoModel(
    options?.mode || 'text2video',
    options?.images?.length || 0
  );

  // 1. 创建任务
  const taskId = await createVeoTask({
    prompt,
    model,
    images: options?.images,
    aspectRatio: options?.aspectRatio,
    seed: options?.seed,
    enhancePrompt: options?.enhancePrompt,
    enableUpsample: options?.enableUpsample,
  });

  console.log('[Veo] 任务已创建, taskId:', taskId);

  // 2. 轮询等待完成
  const videoUrl = await waitForVeoCompletion(
    taskId,
    options?.onProgress
  );

  return videoUrl;
}
