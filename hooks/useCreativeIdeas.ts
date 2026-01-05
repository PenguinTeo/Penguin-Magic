/**
 * 创意库状态管理 Hook
 * 封装创意模板的 CRUD 操作和状态
 */

import React, { useState, useMemo, useCallback } from 'react';
import { CreativeIdea, CreativeCategoryType } from '../types';
import * as creativeIdeasApi from '../services/api/creativeIdeas';

export interface UseCreativeIdeasReturn {
  // 状态
  creativeIdeas: CreativeIdea[];
  localCreativeIdeas: CreativeIdea[];
  isImporting: boolean;
  
  // 设置方法
  setLocalCreativeIdeas: React.Dispatch<React.SetStateAction<CreativeIdea[]>>;
  setIsImporting: React.Dispatch<React.SetStateAction<boolean>>;
  
  // 操作方法
  loadCreativeIdeas: () => Promise<void>;
  saveCreativeIdea: (idea: Partial<CreativeIdea>) => Promise<boolean>;
  deleteCreativeIdea: (id: number) => Promise<boolean>;
  toggleFavorite: (id: number) => Promise<void>;
  updateCategory: (id: number, category: CreativeCategoryType) => Promise<void>; // 新增
  reorderCreativeIdeas: (reorderedIdeas: CreativeIdea[]) => Promise<void>;
  importCreativeIdeas: (ideas: CreativeIdea[]) => Promise<{ success: boolean; message?: string }>;
  exportCreativeIdeas: () => void;
}

