/**
 * RunningHub 任务队列管理 Context
 * 实现 5 并发限制的客户端排队机制
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { runAIApp, uploadImage, RHTaskOutput } from '../services/api/runninghub';

// 简单的 uuid 生成
const uuid = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ============================================
// 类型定义
// ============================================

export type RHTaskStatus = 
  | 'queued'      // 排队等待
  | 'uploading'   // 上传资源
  | 'running'     // API执行中
  | 'completed'   // 完成
  | 'failed'      // 失败
  | 'cancelled';  // 已取消

export interface RHQueuedTask {
  id: string;
  nodeId: string;           // 画布节点 ID
  canvasId?: string;        // 画布 ID
  title: string;            // 应用名称
  webappId: string;         // RunningHub 应用 ID
  nodeInfoList: any[];      // 参数列表
  batchIndex: number;       // 批次索引 (0-based)
  totalBatches: number;     // 总批次数
  status: RHTaskStatus;
  queuePosition?: number;   // 排队位置 (仅 queued 状态)
  progress?: string;        // 进度描述
  startTime: number;        // 入队时间
  executeStartTime?: number; // 开始执行时间
  error?: string;           // 错误信息
  outputNodeId?: string;    // 输出节点 ID
  result?: {                // 执行结果
    outputs: RHTaskOutput[];
    taskId: string;
  };
  // 图片上传相关
  pendingImageUploads?: Array<{
    portKey: string;
    imageData: string;
  }>;
}

export interface EnqueueParams {
  nodeId: string;
  canvasId?: string;
  title: string;
  webappId: string;
  nodeInfoList: any[];
  batchCount: number;
  pendingImageUploads?: Array<{
    portKey: string;
    imageData: string;
  }>;
  // 回调
  onOutputNodeCreated?: (taskId: string, batchIndex: number, outputNodeId: string) => void;
  onTaskComplete?: (taskId: string, batchIndex: number, result: { outputs: RHTaskOutput[]; taskId: string }, status: { completedCount: number; failedCount: number; totalCount: number }) => void;
  onTaskError?: (taskId: string, batchIndex: number, error: string, status: { completedCount: number; failedCount: number; totalCount: number }) => void;
  onNodeInputsUpdate?: (nodeId: string, updates: Record<string, string>) => void;
  onAllTasksDone?: (nodeId: string, status: { completedCount: number; failedCount: number; totalCount: number }) => void;
}

interface NodeTaskStatus {
  queued: number;
  uploading: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  firstQueuePosition?: number;
}

interface RHTaskQueueContextType {
  tasks: RHQueuedTask[];
  runningCount: number;
  queuedCount: number;
  
  // 入队 - 返回任务ID数组
  enqueueTask: (params: EnqueueParams) => string[];
  
  // 取消任务
  cancelTask: (taskId: string) => boolean;
  
  // 取消节点的所有任务
  cancelNodeTasks: (nodeId: string) => void;
  
  // 获取节点任务状态
  getNodeTaskStatus: (nodeId: string) => NodeTaskStatus;
  
  // 获取任务
  getTask: (taskId: string) => RHQueuedTask | undefined;
  
  // 清理已完成的任务
  clearCompletedTasks: () => void;
}

const RHTaskQueueContext = createContext<RHTaskQueueContextType | null>(null);

// ============================================
// Provider 实现
// ============================================

const MAX_CONCURRENT = 3;

export const RHTaskQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<RHQueuedTask[]>([]);
  const tasksRef = useRef<RHQueuedTask[]>([]);
  const executingTasksRef = useRef<Set<string>>(new Set()); // 正在启动中的任务
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 存储每个节点已上传的文件 { nodeId: { portKey: fileKey } }
  const uploadedFilesRef = useRef<Map<string, Record<string, string>>>(new Map());
  // 存储每个节点的上传 Promise，用于等待上传完成
  const uploadPromisesRef = useRef<Map<string, Promise<Record<string, string>>>>(new Map());
  
  // 回调存储
  const callbacksRef = useRef<Map<string, {
    onOutputNodeCreated?: (taskId: string, batchIndex: number, outputNodeId: string) => void;
    onTaskComplete?: (taskId: string, batchIndex: number, result: { outputs: RHTaskOutput[]; taskId: string }, status: { completedCount: number; failedCount: number; totalCount: number }) => void;
    onTaskError?: (taskId: string, batchIndex: number, error: string, status: { completedCount: number; failedCount: number; totalCount: number }) => void;
    onNodeInputsUpdate?: (nodeId: string, updates: Record<string, string>) => void;
    onAllTasksDone?: (nodeId: string, status: { completedCount: number; failedCount: number; totalCount: number }) => void;
  }>>(new Map());

  // 同步更新 ref
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // 更新单个任务
  const updateTask = useCallback((taskId: string, updates: Partial<RHQueuedTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  // 执行单个任务
  const executeTask = useCallback(async (task: RHQueuedTask) => {
    // 防止重复执行
    if (executingTasksRef.current.has(task.id)) {
      console.log(`[RHQueue] 任务 ${task.id.slice(0, 8)} 已在执行中，跳过`);
      return;
    }
    executingTasksRef.current.add(task.id);
    
    const callbacks = callbacksRef.current.get(task.nodeId);
    let nodeInfoList = [...task.nodeInfoList];
    
    // 先更新状态为 uploading/running，确保不会被重复调度
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'uploading' as const, progress: '准备中...' } : t
    ));
    
    try {
      let uploadedFiles: Record<string, string> = {};
      
      // 1. 处理图片上传（仅第一个任务需要上传）
      if (task.pendingImageUploads && task.pendingImageUploads.length > 0) {
        // 创建上传 Promise 供其他任务等待
        const uploadPromise = (async () => {
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, status: 'uploading' as const, progress: '上传资源...' } : t
          ));
          
          const uploadUpdates: Record<string, string> = {};
          
          for (const upload of task.pendingImageUploads!) {
            try {
              console.log('[RHQueue] 上传图片:', upload.portKey);
              const result = await uploadImage(upload.imageData);
              if (result.success && result.data?.fileKey) {
                console.log('[RHQueue] 上传成功:', upload.portKey, result.data.fileKey);
                uploadUpdates[upload.portKey] = result.data.fileKey;
              } else {
                console.error('[RHQueue] 上传失败:', upload.portKey, result.error);
              }
            } catch (err) {
              console.error('[RHQueue] 上传异常:', upload.portKey, err);
            }
          }
          
          // 保存上传结果
          if (Object.keys(uploadUpdates).length > 0) {
            uploadedFilesRef.current.set(task.nodeId, uploadUpdates);
            
            // 通知更新节点输入
            if (callbacks?.onNodeInputsUpdate) {
              callbacks.onNodeInputsUpdate(task.nodeId, uploadUpdates);
            }
          }
          
          return uploadUpdates;
        })();
        
        // 存储 Promise 供其他任务等待
        uploadPromisesRef.current.set(task.nodeId, uploadPromise);
        
        // 等待上传完成
        uploadedFiles = await uploadPromise;
        console.log('[RHQueue] 上传完成，uploadedFiles:', uploadedFiles);
      } else {
        // 不需要上传的任务，检查是否需要等待上传完成
        const existingPromise = uploadPromisesRef.current.get(task.nodeId);
        if (existingPromise) {
          console.log(`[RHQueue] 任务 ${task.batchIndex + 1} 等待上传完成...`);
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, status: 'uploading' as const, progress: '等待上传...' } : t
          ));
          uploadedFiles = await existingPromise;
          console.log(`[RHQueue] 任务 ${task.batchIndex + 1} 获取到上传结果:`, uploadedFiles);
        } else {
          // 从缓存获取已上传的文件
          uploadedFiles = uploadedFilesRef.current.get(task.nodeId) || {};
        }
      }
      
      // 2. 使用已上传的文件更新 nodeInfoList
      if (Object.keys(uploadedFiles).length > 0) {
        nodeInfoList = nodeInfoList.map(info => {
          const key = `${info.nodeId}_${info.fieldName}`;
          if (uploadedFiles[key]) {
            console.log(`[RHQueue] 使用已上传文件: ${key} -> ${uploadedFiles[key]}`);
            return { ...info, fieldValue: uploadedFiles[key] };
          }
          return info;
        });
      }
      
      // 3. 执行 API 调用
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'running' as const, progress: `执行中 ${task.batchIndex + 1}/${task.totalBatches}`, executeStartTime: Date.now() } : t
      ));
      
      console.log(`[RHQueue] 执行任务: ${task.title} [${task.batchIndex + 1}/${task.totalBatches}]`);
      console.log(`[RHQueue] webappId: ${task.webappId}`);
      console.log(`[RHQueue] nodeInfoList:`, nodeInfoList);
      
      const result = await runAIApp(task.webappId, nodeInfoList);
      
      console.log(`[RHQueue] API 返回:`, result);
      
      if (result.success && result.data?.outputs?.length) {
        setTasks(prev => {
          const updated = prev.map(t => 
            t.id === task.id ? { 
              ...t, 
              status: 'completed' as const, 
              progress: '完成',
              result: { outputs: result.data!.outputs, taskId: result.data!.taskId }
            } : t
          );
          
          // 计算当前状态
          const nodeTasks = updated.filter(t => t.nodeId === task.nodeId);
          const completedCount = nodeTasks.filter(t => t.status === 'completed').length;
          const failedCount = nodeTasks.filter(t => t.status === 'failed').length;
          const totalCount = nodeTasks.length;
          
          // 延迟调用回调，确保状态已更新
          setTimeout(() => {
            if (callbacks?.onTaskComplete) {
              callbacks.onTaskComplete(task.id, task.batchIndex, {
                outputs: result.data!.outputs,
                taskId: result.data!.taskId
              }, { completedCount, failedCount, totalCount });
            }
            
            // 检查是否所有任务都完成
            if (completedCount + failedCount >= totalCount) {
              if (callbacks?.onAllTasksDone) {
                callbacks.onAllTasksDone(task.nodeId, { completedCount, failedCount, totalCount });
              }
            }
          }, 0);
          
          return updated;
        });
      } else {
        const errorMsg = result.error || '执行失败';
        console.error(`[RHQueue] 任务失败:`, errorMsg);
        setTasks(prev => {
          const updated = prev.map(t => 
            t.id === task.id ? { ...t, status: 'failed' as const, error: errorMsg } : t
          );
          
          // 计算当前状态
          const nodeTasks = updated.filter(t => t.nodeId === task.nodeId);
          const completedCount = nodeTasks.filter(t => t.status === 'completed').length;
          const failedCount = nodeTasks.filter(t => t.status === 'failed').length;
          const totalCount = nodeTasks.length;
          
          // 延迟调用回调
          setTimeout(() => {
            if (callbacks?.onTaskError) {
              callbacks.onTaskError(task.id, task.batchIndex, errorMsg, { completedCount, failedCount, totalCount });
            }
            
            // 检查是否所有任务都完成
            if (completedCount + failedCount >= totalCount) {
              if (callbacks?.onAllTasksDone) {
                callbacks.onAllTasksDone(task.nodeId, { completedCount, failedCount, totalCount });
              }
            }
          }, 0);
          
          return updated;
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || '执行异常';
      console.error(`[RHQueue] 任务异常:`, errorMsg, err);
      setTasks(prev => {
        const updated = prev.map(t => 
          t.id === task.id ? { ...t, status: 'failed' as const, error: errorMsg } : t
        );
        
        // 计算当前状态
        const nodeTasks = updated.filter(t => t.nodeId === task.nodeId);
        const completedCount = nodeTasks.filter(t => t.status === 'completed').length;
        const failedCount = nodeTasks.filter(t => t.status === 'failed').length;
        const totalCount = nodeTasks.length;
        
        // 延迟调用回调
        setTimeout(() => {
          if (callbacks?.onTaskError) {
            callbacks.onTaskError(task.id, task.batchIndex, errorMsg, { completedCount, failedCount, totalCount });
          }
          
          // 检查是否所有任务都完成
          if (completedCount + failedCount >= totalCount) {
            if (callbacks?.onAllTasksDone) {
              callbacks.onAllTasksDone(task.nodeId, { completedCount, failedCount, totalCount });
            }
          }
        }, 0);
        
        return updated;
      });
    } finally {
      // 移除执行中标记
      executingTasksRef.current.delete(task.id);
      
      // 检查该节点的所有任务是否都已完成，如果是则清理缓存
      const nodeTasks = tasksRef.current.filter(t => t.nodeId === task.nodeId);
      const allDone = nodeTasks.every(t => 
        t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
      );
      if (allDone) {
        uploadedFilesRef.current.delete(task.nodeId);
        uploadPromisesRef.current.delete(task.nodeId);
        console.log(`[RHQueue] 节点 ${task.nodeId.slice(0, 8)} 所有任务完成，清理缓存`);
      }
    }
  }, []);

  // 处理队列 - 使用防抖确保不会频繁调用
  const processQueue = useCallback(() => {
    // 清除之前的定时器，实现防抖
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
    }
    
    processTimeoutRef.current = setTimeout(() => {
      const currentTasks = tasksRef.current;
      // 排除正在启动中的任务
      const executingIds = executingTasksRef.current;
      const running = currentTasks.filter(t => 
        t.status === 'running' || t.status === 'uploading' || executingIds.has(t.id)
      );
      const queued = currentTasks
        .filter(t => t.status === 'queued' && !executingIds.has(t.id))
        .sort((a, b) => a.startTime - b.startTime);
      
      console.log(`[RHQueue] processQueue: running=${running.length}, queued=${queued.length}, executing=${executingIds.size}`);
      
      // 计算可以启动多少个新任务
      const availableSlots = MAX_CONCURRENT - running.length;
      
      if (availableSlots > 0 && queued.length > 0) {
        // 取出可执行的任务
        const toExecute = queued.slice(0, availableSlots);
        
        console.log(`[RHQueue] 启动 ${toExecute.length} 个任务`);
        
        toExecute.forEach(task => {
          executeTask(task);
        });
      }
      
      // 更新排队位置
      const remainingQueued = queued.slice(availableSlots > 0 ? availableSlots : 0);
      if (remainingQueued.length > 0) {
        setTasks(prev => prev.map(task => {
          if (task.status === 'queued') {
            const queueIndex = remainingQueued.findIndex(q => q.id === task.id);
            if (queueIndex >= 0) {
              return { ...task, queuePosition: queueIndex + 1 };
            }
          }
          return task;
        }));
      }
    }, 50); // 50ms 防抖
  }, [executeTask]);

  // 监听任务状态变化，触发队列处理
  useEffect(() => {
    // 检查是否有排队任务和可用槽位
    const running = tasks.filter(t => t.status === 'running' || t.status === 'uploading');
    const queued = tasks.filter(t => t.status === 'queued');
    
    if (queued.length > 0 && running.length < MAX_CONCURRENT) {
      processQueue();
    }
  }, [tasks, processQueue]);

  // 入队
  const enqueueTask = useCallback((params: EnqueueParams): string[] => {
    const taskIds: string[] = [];
    const now = Date.now();
    
    // 存储回调
    callbacksRef.current.set(params.nodeId, {
      onOutputNodeCreated: params.onOutputNodeCreated,
      onTaskComplete: params.onTaskComplete,
      onTaskError: params.onTaskError,
      onNodeInputsUpdate: params.onNodeInputsUpdate,
      onAllTasksDone: params.onAllTasksDone
    });
    
    // 为每个批次创建任务
    const newTasks: RHQueuedTask[] = [];
    for (let i = 0; i < params.batchCount; i++) {
      const taskId = uuid();
      taskIds.push(taskId);
      
      newTasks.push({
        id: taskId,
        nodeId: params.nodeId,
        canvasId: params.canvasId,
        title: params.title,
        webappId: params.webappId,
        nodeInfoList: params.nodeInfoList,
        batchIndex: i,
        totalBatches: params.batchCount,
        status: 'queued',
        startTime: now + i, // 确保顺序
        progress: '排队中...',
        pendingImageUploads: i === 0 ? params.pendingImageUploads : undefined // 只有第一个任务需要上传
      });
    }
    
    setTasks(prev => [...prev, ...newTasks]);
    
    console.log(`[RHQueue] 入队 ${params.batchCount} 个任务: ${params.title}`);
    
    return taskIds;
  }, []);

  // 取消任务
  const cancelTask = useCallback((taskId: string): boolean => {
    const task = tasksRef.current.find(t => t.id === taskId);
    if (!task) return false;
    
    // 只能取消排队中的任务
    if (task.status !== 'queued') {
      console.warn('[RHQueue] 只能取消排队中的任务');
      return false;
    }
    
    updateTask(taskId, { status: 'cancelled' });
    return true;
  }, [updateTask]);

  // 取消节点的所有任务
  const cancelNodeTasks = useCallback((nodeId: string) => {
    const nodeTasks = tasksRef.current.filter(t => t.nodeId === nodeId && t.status === 'queued');
    nodeTasks.forEach(task => {
      updateTask(task.id, { status: 'cancelled' });
    });
  }, [updateTask]);

  // 获取节点任务状态
  const getNodeTaskStatus = useCallback((nodeId: string): NodeTaskStatus => {
    const nodeTasks = tasksRef.current.filter(t => t.nodeId === nodeId);
    const queued = nodeTasks.filter(t => t.status === 'queued');
    
    return {
      queued: queued.length,
      uploading: nodeTasks.filter(t => t.status === 'uploading').length,
      running: nodeTasks.filter(t => t.status === 'running').length,
      completed: nodeTasks.filter(t => t.status === 'completed').length,
      failed: nodeTasks.filter(t => t.status === 'failed').length,
      cancelled: nodeTasks.filter(t => t.status === 'cancelled').length,
      total: nodeTasks.length,
      firstQueuePosition: queued.length > 0 
        ? Math.min(...queued.map(t => t.queuePosition || 999))
        : undefined
    };
  }, []);

  // 获取任务
  const getTask = useCallback((taskId: string): RHQueuedTask | undefined => {
    return tasksRef.current.find(t => t.id === taskId);
  }, []);

  // 清理已完成的任务
  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => prev.filter(t => 
      t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled'
    ));
  }, []);

  // 计算统计
  const runningCount = tasks.filter(t => t.status === 'running' || t.status === 'uploading').length;
  const queuedCount = tasks.filter(t => t.status === 'queued').length;

  return (
    <RHTaskQueueContext.Provider value={{
      tasks,
      runningCount,
      queuedCount,
      enqueueTask,
      cancelTask,
      cancelNodeTasks,
      getNodeTaskStatus,
      getTask,
      clearCompletedTasks
    }}>
      {children}
    </RHTaskQueueContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useRHTaskQueue = () => {
  const context = useContext(RHTaskQueueContext);
  if (!context) {
    throw new Error('useRHTaskQueue must be used within RHTaskQueueProvider');
  }
  return context;
};

// 节点专用 Hook
export const useNodeTaskStatus = (nodeId: string) => {
  const { tasks, getNodeTaskStatus, cancelNodeTasks } = useRHTaskQueue();
  
  // 监听该节点的任务变化
  const nodeTasks = tasks.filter(t => t.nodeId === nodeId);
  const status = getNodeTaskStatus(nodeId);
  
  return {
    ...status,
    tasks: nodeTasks,
    cancel: () => cancelNodeTasks(nodeId)
  };
};
