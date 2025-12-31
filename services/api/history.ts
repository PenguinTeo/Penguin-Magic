// 历史记录相关 API - 本地版本
import { get, post, del } from './index';
import { GenerationHistory } from '../../types';

// 获取所有历史记录
export const getAllHistory = async (): Promise<{ success: boolean; data?: GenerationHistory[]; error?: string }> => {
  return get<GenerationHistory[]>('/history');
};

// 获取历史记录列表（兼容旧接口）
export const getHistoryList = async (page: number = 1, limit: number = 20): Promise<{ 
  success: boolean; 
  data?: {
    items: GenerationHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }; 
  error?: string 
}> => {
  const result = await get<GenerationHistory[]>('/history');
  if (result.success && result.data) {
    const items = result.data;
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      success: true,
      data: {
        items: items.slice(start, end),
        total: items.length,
        page,
        limit,
        totalPages: Math.ceil(items.length / limit),
      },
    };
  }
  return { success: false, error: 'error' in result ? result.error : '请求失败' };
};

// 获取单条历史记录
export const getHistoryById = async (id: number): Promise<{ success: boolean; data?: GenerationHistory; error?: string }> => {
  const result = await get<GenerationHistory[]>('/history');
  if (result.success && result.data) {
    const item = result.data.find(h => h.id === id);
    if (item) {
      return { success: true, data: item };
    }
    return { success: false, error: '记录不存在' };
  }
  return { success: false, error: 'error' in result ? result.error : '请求失败' };
};

// 创建历史记录
export const createHistory = async (history: Omit<GenerationHistory, 'id'>): Promise<{ success: boolean; data?: GenerationHistory; error?: string }> => {
  return post<GenerationHistory>('/history', history);
};

// 删除历史记录
export const deleteHistory = async (id: number): Promise<{ success: boolean; error?: string; message?: string }> => {
  return del(`/history/${id}`);
};

// 清空所有历史记录
export const clearAllHistory = async (): Promise<{ success: boolean; error?: string; message?: string }> => {
  return del('/history');
};
