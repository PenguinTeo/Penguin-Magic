/**
 * 生成历史记录状态管理 Hook
 * 封装历史记录的 CRUD 操作和状态
 */

import React, { useState, useCallback } from 'react';
import { GenerationHistory, SmartPlusConfig } from '../types';
import * as historyApi from '../services/api/history';
import { saveToOutput, downloadRemoteToOutput } from '../services/api/files';

export interface SaveToHistoryParams {
  imageUrl: string;
  promptText: string;
  isThirdParty: boolean;
  model: string;
  inputFiles?: File[];
  creativeInfo?: {
    templateId?: number;
    templateType: 'smart' | 'smartPlus' | 'bp' | 'none';
    bpInputs?: Record<string, string>;
    smartPlusOverrides?: SmartPlusConfig;
  };
}

export interface UseGenerationHistoryReturn {
  // 状态
  generationHistory: GenerationHistory[];
  
  // 设置方法
  setGenerationHistory: React.Dispatch<React.SetStateAction<GenerationHistory[]>>;
  
  // 操作方法
  loadHistory: () => Promise<GenerationHistory[]>;
  saveToHistory: (params: SaveToHistoryParams) => Promise<number | undefined>;
  deleteHistoryItem: (id: number) => Promise<void>;
  clearAllHistory: () => Promise<void>;
}

export const useGenerationHistory = (): UseGenerationHistoryReturn => {
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  
  // 加载历史记录
  const loadHistory = useCallback(async (): Promise<GenerationHistory[]> => {
    try {
      const result = await historyApi.getAllHistory();
      if (result.success && result.data) {
        const sortedHistory = result.data.sort((a, b) => b.timestamp - a.timestamp);
        setGenerationHistory(sortedHistory);
        return sortedHistory;
      } else {
        console.warn('加载历史记录失败:', result.error);
        setGenerationHistory([]);
        return [];
      }
    } catch (e) {
      console.error('加载历史记录失败:', e);
      setGenerationHistory([]);
      return [];
    }
  }, []);
  
  // 保存到历史记录
  const saveToHistory = useCallback(async (params: SaveToHistoryParams): Promise<number | undefined> => {
    const { imageUrl, promptText, isThirdParty, model, inputFiles, creativeInfo } = params;
    
    // 将输入图片转换为 base64 保存
    let inputImageData: string | undefined;
    let inputImageName: string | undefined;
    let inputImageType: string | undefined;
    let inputImages: Array<{ data: string; name: string; type: string }> | undefined;
    
    // 保存所有输入图片（多图支持）
    if (inputFiles && inputFiles.length > 0) {
      try {
        inputImages = await Promise.all(inputFiles.map(async (file) => {
          const data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          return {
            data,
            name: file.name,
            type: file.type
          };
        }));
        
        // 保持向后兼容：第一张图片也保存到单图字段
        if (inputImages.length > 0) {
          inputImageData = inputImages[0].data;
          inputImageName = inputImages[0].name;
          inputImageType = inputImages[0].type;
        }
      } catch (e) {
        console.warn('保存输入图片失败:', e);
      }
    }
    
    // 先保存图片到本地output目录，获取本地URL
    let localImageUrl = imageUrl;
    
    // 处理base64格式的图片
    if (imageUrl.startsWith('data:')) {
      try {
        const saveResult = await saveToOutput(imageUrl);
        if (saveResult.success && saveResult.data) {
          localImageUrl = saveResult.data.url;
          console.log('[History] base64图片已保存到本地:', saveResult.data.url);
        }
      } catch (e) {
        console.log('保存到output失败，使用base64:', e);
      }
    }
    // 处理远程URL格式的图片（第三方API返回的）
    else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        console.log('[History] 下载远程图片到本地...');
        const downloadResult = await downloadRemoteToOutput(imageUrl);
        if (downloadResult.success && downloadResult.data) {
          localImageUrl = downloadResult.data.url;
          console.log('[History] 远程图片已保存到本地:', downloadResult.data.url);
        } else {
          console.warn('[History] 下载远程图片失败:', downloadResult.error);
        }
      } catch (e) {
        console.warn('[History] 下载远程图片异常，保留远程URL:', e);
      }
    }
    
    const historyItem: GenerationHistory = {
      id: Date.now(),
      imageUrl: localImageUrl,
      prompt: promptText,
      timestamp: Date.now(),
      model,
      isThirdParty,
      inputImageData,
      inputImageName,
      inputImageType,
      inputImages,
      creativeTemplateId: creativeInfo?.templateId,
      creativeTemplateType: creativeInfo?.templateType || 'none',
      bpInputs: creativeInfo?.bpInputs,
      smartPlusOverrides: creativeInfo?.smartPlusOverrides
    };
    
    try {
      const { id, ...historyWithoutId } = historyItem;
      const result = await historyApi.createHistory(historyWithoutId as any);
      if (result.success && result.data) {
        setGenerationHistory(prev => [result.data!, ...prev].slice(0, 50));
        return result.data.id;
      }
      console.error('保存历史记录失败:', result.error);
    } catch (e) {
      console.error('保存历史记录失败:', e);
    }
    return undefined;
  }, []);
  
  // 删除历史记录
  const deleteHistoryItem = useCallback(async (id: number) => {
    try {
      await historyApi.deleteHistory(id);
      setGenerationHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error('删除历史记录失败:', e);
    }
  }, []);
  
  // 清空所有历史记录
  const clearAllHistory = useCallback(async () => {
    if (!confirm('确定要清空所有历史记录吗？')) return;
    try {
      await historyApi.clearAllHistory();
      setGenerationHistory([]);
    } catch (e) {
      console.error('清空历史记录失败:', e);
    }
  }, []);
  
  return {
    generationHistory,
    setGenerationHistory,
    loadHistory,
    saveToHistory,
    deleteHistoryItem,
    clearAllHistory,
  };
};
