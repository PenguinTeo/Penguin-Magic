// 画布 API - 本地版本
import { get, post, put, del } from './index';
import { CanvasNode, Connection } from '../../types/pebblingTypes';

// 画布数据类型
export interface CanvasData {
  id: string;
  name: string;
  nodes: CanvasNode[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string | null;
}

// 画布列表项（不含详细节点数据）
export interface CanvasListItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
  thumbnail?: string | null;
}

// 获取画布列表
export const getCanvasList = async (): Promise<{ success: boolean; data?: CanvasListItem[]; error?: string }> => {
  return get<CanvasListItem[]>('/canvas');
};

// 获取单个画布详情
export const getCanvas = async (id: string): Promise<{ success: boolean; data?: CanvasData; error?: string }> => {
  return get<CanvasData>(`/canvas/${id}`);
};

// 创建新画布
export const createCanvas = async (data: {
  name?: string;
  nodes?: CanvasNode[];
  connections?: Connection[];
}): Promise<{ success: boolean; data?: CanvasData; error?: string }> => {
  return post<CanvasData>('/canvas', data);
};

// 更新画布
export const updateCanvas = async (
  id: string,
  data: {
    name?: string;
    nodes?: CanvasNode[];
    connections?: Connection[];
    thumbnail?: string | null;
  }
): Promise<{ success: boolean; data?: CanvasData; error?: string }> => {
  return put<CanvasData>(`/canvas/${id}`, data);
};

// 删除画布
export const deleteCanvas = async (id: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  return del(`/canvas/${id}`);
};

// 保存画布节点图片到本地文件（保存到画布专属文件夹）
export const saveCanvasImage = async (
  imageData: string,
  canvasName?: string,
  nodeId?: string,
  canvasId?: string
): Promise<{ success: boolean; data?: { filename: string; path: string; url: string }; error?: string }> => {
  return post('/canvas/save-image', { imageData, canvasName, nodeId, canvasId });
};
