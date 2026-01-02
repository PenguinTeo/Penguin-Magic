// 桌面状态 API - 本地版本
import { get, post } from './index';
import { DesktopItem } from '../../types';

// 获取桌面状态
export const getDesktopItems = async (): Promise<{ success: boolean; data?: DesktopItem[]; error?: string }> => {
  return get<DesktopItem[]>('/desktop');
};

// 保存桌面状态
export const saveDesktopItems = async (items: DesktopItem[]): Promise<{ success: boolean; error?: string; message?: string }> => {
  return post('/desktop', { items });
};
