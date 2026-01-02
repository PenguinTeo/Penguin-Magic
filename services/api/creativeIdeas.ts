// 创意库相关 API - 本地版本
import { get, post, put, del } from './index';
import { CreativeIdea } from '../../types';

// 获取所有创意
export const getAllCreativeIdeas = async (): Promise<{ success: boolean; data?: CreativeIdea[]; error?: string }> => {
  return get<CreativeIdea[]>('/creative-ideas');
};

// 获取单个创意
export const getCreativeIdeaById = async (id: number): Promise<{ success: boolean; data?: CreativeIdea; error?: string }> => {
  return get<CreativeIdea>(`/creative-ideas/${id}`);
};

// 创建创意
export const createCreativeIdea = async (idea: Omit<CreativeIdea, 'id'>): Promise<{ success: boolean; data?: CreativeIdea; error?: string }> => {
  return post<CreativeIdea>('/creative-ideas', idea);
};

// 更新创意
export const updateCreativeIdea = async (id: number, idea: Partial<CreativeIdea>): Promise<{ success: boolean; data?: CreativeIdea; error?: string }> => {
  return put<CreativeIdea>(`/creative-ideas/${id}`, idea);
};

// 删除创意
export const deleteCreativeIdea = async (id: number): Promise<{ success: boolean; error?: string; message?: string }> => {
  return del(`/creative-ideas/${id}`);
};

// 批量排序
export const reorderCreativeIdeas = async (orderedIds: number[]): Promise<{ success: boolean; error?: string; message?: string }> => {
  return post('/creative-ideas/reorder', { orderedIds });
};

// 导入创意
export const importCreativeIdeas = async (ideas: Omit<CreativeIdea, 'id'>[]): Promise<{ success: boolean; data?: CreativeIdea[]; error?: string }> => {
  return post<CreativeIdea[]>('/creative-ideas/import', { ideas });
};

// 导出创意 - 直接获取所有创意
export const exportCreativeIdeas = async (): Promise<{ success: boolean; data?: CreativeIdea[]; error?: string }> => {
  return get<CreativeIdea[]>('/creative-ideas');
};

// 智能导入创意 - 从外部URL提取并导入
export const smartImportCreativeIdeas = async (idRange: string): Promise<{ 
  success: boolean; 
  data?: CreativeIdea[]; 
  imported?: number;
  skipped?: number;
  error?: string; 
  message?: string 
}> => {
  return post('/creative-ideas/smart-import', {
    url: 'https://opennana.com/awesome-prompt-gallery/data/prompts.json',
    idRange: idRange
  });
};
