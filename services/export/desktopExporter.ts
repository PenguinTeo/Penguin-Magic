/**
 * 桌面导出服务
 * 负责将桌面图片导出为 ZIP 或批量下载
 */

import JSZip from 'jszip';
import { DesktopImageItem } from '../../types';
import { normalizeImageUrl } from '../../utils/image';

export interface ExportProgress {
  current: number;
  total: number;
  filename: string;
}

export interface ExportOptions {
  onProgress?: (progress: ExportProgress) => void;
}

/**
 * 将图片列表导出为 ZIP 压缩包
 */
export const exportAsZip = async (
  containerName: string,
  imageItems: DesktopImageItem[],
  options?: ExportOptions
): Promise<boolean> => {
  if (imageItems.length === 0) return false;

  try {
    const zip = new JSZip();
    const folder = zip.folder(containerName) || zip;
    
    // 跟踪文件名以避免重复
    const usedFilenames = new Set<string>();
    
    for (let i = 0; i < imageItems.length; i++) {
      const img = imageItems[i];
      
      // 报告进度
      options?.onProgress?.({
        current: i + 1,
        total: imageItems.length,
        filename: img.name,
      });
      
      // 生成唯一文件名：如果名称重复，添加索引
      let baseName = img.name.replace(/[\\/:*?"<>|]/g, '_');
      let filename = `${baseName}.png`;
      let counter = 1;
      while (usedFilenames.has(filename)) {
        filename = `${baseName}_${counter}.png`;
        counter++;
      }
      usedFilenames.add(filename);
      
      try {
        const normalizedUrl = normalizeImageUrl(img.imageUrl);
        const response = await fetch(normalizedUrl);
        const blob = await response.blob();
        folder.file(filename, blob);
      } catch (e) {
        console.error(`获取图片失败: ${img.name}`, e);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `${containerName}-${timestamp}.zip`;
    
    downloadBlob(content, zipFilename);
    return true;
  } catch (e) {
    console.error('导出压缩包失败:', e);
    return false;
  }
};

/**
 * 批量下载图片（逐个下载）
 */
export const batchDownloadImages = async (
  imageItems: DesktopImageItem[],
  options?: ExportOptions
): Promise<boolean> => {
  if (imageItems.length === 0) return false;
  
  try {
    for (let i = 0; i < imageItems.length; i++) {
      const img = imageItems[i];
      
      // 报告进度
      options?.onProgress?.({
        current: i + 1,
        total: imageItems.length,
        filename: img.name,
      });
      
      await downloadSingleImage(img);
      
      // 延迟避免触发浏览器下载限制
      if (i < imageItems.length - 1) {
        await delay(300);
      }
    }
    return true;
  } catch (e) {
    console.error('批量下载失败:', e);
    return false;
  }
};

/**
 * 下载单张图片
 */
export const downloadSingleImage = async (img: DesktopImageItem): Promise<boolean> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = img.name ? `${img.name.replace(/[\\/:*?"<>|]/g, '_')}.png` : `image-${timestamp}.png`;
  
  try {
    const normalizedUrl = normalizeImageUrl(img.imageUrl);
    
    if (normalizedUrl.startsWith('data:')) {
      // base64 直接下载
      downloadDataUrl(normalizedUrl, filename);
      return true;
    }
    
    // 网络 URL 先获取 blob
    const response = await fetch(normalizedUrl);
    const blob = await response.blob();
    downloadBlob(blob, filename);
    return true;
  } catch (e) {
    console.error('下载失败，尝试在新窗口打开:', e);
    window.open(normalizeImageUrl(img.imageUrl), '_blank');
    return false;
  }
};

/**
 * 下载 Blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 下载 Data URL
 */
export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 通用图片下载函数
 * 支持 base64 和网络 URL
 */
export const downloadImage = async (url: string, filename?: string): Promise<boolean> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const downloadFilename = filename || `ai-generated-${timestamp}.png`;
  
  const normalizedUrl = normalizeImageUrl(url);
  
  if (normalizedUrl.startsWith('data:')) {
    downloadDataUrl(normalizedUrl, downloadFilename);
    return true;
  }
  
  try {
    const response = await fetch(normalizedUrl);
    const blob = await response.blob();
    downloadBlob(blob, downloadFilename);
    return true;
  } catch (e) {
    console.error('下载失败，尝试在新窗口打开:', e);
    window.open(normalizedUrl, '_blank');
    return false;
  }
};

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
