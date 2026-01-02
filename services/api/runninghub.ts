// RunningHub API 服务
import { post, get } from './index';

// ============================================
// 类型定义
// ============================================

// 节点信息
export interface RHNodeInfo {
    nodeId: string;
    fieldName: string;
    fieldValue: string;
}

// 任务创建响应
export interface RHTaskCreateResponse {
    netWssUrl?: string;
    taskId: string;
    clientId?: string;
    taskStatus: 'CREATE' | 'SUCCESS' | 'FAILED' | 'RUNNING' | 'QUEUED';
    promptTips?: string;
}

// 任务输出
export interface RHTaskOutput {
    fileUrl: string;
    fileType: string;
    taskCostTime: string;
    nodeId: string;
    consumeCoins: string;
}

// RunningHub 配置
export interface RHConfig {
    configured: boolean;
    baseUrl: string;
    apiKeyPreview: string | null;
}

// ============================================
// API 调用
// ============================================

/**
 * 获取 RunningHub 配置
 */
export const getRunningHubConfig = async (): Promise<{
    success: boolean;
    data?: RHConfig;
    error?: string;
}> => {
    return get<RHConfig>('/runninghub/config');
};

/**
 * 创建任务
 */
export const createRunningHubTask = async (
    workflowId: string,
    nodeInfoList?: RHNodeInfo[],
    cost?: number
): Promise<{
    success: boolean;
    data?: RHTaskCreateResponse;
    coinsDeducted?: number;
    error?: string;
}> => {
    return post<RHTaskCreateResponse>('/runninghub/create', {
        workflowId,
        nodeInfoList,
        cost
    });
};

/**
 * 查询任务状态
 */
export const queryRunningHubStatus = async (
    taskId: string
): Promise<{
    success: boolean;
    status?: string;
    error?: string;
}> => {
    return post('/runninghub/status', { taskId });
};

/**
 * 查询任务输出
 */
export const queryRunningHubOutputs = async (
    taskId: string
): Promise<{
    success: boolean;
    data?: RHTaskOutput[];
    status?: 'RUNNING' | 'QUEUED' | 'FAILED' | 'SUCCESS';
    error?: string;
}> => {
    return post('/runninghub/outputs', { taskId });
};

/**
 * 上传文件到 RunningHub
 */
export const uploadToRunningHub = async (
    file: File
): Promise<{
    success: boolean;
    fileName?: string;
    error?: string;
}> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');

    const response = await fetch('/api/runninghub/upload', {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
    });

    return response.json();
};

/**
 * 一站式生成：创建任务并等待结果
 */
export const generateWithRunningHub = async (
    workflowId: string,
    nodeInfoList?: RHNodeInfo[],
    cost?: number
): Promise<{
    success: boolean;
    data?: {
        taskId: string;
        outputs: RHTaskOutput[];
    };
    coinsDeducted?: number;
    error?: string;
    failedReason?: any;
}> => {
    return post('/runninghub/generate', {
        workflowId,
        nodeInfoList,
        cost,
        maxAttempts: 60,
        interval: 3000
    });
};

/**
 * 等待任务完成
 */
export const waitForRunningHubResult = async (
    taskId: string
): Promise<{
    success: boolean;
    data?: RHTaskOutput[];
    error?: string;
}> => {
    return post('/runninghub/wait', {
        taskId,
        maxAttempts: 60,
        interval: 3000
    });
};

// ============================================
// AI 应用 (webappId) 相关
// ============================================

// AI 应用节点信息
export interface RHAIAppNodeInfo {
    nodeId: string;
    fieldName: string;
    fieldValue: string;
    description?: string;
}

/**
 * 运行 AI 应用并等待结果
 */
export const runAIApp = async (
    webappId: string,
    nodeInfoList: RHAIAppNodeInfo[],
    cost?: number
): Promise<{
    success: boolean;
    data?: {
        taskId: string;
        outputs: RHTaskOutput[];
    };
    coinsDeducted?: number;
    error?: string;
    failedReason?: any;
}> => {
    return post('/runninghub/ai-app/run', {
        webappId,
        nodeInfoList,
        cost
    });
};
