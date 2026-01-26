/**
 * RH香蕉 (全能图片PRO) API 服务
 * 支持文生图和图生图，支持官方/非官方API
 * 通过后端代理调用（后端存储API Key）
 */

// 分辨率选项
export type BananaResolution = '1K' | '2K' | '4K';

// 宽高比选项（对标Magic，支持AUTO）
export type BananaAspectRatio = 'AUTO' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '3:5' | '5:3' | '4:5' | '5:4' | '16:9' | '9:16' | '21:9';

// 任务状态
export type BananaTaskStatus = 'QUEUED' | 'RUNNING' | 'FAILED' | 'SUCCESS';

// 任务结果
export interface BananaTaskResult {
  url: string;
  outputType: string;
}

// API响应
export interface BananaApiResponse {
  taskId: string;
  status: BananaTaskStatus;
  errorCode: string | null;
  errorMessage: string | null;
  results: BananaTaskResult[] | null;
  clientId: string | null;
  promptTips: string | null;
}

// 文生图参数
export interface TextToImageParams {
  prompt: string;
  resolution: BananaResolution;
  aspectRatio: BananaAspectRatio;
}

// 图生图参数
export interface ImageToImageParams {
  prompt: string;
  resolution?: BananaResolution;
  aspectRatio?: BananaAspectRatio;
  imageUrls: string[];
}

/**
 * 文生图 - 通过后端代理
 */
export const bananaTextToImage = async (params: TextToImageParams, official: boolean = true): Promise<BananaApiResponse> => {
  const response = await fetch('/api/runninghub/banana/text-to-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      resolution: params.resolution,
      aspectRatio: params.aspectRatio !== 'AUTO' ? params.aspectRatio : undefined,
      official
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败 (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 图生图 - 通过后端代理
 */
export const bananaImageToImage = async (params: ImageToImageParams, official: boolean = true): Promise<BananaApiResponse> => {
  const response = await fetch('/api/runninghub/banana/image-to-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      resolution: params.resolution,
      aspectRatio: params.aspectRatio !== 'AUTO' ? params.aspectRatio : undefined,
      imageUrls: params.imageUrls,
      official
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败 (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 查询任务状态 - 通过后端代理
 */
export const bananaQueryTask = async (taskId: string): Promise<BananaApiResponse> => {
  const response = await fetch('/api/runninghub/banana/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`查询失败 (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 轮询等待任务完成
 */
export const bananaWaitForCompletion = async (
  taskId: string,
  onProgress?: (status: BananaTaskStatus, message?: string) => void,
  maxAttempts: number = 120,
  intervalMs: number = 3000
): Promise<BananaApiResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await bananaQueryTask(taskId);

    if (onProgress) {
      onProgress(result.status, result.status === 'RUNNING' ? '生成中...' : undefined);
    }

    if (result.status === 'SUCCESS') {
      return result;
    }

    if (result.status === 'FAILED') {
      throw new Error(result.errorMessage || '任务失败');
    }

    // QUEUED 或 RUNNING，继续等待
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('任务超时');
};

/**
 * 上传图片到RH获取URL（复用现有逻辑）
 */
export const uploadImageForBanana = async (imageData: string): Promise<string> => {
  // 如果已经是完整URL，直接返回
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }
  
  // 如果是本地路径，先转为base64
  let base64Data = imageData;
  if (imageData.startsWith('/files/')) {
    const response = await fetch(`${window.location.origin}${imageData}`);
    const blob = await response.blob();
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // 调用现有的RH上传接口
  const response = await fetch('/api/runninghub/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image: base64Data })
  });

  const result = await response.json();
  if (result.success && result.data?.fileName) {
    // RH上传返回的是fileName，需要拼接成完整URL
    // 根据RH文档，上传的文件URL格式为: https://rh-images-switch-1252422369.cos.ap-guangzhou.myqcloud.com/input/openapi/{fileName}
    const fileName = result.data.fileName;
    // 如果已经是完整URL
    if (fileName.startsWith('http')) {
      return fileName;
    }
    // 拼接完整URL
    return `https://rh-images-switch-1252422369.cos.ap-guangzhou.myqcloud.com/input/openapi/${fileName}`;
  }
  throw new Error(result.error || '图片上传失败');
};

/**
 * 执行香蕉生成任务
 */
export const executeBananaTask = async (
  prompt: string,
  options: {
    mode: 'text2image' | 'image2image';
    resolution: BananaResolution;
    aspectRatio: BananaAspectRatio;
    imageUrls?: string[];
    official?: boolean;
  },
  onProgress?: (status: BananaTaskStatus, message?: string) => void
): Promise<{ url: string; outputType: string }> => {
  let response: BananaApiResponse;
  const official = options.official !== false; // 默认官方

  if (options.mode === 'text2image') {
    response = await bananaTextToImage({
      prompt,
      resolution: options.resolution,
      aspectRatio: options.aspectRatio
    }, official);
  } else {
    if (!options.imageUrls || options.imageUrls.length === 0) {
      throw new Error('图生图需要提供图片');
    }
    response = await bananaImageToImage({
      prompt,
      resolution: options.resolution,
      aspectRatio: options.aspectRatio,
      imageUrls: options.imageUrls
    }, official);
  }

  console.log('[Banana] 任务已提交:', response.taskId);

  if (onProgress) {
    onProgress('QUEUED', '排队中...');
  }

  // 等待完成
  const finalResult = await bananaWaitForCompletion(response.taskId, onProgress);

  if (finalResult.results && finalResult.results.length > 0) {
    return finalResult.results[0];
  }

  throw new Error('未获取到生成结果');
};
