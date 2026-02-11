
import { GenerationConfig } from '../types/pebblingTypes';

// T8star API 配置接口
export interface ThirdPartyApiConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;           // 图片生成模型
  chatModel: string;       // 文本分析模型
}

// 默认配置
const DEFAULT_CONFIG: ThirdPartyApiConfig = {
  enabled: true,
  baseUrl: 'https://ai.t8star.cn',
  apiKey: '',
  model: 'nano-banana-2',
  chatModel: 'gemini-2.5-pro'
};

// 获取配置
export const getApiConfig = (): ThirdPartyApiConfig => {
  try {
    const saved = localStorage.getItem('t8star_api_config');
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load API config:', e);
  }
  return DEFAULT_CONFIG;
};

// 保存配置
export const saveApiConfig = (config: ThirdPartyApiConfig): void => {
  localStorage.setItem('t8star_api_config', JSON.stringify(config));
};

// 检查 API Key 是否已配置
export const isApiConfigured = (): boolean => {
  const config = getApiConfig();
  return !!(config.apiKey && config.apiKey.startsWith('sk-'));
};

// 辅助函数：File 转 base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 辅助函数：base64 字符串提取纯 base64
const extractBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
};

// 辅助函数：获取 MIME 类型
const getMimeType = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
};

// 重试机制
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  signal?: AbortSignal
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Check if aborted before each attempt
    if (signal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      return await fn();
    } catch (error) {
      // If aborted, don't retry
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// ===================== 文本生成 =====================

export const generateCreativeText = async (prompt: string): Promise<{ title: string; content: string }> => {
  const config = getApiConfig();
  
  if (!config.apiKey) {
    return { title: "未配置", content: "请先配置 API Key" };
  }

  try {
    const requestBody = {
      model: config.chatModel,
      messages: [
        { 
          role: 'system', 
          content: 'You are a creative assistant. Always respond in JSON format with "title" and "content" fields.' 
        },
        { 
          role: 'user', 
          content: `Expand this idea creatively: ${prompt}. Return JSON with 'title' and 'content'.` 
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    };

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
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

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content.trim();
      try {
        return JSON.parse(content);
      } catch {
        return { title: "创意", content };
      }
    }

    throw new Error('API 未返回有效响应');
  } catch (error) {
    console.error("Text Generation Error:", error);
    return { title: "错误", content: "生成失败，请检查 API 配置" };
  }
};

// ===================== 高级 LLM（带图像理解）=====================

export const generateAdvancedLLM = async (
  userPrompt: string, 
  systemInstruction?: string, 
  inputImages?: string[]
): Promise<string> => {
  const config = getApiConfig();
  
  if (!config.apiKey) {
    return "请先配置 API Key";
  }

  try {
    // 构建用户消息内容
    let userContent: any;
    
    if (inputImages && inputImages.length > 0) {
      // 带图片分析
      userContent = [
        { type: 'text', text: userPrompt }
      ];
      
      inputImages.forEach((img, index) => {
        const base64Data = extractBase64(img);
        const mimeType = getMimeType(img);
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64Data}` }
        });
      });
    } else {
      userContent = userPrompt;
    }

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: userContent });

    const requestBody = {
      model: config.chatModel,
      messages,
      max_tokens: 2000,
      temperature: 0.7
    };

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
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

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    }

    throw new Error('API 未返回有效响应');
  } catch (error) {
    console.error("Advanced LLM Error:", error);
    return "执行 LLM 请求失败";
  }
};

// ===================== 图像生成（文生图）- 异步模式 =====================

// 查询异步画图任务状态
interface ImageTaskStatus {
  code: string;
  message: string;
  data: {
    task_id: string;
    platform: string;
    action: string;
    status: 'IN_PROGRESS' | 'FAILURE' | 'SUCCESS';
    fail_reason: string;
    submit_time: number;
    start_time: number;
    finish_time: number;
    progress: string;
    data: {
      data: Array<{
        url?: string;
        b64_json?: string;
        revised_prompt?: string;
      }>;
      model: string;
      created: number;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}

// 轮询查询画图任务状态
const pollImageTaskStatus = async (
  config: ThirdPartyApiConfig,
  taskId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000,
  signal?: AbortSignal
): Promise<ImageTaskStatus> => {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const queryUrl = `${baseUrl}/v1/images/tasks/${taskId}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check if aborted
    if (signal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    console.log(`[贞贞API] 查询任务状态 (${attempt + 1}/${maxAttempts}): ${taskId}`);
    
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      signal
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`查询任务状态失败 (${response.status}): ${errorText}`);
    }
    
    const result: ImageTaskStatus = await response.json();
    console.log(`[贞贞API] 任务状态: ${result.data.status}, 进度: ${result.data.progress}`);
    
    if (result.data.status === 'SUCCESS') {
      return result;
    }
    
    if (result.data.status === 'FAILURE') {
      throw new Error(`任务失败: ${result.data.fail_reason || '未知错误'}`);
    }
    
    // 继续等待
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('任务查询超时，请稍后手动查询结果');
};

export const generateCreativeImage = async (prompt: string, genConfig?: GenerationConfig, signal?: AbortSignal): Promise<string | null> => {
  const config = getApiConfig();
  
  if (!config.apiKey) {
    console.error("API Key 未配置");
    return null;
  }

  try {
    // 映射宽高比
    let aspectRatio = '1:1';
    if (genConfig?.aspectRatio && genConfig.aspectRatio !== 'AUTO') {
      aspectRatio = genConfig.aspectRatio;
    }

    // 映射分辨率
    let imageSize: '1K' | '2K' | '4K' = '1K';
    if (genConfig?.resolution) {
      imageSize = genConfig.resolution as '1K' | '2K' | '4K';
    }

    const requestBody: any = {
      model: config.model,
      prompt: prompt,
      response_format: 'url',
      aspect_ratio: aspectRatio,
      image_size: imageSize
    };

    // 异步模式：创建任务
    const createResponse = await withRetry(async () => {
      const res = await fetch(`${config.baseUrl}/v1/images/generations?async=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API 请求失败 (${res.status}): ${errorText}`);
      }

      return res.json();
    }, 3, 1000, signal);

    console.log('[贞贞API] 创建任务响应:', createResponse);

    // 处理两种可能的响应格式：{task_id: string} 或 {code: 'success', data: 'task_id'}
    let taskId: string;
    if (createResponse.task_id) {
      taskId = createResponse.task_id;
    } else if (createResponse.code === 'success' && createResponse.data) {
      taskId = createResponse.data;
    } else {
      throw new Error(`API 错误: ${createResponse.message || createResponse.code || '未知错误'}`);
    }

    console.log('[贞贞API] 异步任务创建成功，task_id:', taskId);

    // 轮询查询任务状态
    const taskResult = await pollImageTaskStatus(config, taskId, 60, 5000, signal);
    console.log('[贞贞API] 任务查询结果:', JSON.stringify(taskResult, null, 2));

    if (taskResult.data?.data?.data && taskResult.data.data.data.length > 0) {
      const imageData = taskResult.data.data.data[0];
      console.log('[贞贞API] 任务完成，返回图片数据:', {
        hasUrl: !!imageData.url,
        hasB64: !!imageData.b64_json,
        url: imageData.url?.substring(0, 100) + '...'
      });
      const result = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null);
      if (!result) {
        throw new Error('API 返回的图片数据为空');
      }
      return result;
    }

    throw new Error('API 未返回图片');
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('Image generation was cancelled');
      return null;
    }
    console.error("Image Generation Error:", error);
    return null;
  }
};

// ===================== 图像编辑（图生图）- 异步模式 =====================

export const editCreativeImage = async (base64Images: string[], prompt: string, genConfig?: GenerationConfig, signal?: AbortSignal): Promise<string | null> => {
  const config = getApiConfig();
  
  if (!config.apiKey) {
    console.error("API Key 未配置");
    return null;
  }

  try {
    // 转换图片为正确格式
    const imageDataUrls = base64Images.map(img => {
      if (img.startsWith('data:')) {
        // 已经是 data URL 格式
        return img;
      } else if (img.startsWith('http://') || img.startsWith('https://')) {
        // 网络 URL，直接使用（API 支持 URL 输入）
        return img;
      }
      // 纯 base64 字符串，添加前缀
      return `data:image/png;base64,${img}`;
    });

    // 多图处理：在提示词中标注图片顺序（从上到下连接的顺序 = Image1, Image2, ...）
    let enhancedPrompt = prompt || "Enhance this image";
    if (base64Images.length > 1) {
      const imageLabels = base64Images.map((_, idx) => `Image${idx + 1}`).join(', ');
      enhancedPrompt = `[Input images in order: ${imageLabels}]\n\n${enhancedPrompt}`;
      console.log(`[贞贞多图] 检测到 ${base64Images.length} 张图片，已标注顺序:`, imageLabels);
    }

    // 构建请求体
    const requestBody: any = {
      model: config.model,
      prompt: enhancedPrompt,
      response_format: 'url',
      image: imageDataUrls
    };

    // AUTO 模式（genConfig 为 undefined）时不传递 aspect_ratio，让 API 根据原图尺寸自动决定
    if (genConfig?.aspectRatio && genConfig.aspectRatio !== 'AUTO') {
      requestBody.aspect_ratio = genConfig.aspectRatio;
    }

    // 分辨率配置
    if (genConfig?.resolution) {
      requestBody.image_size = genConfig.resolution;
    }

    // 异步模式：创建任务
    const createResponse = await withRetry(async () => {
      const res = await fetch(`${config.baseUrl}/v1/images/generations?async=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API 请求失败 (${res.status}): ${errorText}`);
      }

      return res.json();
    }, 3, 1000, signal);

    console.log('[贞贞API] 图生图创建任务响应:', createResponse);

    // 处理两种可能的响应格式：{task_id: string} 或 {code: 'success', data: 'task_id'}
    let taskId: string;
    if (createResponse.task_id) {
      taskId = createResponse.task_id;
    } else if (createResponse.code === 'success' && createResponse.data) {
      taskId = createResponse.data;
    } else {
      throw new Error(`API 错误: ${createResponse.message || createResponse.code || '未知错误'}`);
    }

    console.log('[贞贞API] 异步任务创建成功，task_id:', taskId);

    // 轮询查询任务状态
    const taskResult = await pollImageTaskStatus(config, taskId, 60, 5000, signal);

    if (taskResult.data?.data?.data && taskResult.data.data.data.length > 0) {
      const imageData = taskResult.data.data.data[0];
      console.log('[贞贞API] 图生图任务完成，返回图片数据:', {
        hasUrl: !!imageData.url,
        hasB64: !!imageData.b64_json,
        url: imageData.url?.substring(0, 100) + '...'
      });
      const result = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null);
      if (!result) {
        throw new Error('API 返回的图片数据为空');
      }
      return result;
    }

    throw new Error('API 未返回图片');
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('Image edit was cancelled');
      return null;
    }
    console.error("Image Edit Error:", error);
    return null;
  }
};

