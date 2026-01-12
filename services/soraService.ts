/**
 * T8star Sora 视频生成服务
 * 使用 /v2/videos/generations 异步任务接口
 */

// 视频模型类型
export type VideoModel = 'sora-2' | 'sora-2-pro';

// 视频时长（仅 sora-2-pro 支持 25s）
export type VideoDuration = '10' | '15' | '25';

// 视频宽高比
export type VideoAspectRatio = '16:9' | '9:16';

// 任务状态
export type TaskStatus = 'NOT_START' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE';

export interface SoraConfig {
  apiKey: string;
  baseUrl: string;
}

// 视频生成响应
interface VideoGenerationResponse {
  task_id: string;
}

// 任务查询响应
interface TaskQueryResponse {
  task_id: string;
  status: TaskStatus;
  progress: string;  // 例如 "50%"
  fail_reason: string;
  data: {
    output?: string;  // 视频 URL
  } | null;
}

interface VideoGenerationParams {
  prompt: string;
  model?: VideoModel;
  images?: string[];  // 图片列表，支持 URL 或 base64
  aspectRatio?: VideoAspectRatio;
  hd?: boolean;       // 是否高清（仅 sora-2-pro）
  duration?: VideoDuration;
  watermark?: boolean;
}

// 获取 Sora 配置
export function getSoraConfig(): SoraConfig {
  const saved = localStorage.getItem('soraConfig');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    apiKey: '',
    baseUrl: 'https://ai.t8star.cn'
  };
}

// 保存 Sora 配置
export function saveSoraConfig(config: SoraConfig) {
  localStorage.setItem('soraConfig', JSON.stringify(config));
}

/**
 * 创建视频生成任务
 * POST /v2/videos/generations
 */
export async function createVideoTask(params: VideoGenerationParams): Promise<string> {
  const config = getSoraConfig();
  
  if (!config.apiKey) {
    throw new Error('请先配置 Sora API Key');
  }

  const url = new URL('/v2/videos/generations', config.baseUrl);

  const requestBody: any = {
    prompt: params.prompt,
    model: params.model || 'sora-2',
  };

  // 添加可选参数
  if (params.images && params.images.length > 0) {
    requestBody.images = params.images;
    console.log('[Sora API] 图片数据检查:', {
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
  if (params.aspectRatio) {
    requestBody.aspect_ratio = params.aspectRatio;
  }
  if (params.hd !== undefined) {
    requestBody.hd = params.hd;
  }
  if (params.duration) {
    requestBody.duration = params.duration;
  }
  if (params.watermark !== undefined) {
    requestBody.watermark = params.watermark;
  }

  console.log('Sora 创建任务请求:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    const data: VideoGenerationResponse = await response.json();
    console.log('Sora 任务创建成功:', data);
    
    return data.task_id;
  } catch (error) {
    console.error('Sora 创建任务失败:', error);
    throw error;
  }
}

/**
 * 查询任务状态
 * GET /v2/videos/generations/{taskId}
 */
export async function getTaskStatus(taskId: string): Promise<TaskQueryResponse> {
  const config = getSoraConfig();
  
  const url = new URL(`/v2/videos/generations/${taskId}`, config.baseUrl);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`查询任务失败 (${response.status}): ${errorText}`);
    }

    const result: TaskQueryResponse = await response.json();
    return result;
  } catch (error) {
    console.error('获取任务状态失败:', error);
    throw error;
  }
}

/**
 * 轮询等待视频生成完成
 */
export async function waitForVideoCompletion(
  taskId: string,
  onProgress?: (progress: number, status: string) => void,
  maxAttempts: number = 360,  // 最多等待30分钟
  interval: number = 5000     // 每5秒查询一次
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const task = await getTaskStatus(taskId);

    // 解析进度
    if (onProgress) {
      const progressMatch = task.progress?.match(/(\d+)/);
      const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;
      onProgress(progress, task.status);
    }

    if (task.status === 'SUCCESS') {
      if (task.data?.output) {
        return task.data.output;
      }
      throw new Error('视频生成成功但未返回 URL');
    }

    if (task.status === 'FAILURE') {
      throw new Error(task.fail_reason || '视频生成失败');
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('视频生成超时');
}

/**
 * 完整的视频生成流程
 * 创建任务 -> 轮询等待 -> 返回视频 URL
 */
export async function createVideo(
  prompt: string,
  options?: {
    model?: VideoModel;
    images?: string[];
    aspectRatio?: VideoAspectRatio;
    hd?: boolean;
    duration?: VideoDuration;
    watermark?: boolean;
    onProgress?: (progress: number, status: string) => void;
  }
): Promise<string> {
  // 1. 创建任务
  const taskId = await createVideoTask({
    prompt,
    model: options?.model,
    images: options?.images,
    aspectRatio: options?.aspectRatio,
    hd: options?.hd,
    duration: options?.duration,
    watermark: options?.watermark,
  });

  console.log('任务已创建, taskId:', taskId);

  // 2. 轮询等待完成
  const videoUrl = await waitForVideoCompletion(
    taskId,
    options?.onProgress
  );

  return videoUrl;
}