export const useCreativeIdeas = (): UseCreativeIdeasReturn => {
  // 本地创意库状态
  const [localCreativeIdeas, setLocalCreativeIdeas] = useState<CreativeIdea[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  // 排序后的创意库（按 order 降序）
  const creativeIdeas = useMemo(() => {
    return [...localCreativeIdeas].sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [localCreativeIdeas]);
  
  // 加载创意库
  const loadCreativeIdeas = useCallback(async () => {
    try {
      const result = await creativeIdeasApi.getAllCreativeIdeas();
      if (result.success && result.data) {
        setLocalCreativeIdeas(result.data.sort((a, b) => (b.order || 0) - (a.order || 0)));
      } else {
        console.warn('加载创意库失败:', result.error);
        setLocalCreativeIdeas([]);
      }
    } catch (e) {
      console.error('加载创意库失败:', e);
      setLocalCreativeIdeas([]);
    }
  }, []);
  
  // 保存/更新创意
  const saveCreativeIdea = useCallback(async (idea: Partial<CreativeIdea>): Promise<boolean> => {
    try {
      if (idea.id) {
        // 更新现有创意
        const result = await creativeIdeasApi.updateCreativeIdea(idea.id, idea);
        if (!result.success) {
          throw new Error(result.error || '更新失败');
        }
      } else {
        // 创建新创意
        const newOrder = localCreativeIdeas.length > 0 
          ? Math.max(...localCreativeIdeas.map(i => i.order || 0)) + 1 
          : 1;
        const { id, ...ideaWithoutId } = idea as any;
        const result = await creativeIdeasApi.createCreativeIdea({ ...ideaWithoutId, order: newOrder });
        if (!result.success) {
          throw new Error(result.error || '创建失败');
        }
      }
      // 重新加载数据
      await loadCreativeIdeas();
      return true;
    } catch (e) {
      console.error('保存创意失败:', e);
      return false;
    }
  }, [localCreativeIdeas, loadCreativeIdeas]);
  
  // 删除创意
  const deleteCreativeIdea = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await creativeIdeasApi.deleteCreativeIdea(id);
      if (!result.success) {
        throw new Error(result.error || '删除失败');
      }
      await loadCreativeIdeas();
      return true;
    } catch (e) {
      console.error('删除创意失败:', e);
      return false;
    }
  }, [loadCreativeIdeas]);
  
  // 切换收藏状态
  const toggleFavorite = useCallback(async (id: number) => {
    const targetIdea = localCreativeIdeas.find(idea => idea.id === id);
    if (!targetIdea) return;
    
    // 乐观更新
    const updatedIdeas = localCreativeIdeas.map(idea => 
      idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea
    );
    setLocalCreativeIdeas(updatedIdeas);
    
    // 保存到后端
    try {
      await creativeIdeasApi.updateCreativeIdea(id, { isFavorite: !targetIdea.isFavorite });
    } catch (e) {
      console.error('保存收藏状态失败:', e);
      // 回滚
      setLocalCreativeIdeas(localCreativeIdeas);
    }
  }, [localCreativeIdeas]);
  
  // 更新分类
  const updateCategory = useCallback(async (id: number, category: CreativeCategoryType) => {
    const targetIdea = localCreativeIdeas.find(idea => idea.id === id);
    if (!targetIdea) return;
    
    // 乐观更新
    const updatedIdeas = localCreativeIdeas.map(idea => 
      idea.id === id ? { ...idea, category } : idea
    );
    setLocalCreativeIdeas(updatedIdeas);
    
    // 保存到后端
    try {
      await creativeIdeasApi.updateCreativeIdea(id, { category });
    } catch (e) {
      console.error('更新分类失败:', e);
      // 回滚
      setLocalCreativeIdeas(localCreativeIdeas);
    }
  }, [localCreativeIdeas]);
  
  // 重新排序
  const reorderCreativeIdeas = useCallback(async (reorderedIdeas: CreativeIdea[]) => {
    try {
      const ideasToUpdate = reorderedIdeas.map((idea, index) => ({
        ...idea,
        order: reorderedIdeas.length - index,
      }));
      setLocalCreativeIdeas(ideasToUpdate);
      
      const orderedIds = ideasToUpdate.map(i => i.id);
      await creativeIdeasApi.reorderCreativeIdeas(orderedIds);
    } catch (e) {
      console.error('重新排序失败:', e);
    }
  }, []);
  
  // 导入创意
  const importCreativeIdeas = useCallback(async (ideas: CreativeIdea[]): Promise<{ success: boolean; message?: string }> => {
    if (isImporting) {
      return { success: false, message: '正在导入中，请稍候...' };
    }
    
    setIsImporting(true);
    try {
      const ideasWithoutId = ideas.map(({ id, ...rest }) => rest);
      const result = await creativeIdeasApi.importCreativeIdeas(ideasWithoutId as any) as any;
      
      if (result.success) {
        await loadCreativeIdeas();
        return { 
          success: true, 
          message: result.message || `已导入 ${result.imported || ideas.length} 个创意` 
        };
      } else {
        throw new Error(result.error || '导入失败');
      }
    } catch (e) {
      console.error('导入失败:', e);
      return { success: false, message: '导入失败' };
    } finally {
      setIsImporting(false);
    }
  }, [isImporting, loadCreativeIdeas]);
  
  // 导出创意（将本地图片转换为base64，方便跨设备导入）
  const exportCreativeIdeas = useCallback(async () => {
    if (creativeIdeas.length === 0) {
      alert('库是空的 / Library is empty.');
      return;
    }
    
    // 转换本地图片为base64
    const convertImageToBase64 = async (url: string): Promise<string> => {
      // 如果已经是base64或远程URL，直接返回
      if (!url || url.startsWith('data:') || url.startsWith('http')) {
        return url;
      }
      
      try {
        // 本地文件路径，转换为base64
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(url); // 失败时保留原始URL
          reader.readAsDataURL(blob);
        });
      } catch {
        return url; // 转换失败时保留原始URL
      }
    };
    
    // 并行转换所有图片
    const exportData = await Promise.all(
      creativeIdeas.map(async (idea) => ({
        ...idea,
        imageUrl: await convertImageToBase64(idea.imageUrl)
      }))
    );
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'creative_library.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [creativeIdeas]);
  
  return {
    // 状态
    creativeIdeas,
    localCreativeIdeas,
    isImporting,
    
    // 设置方法
    setLocalCreativeIdeas,
    setIsImporting,
    
    // 操作方法
    loadCreativeIdeas,
    saveCreativeIdea,
    deleteCreativeIdea,
    toggleFavorite,
    updateCategory,
    reorderCreativeIdeas,
    importCreativeIdeas,
    exportCreativeIdeas,
  };
};
