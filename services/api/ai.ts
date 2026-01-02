// AI 代理相关 API - 通过后端调用 AI 服务
import { get, post } from './index';
import { ThirdPartyApiConfig, NanoBananaRequest, NanoBananaResponse, OpenAIChatRequest, OpenAIChatResponse } from '../../types';

// 获取 API 配置
export const getAiConfig = async (): Promise<{ success: boolean; data?: Partial<ThirdPartyApiConfig>; error?: string }> => {
  return get<Partial<ThirdPartyApiConfig>>('/ai/config');
};

// 设置 API 配置
export const setAiConfig = async (config: Partial<ThirdPartyApiConfig>): Promise<{ success: boolean; data?: Partial<ThirdPartyApiConfig>; error?: string }> => {
  return post<Partial<ThirdPartyApiConfig>>('/ai/config', config);
};

// 图像生成
export const generateImage = async (request: NanoBananaRequest): Promise<{ success: boolean; data?: NanoBananaResponse; error?: string }> => {
  return post<NanoBananaResponse>('/ai/generate-image', request);
};

// AI 聊天（用于文本分析）
export const chatCompletion = async (request: OpenAIChatRequest): Promise<{ success: boolean; data?: OpenAIChatResponse; error?: string }> => {
  return post<OpenAIChatResponse>('/ai/chat', request);
};

// 测试 API 连接
export const testConnection = async (baseUrl: string, apiKey: string): Promise<{ success: boolean; data?: any; error?: string; message?: string }> => {
  return post('/ai/test-connection', { baseUrl, apiKey });
};

// 通用代理请求
export const proxyRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  data?: any,
  config?: Partial<ThirdPartyApiConfig>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  return post('/ai/proxy', { endpoint, method, data, config });
};

// 图片分析（通过后端的 AI 聊天接口）
export const analyzeImage = async (
  imageBase64: string,
  systemInstruction: string,
  userMessage: string,
  model: string = 'gemini-2.5-pro'
): Promise<{ success: boolean; data?: string; error?: string }> => {
  const request: OpenAIChatRequest = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      {
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.7,
  };

  const result = await chatCompletion(request);
  
  if (result.success && result.data?.choices?.[0]?.message?.content) {
    return {
      success: true,
      data: result.data.choices[0].message.content,
    };
  }

  return {
    success: false,
    error: result.error || '分析失败',
  };
};
