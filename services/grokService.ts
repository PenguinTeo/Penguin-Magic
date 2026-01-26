/**
 * Grok 视频生成服务
 * 使用 /v2/videos/generations 异步任务接口
 * 模型: grok-video-3
 */

// Grok 视频模型
export type GrokVideoModel = 'grok-video-3';

// 视频宽高比
export type GrokAspectRatio = '2:3' | '3:2' | '1:1';

// 视频分辨率
export type GrokResolution = '720P' | '1080P';

// 任务状态（与 Sora/Veo 统一）
export type GrokTaskStatus = 'NOT_START' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE' | 'PENDING' | 'RUNNING';

export interface GrokConfig {
  apiKey: string;
  baseUrl: string;
}

// 创建任务响应
interface GrokCreateResponse {
  task_id: string;
}

// 任务查询响应
interface GrokTaskResponse {
  task_id?: string;
  status?: string;
  progress?: string;
  fail_reason?: string;
  data?: {
    output?: string;  // 视频 URL
  };
}

export interface GrokGenerationParams {
  prompt: string;
  model?: GrokVideoModel;
  ratio?: GrokAspectRatio;        // 宽高比：2:3, 3:2, 1:1
  resolution?: GrokResolution;    // 分辨率：720P, 1080P
  images?: string[];              // 支持一张参考图
}

// 获取 Grok 配置
export function getGrokConfig(): GrokConfig {
  const saved = localStorage.getItem('grokConfig');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    apiKey: '',
    baseUrl: 'https://ai.t8star.cn'
  };
}

// 保存 Grok 配置
export function saveGrokConfig(config: GrokConfig) {
  localStorage.setItem('grokConfig', JSON.stringify(config));
}

/**
 * 将图片转换为 base64 格式 data URI
 */
export function imageToBase64DataUri(base64Content: string): string {
  if (base64Content.startsWith('data:image')) {
    return base64Content;
  }
  return `data:image/png;base64,${base64Content}`;
}

/**
 * 创建 Grok 视频生成任务
 * POST /v2/videos/generations
 */
export async function createGrokTask(params: GrokGenerationParams): Promise<string> {
  const config = getGrokConfig();
  
  if (!config.apiKey) {
    throw new Error('请先配置 Grok API Key');
  }

  const url = `${config.baseUrl}/v2/videos/generations`;

  // 构建请求体
  const requestBody: any = {
    prompt: params.prompt,
    model: params.model || 'grok-video-3',
  };

  // 添加可选参数
  if (params.ratio) {
    requestBody.ratio = params.ratio;
  }

  if (params.resolution) {
    requestBody.resolution = params.resolution;
  }

  // 图片列表（支持一张参考图）
  if (params.images && params.images.length > 0) {
    requestBody.images = params.images.map(img => imageToBase64DataUri(img));
    console.log('[Grok API] 图片数据检查:', {
      count: params.images.length,
      formats: params.images.map(img => ({
        isBase64: img.startsWith('data:'),
        isLocalPath: img.startsWith('/'),
        isHttpUrl: img.startsWith('http'),
        length: img.length,
        preview: img.slice(0, 100)
      }))
    });
  }

  console.log('[Grok API] 创建任务请求:', {
    url,
    model: requestBody.model,
    prompt: requestBody.prompt.slice(0, 100),
    ratio: requestBody.ratio,
    resolution: requestBody.resolution,
    imagesCount: params.images?.length || 0
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
      throw new Error(`Grok API 请求失败 (${response.status}): ${errorText}`);
    }

    const data: GrokCreateResponse = await response.json();
    console.log('[Grok API] 任务创建响应:', data);
    
    if (!data.task_id) {
      throw new Error(`Grok 任务创建失败: ${JSON.stringify(data)}`);
    }
    
    return data.task_id;
  } catch (error) {
    console.error('[Grok API] 创建任务失败:', error);
    throw error;
  }
}

/**
 * 查询 Grok 任务状态
 * GET /v2/videos/generations/{taskId}
 */
export async function getGrokTaskStatus(taskId: string): Promise<{
  status: GrokTaskStatus;
  progress: number;
  videoUrl?: string;
  failReason?: string;
}> {
  const config = getGrokConfig();
  
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
      throw new Error(`Grok 查询任务失败 (${response.status}): ${errorText}`);
    }

    const result: GrokTaskResponse = await response.json();
    
    console.log('[Grok API] 原始响应:', JSON.stringify(result, null, 2));
    
    // 解析状态
    const rawStatus = result.status || '';
    const rawProgress = result.progress;
    const videoUrl = result.data?.output;
    const failReason = result.fail_reason;
    
    // 转换 status
    let status: GrokTaskStatus = 'NOT_START';
    const statusLower = rawStatus.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success') {
      status = 'SUCCESS';
    } else if (statusLower === 'running' || statusLower === 'in_progress') {
      status = 'IN_PROGRESS';
    } else if (statusLower === 'failed' || statusLower === 'failure') {
      status = 'FAILURE';
    } else if (statusLower === 'pending' || statusLower === 'not_start') {
      status = 'NOT_START';
    }
    
    // 解析进度
    let progress = 0;
    if (typeof rawProgress === 'number') {
      progress = rawProgress;
    } else if (typeof rawProgress === 'string') {
      const progressMatch = rawProgress.match(/(\d+)/);
      progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
    }
    
    console.log('[Grok API] 解析后状态:', { status, progress, hasVideoUrl: !!videoUrl, failReason });

    return {
      status,
      progress,
      videoUrl,
      failReason
    };
  } catch (error) {
    console.error('[Grok API] 获取任务状态失败:', error);
    throw error;
  }
}

/**
 * 轮询等待 Grok 视频生成完成
 */
export async function waitForGrokCompletion(
  taskId: string,
  onProgress?: (progress: number, status: string) => void,
  maxAttempts: number = 60,  // 最多等待10分钟
  interval: number = 10000   // 每10秒查询一次
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const task = await getGrokTaskStatus(taskId);

    // 回调进度
    if (onProgress) {
      onProgress(task.progress, task.status);
    }

    if (task.status === 'SUCCESS') {
      if (task.videoUrl) {
        return task.videoUrl;
      }
      throw new Error('Grok 视频生成成功但未返回 URL');
    }

    if (task.status === 'FAILURE') {
      throw new Error(task.failReason || 'Grok 视频生成失败');
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Grok 视频生成超时');
}

/**
 * 完整的 Grok 视频生成流程
 * 创建任务 -> 轮询等待 -> 返回视频 URL
 */
export async function createGrokVideo(
  prompt: string,
  options?: {
    model?: GrokVideoModel;
    ratio?: GrokAspectRatio;
    resolution?: GrokResolution;
    images?: string[];
    onProgress?: (progress: number, status: string) => void;
  }
): Promise<string> {
  // 1. 创建任务
  const taskId = await createGrokTask({
    prompt,
    model: options?.model || 'grok-video-3',
    ratio: options?.ratio,
    resolution: options?.resolution,
    images: options?.images,
  });

  console.log('[Grok] 任务已创建, taskId:', taskId);

  // 2. 轮询等待完成
  const videoUrl = await waitForGrokCompletion(
    taskId,
    options?.onProgress
  );

  return videoUrl;
}