// ===================== 视频生成（暂不支持，返回提示）=====================

export const generateCreativeVideo = async (prompt: string, inputImageBase64?: string): Promise<string | null> => {
  const config = getApiConfig();
  
  // 尝试使用图像生成 API 生成视频的静态预览帧
  if (config.apiKey && prompt) {
    console.warn("视频生成功能暂不支持，将生成静态预览图像");
    
    // 生成视频场景的静态图像作为预览
    try {
      const previewPrompt = `Cinematic still frame from video: ${prompt}. High quality, 16:9 aspect ratio, film quality.`;
      const result = await generateCreativeImage(previewPrompt, { aspectRatio: '16:9', resolution: '1K' });
      
      if (result) {
        // 返回生成的预览图像（用户可以下载或用于其他用途）
        return result;
      }
    } catch (e) {
      console.error("Failed to generate video preview:", e);
    }
  }
  
  return null;
};

// ===================== 余额查询 =====================

export const checkBalance = async (): Promise<string | null> => {
  const config = getApiConfig();
  
  if (!config.apiKey) {
    return null;
  }

  const endpoints = [
    '/v1/dashboard/billing/credit_grants',
    '/v1/billing/credit_grants',
    '/v1/me'
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${config.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.total_granted !== undefined) {
          return `总额: $${data.total_granted?.toFixed(2)} | 已用: $${data.total_used?.toFixed(2)}`;
        } else if (data.balance !== undefined) {
          return `余额: $${data.balance?.toFixed(2)}`;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
};
