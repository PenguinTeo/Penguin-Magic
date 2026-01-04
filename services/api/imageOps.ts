import { post, ApiResponse } from './index';

// 图片合并参数接口
export interface MergeImagesParams {
  imagePaths: string[];
  layout: 'horizontal' | 'vertical' | 'grid';
  gridColumns?: number;
  resizeStrategy?: 'keep' | 'stretch' | 'fit';
  spacing?: number;
  backgroundColor?: string;
}

// 图片裁切参数接口
export interface CropImageParams {
  imagePath: string;
  cropRegion: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// 图片缩放参数接口
export interface ResizeImageParams {
  imagePath: string;
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  maintainAspectRatio?: boolean;
}

// API 响应数据接口
export interface ImageOpsData {
  imageUrl: string;
  width: number;
  height: number;
}

/**
 * 图片合并
 * @param params 合并参数
 * @returns 合并后的图片信息
 */
export const mergeImages = async (params: MergeImagesParams): Promise<ApiResponse<ImageOpsData>> => {
  return post<ImageOpsData>('/image-ops/merge', params);
};

/**
 * 图片裁切
 * @param params 裁切参数
 * @returns 裁切后的图片信息
 */
export const cropImage = async (params: CropImageParams): Promise<ApiResponse<ImageOpsData>> => {
  return post<ImageOpsData>('/image-ops/crop', params);
};

/**
 * 图片缩放
 * @param params 缩放参数
 * @returns 缩放后的图片信息
 */
export const resizeImage = async (params: ResizeImageParams): Promise<ApiResponse<ImageOpsData>> => {
  return post<ImageOpsData>('/image-ops/resize', params);
};
