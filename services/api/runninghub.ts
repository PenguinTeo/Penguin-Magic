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
    // 会员消费 API (AI 应用)
    appConfigured: boolean;
    appApiKeyPreview: string | null;
    // 企业共享 API (RH Magic)
    magicConfigured: boolean;
    magicApiKeyPreview: string | null;
    baseUrl: string;
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
 * 保存 RunningHub API Key
 * 支持分别保存 appApiKey (会员消费) 和 magicApiKey (企业共享)
 */
export const saveRunningHubConfig = async (options: {
    appApiKey?: string;
    magicApiKey?: string;
}): Promise<{
    success: boolean;
    data?: {
        appConfigured: boolean;
        magicConfigured: boolean;
        appApiKeyPreview: string | null;
        magicApiKeyPreview: string | null;
    };
    error?: string;
}> => {
    return post('/runninghub/config', options);
};

/**
 * 获取 AI 应用信息
 * 包括 nodeInfoList、应用名称、封面等
 */
export const getAIAppInfo = async (webappId: string): Promise<{
    success: boolean;
    data?: RHAIAppInfo;
    error?: string;
}> => {
    return post('/runninghub/ai-app/info', { webappId });
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
 * 上传图片到 RunningHub（base64）
 * 返回 fileKey 用于作为 fieldValue
 * 注：此接口用于标准模型 API (RH Magic)
 */
export const uploadImage = async (
    base64Data: string
): Promise<{
    success: boolean;
    data?: {
        fileKey: string;
        fileName?: string;
    };
    error?: string;
}> => {
    return post('/runninghub/upload-image', { image: base64Data });
};

/**
 * 上传图片到 RunningHub（base64）- AI 应用专用
 * 返回 fileKey 用于作为 fieldValue
 * 注：此接口用于 AI 应用（会员消费 API）
 */
export const uploadImageForApp = async (
    base64Data: string
): Promise<{
    success: boolean;
    data?: {
        fileKey: string;
        fileName?: string;
    };
    error?: string;
}> => {
    return post('/runninghub/upload-image-for-app', { image: base64Data });
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

// AI 应用节点信息（详细）
export interface RHAIAppNodeInfoItem {
    nodeId: string;
    nodeName: string;
    fieldName: string;
    fieldValue: string;
    fieldData?: string;
    fieldType: string; // 'IMAGE' | 'STRING' | 'LIST' | 'AUDIO' | 'VIDEO'
    description: string;
    descriptionEn?: string;
}

// AI 应用封面
export interface RHAIAppCover {
    id: string;
    url: string;
    thumbnailUri: string;
    imageWidth?: string;
    imageHeight?: string;
}

// AI 应用信息
export interface RHAIAppInfo {
    webappName: string;
    nodeInfoList: RHAIAppNodeInfoItem[];
    covers: RHAIAppCover[];
    tags?: Array<{ id: string; name: string; nameEn?: string }>;
    statisticsInfo?: {
        likeCount: string;
        downloadCount: string;
        useCount: string;
        pv: string;
        collectCount: string;
    };
    curl?: string;
}

/**
 * 运行 AI 应用并等待结果
 * 调用一站式 /generate 接口，自动轮询等待结果
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
    // 使用一站式 /generate 接口，包含发起任务和轮询等待结果
    return post('/runninghub/generate', {
        webappId,
        nodeInfoList,
        cost,
        maxAttempts: 120,  // 最多等待 10 分钟 (120 * 5s)
        interval: 5000     // 每 5 秒查询一次
    });
};

// ============================================
// 全能视频S API (RH-Video-S)
// ============================================

// 全能视频S生成参数
export interface RHVideoSGenerateParams {
    source?: 'official' | 'community';  // 来源：官方/非官方
    mode?: 't2v' | 'i2v';               // 模式：文生视频/图生视频
    version?: 'standard' | 'pro';       // 版本：普通/PRO
    realistic?: boolean;                // 真人模式（仅官方+图生视频）
    prompt: string;                     // 提示词
    imageUrl?: string;                  // 图片URL（图生视频必须）
    duration?: string;                  // 时长
    aspectRatio?: '16:9' | '9:16';      // 宽高比
    resolution?: 'small' | 'large' | '720p' | '1080p';  // 分辨率
    size?: '720x1280' | '1280x720' | '1024x1792' | '1792x1024';  // 视频尺寸
}

// 全能视频S响应
export interface RHVideoSResponse {
    taskId: string;
    status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'SUCCESS';
    errorCode?: string;
    errorMessage?: string;
    results?: Array<{
        url: string;
        outputType: string;
        text?: string;  // 角色提取时返回角色ID
    }>;
    usage?: {
        thirdPartyConsumeMoney: string;
        consumeMoney: string;
        consumeCoins: string;
        taskCostTime: string;
    };
}

/**
 * 全能视频S - 生成视频
 * 支持文生视频/图生视频，官方/非官方，普通/PRO等组合
 */
export const rhVideoSGenerate = async (
    params: RHVideoSGenerateParams
): Promise<{
    success: boolean;
    data?: RHVideoSResponse;
    error?: string;
}> => {
    const result = await post<RHVideoSResponse>('/runninghub/rh-video-s/generate', params);
    console.log('[RH-Video-S] rhVideoSGenerate 响应:', JSON.stringify(result));
    
    // 后端直接转发RH API的响应，可能的格式：
    // 1. { taskId, status, ... } - RH成功响应
    // 2. { success: false, error: '...' } - 后端错误
    // 3. { errorCode, errorMessage } - RH错误响应
    
    if (!result) {
        return { success: false, error: '无响应数据' };
    }
    
    // 检查后端错误
    if ((result as any).success === false) {
        return { success: false, error: (result as any).error || '后端请求失败' };
    }
    
    // 检查RH API错误
    if ((result as any).errorCode && (result as any).errorCode !== '0') {
        return { success: false, error: (result as any).errorMessage || `RH错误: ${(result as any).errorCode}` };
    }
    
    // 检查taskId
    if ((result as any).taskId) {
        return { success: true, data: result as any as RHVideoSResponse };
    }
    
    // 如果result.data包含taskId（post函数封装）
    if ((result as any).data?.taskId) {
        return { success: true, data: (result as any).data as RHVideoSResponse };
    }
    
    return { success: false, error: '未获取到taskId', data: result as any };
};

/**
 * 全能视频S - 查询任务状态
 */
export const rhVideoSQuery = async (
    taskId: string
): Promise<{
    success: boolean;
    data?: RHVideoSResponse;
    error?: string;
}> => {
    const result = await post<RHVideoSResponse>('/runninghub/rh-video-s/query', { taskId });
    console.log('[RH-Video-S] rhVideoSQuery 响应:', JSON.stringify(result));
    
    if (!result) {
        return { success: false, error: '无响应数据' };
    }
    
    // 检查后端错误
    if ((result as any).success === false) {
        return { success: false, error: (result as any).error || '后端请求失败' };
    }
    
    // 检查taskId
    if ((result as any).taskId) {
        return { success: true, data: result as any as RHVideoSResponse };
    }
    
    // 如果result.data包含taskId
    if ((result as any).data?.taskId) {
        return { success: true, data: (result as any).data as RHVideoSResponse };
    }
    
    return { success: false, error: '查询失败' };
};

/**
 * 全能视频S - 角色提取
 * 从视频中提取角色ID
 */
export const rhVideoSExtractCharacter = async (
    videoUrl: string
): Promise<{
    success: boolean;
    data?: RHVideoSResponse;
    error?: string;
}> => {
    const result = await post<RHVideoSResponse>('/runninghub/rh-video-s/character-extract', { videoUrl });
    // RH标准模型API直接返回任务信息
    if (result && (result as any).taskId) {
        return { success: true, data: result as any as RHVideoSResponse };
    }
    return result;
};

/**
 * 全能视频S - 生成并等待结果
 * 轮询等待任务完成
 */
export const rhVideoSGenerateAndWait = async (
    params: RHVideoSGenerateParams,
    onProgress?: (status: string, progress?: string) => void,
    maxAttempts: number = 120,
    interval: number = 5000
): Promise<{
    success: boolean;
    data?: RHVideoSResponse;
    error?: string;
}> => {
    // 1. 发起生成任务
    const createResult = await rhVideoSGenerate(params);
    if (!createResult.success || !createResult.data?.taskId) {
        return { success: false, error: createResult.error || '发起任务失败' };
    }
    
    const taskId = createResult.data.taskId;
    onProgress?.('QUEUED', '任务已提交');
    
    // 2. 轮询等待结果
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        
        const queryResult = await rhVideoSQuery(taskId);
        if (!queryResult.success || !queryResult.data) {
            continue;
        }
        
        const { status, results, errorMessage } = queryResult.data;
        
        if (status === 'SUCCESS' && results && results.length > 0) {
            onProgress?.('SUCCESS', '生成完成');
            return { success: true, data: queryResult.data };
        } else if (status === 'FAILED') {
            onProgress?.('FAILED', errorMessage);
            return { success: false, error: errorMessage || '任务执行失败' };
        } else if (status === 'RUNNING') {
            onProgress?.('RUNNING', `生成中 (${i + 1}/${maxAttempts})`);
        } else if (status === 'QUEUED') {
            onProgress?.('QUEUED', `排队中 (${i + 1}/${maxAttempts})`);
        }
    }
    
    return { success: false, error: '等待超时，任务可能仍在运行中' };
};

/**
 * 全能视频S - 角色提取并等待结果
 */
export const rhVideoSExtractCharacterAndWait = async (
    videoUrl: string,
    onProgress?: (status: string, progress?: string) => void,
    maxAttempts: number = 60,
    interval: number = 3000
): Promise<{
    success: boolean;
    characterId?: string;
    error?: string;
}> => {
    // 1. 发起提取任务
    const createResult = await rhVideoSExtractCharacter(videoUrl);
    if (!createResult.success || !createResult.data?.taskId) {
        return { success: false, error: createResult.error || '发起任务失败' };
    }
    
    const taskId = createResult.data.taskId;
    onProgress?.('QUEUED', '任务已提交');
    
    // 2. 轮询等待结果
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        
        const queryResult = await rhVideoSQuery(taskId);
        if (!queryResult.success || !queryResult.data) {
            continue;
        }
        
        const { status, results, errorMessage } = queryResult.data;
        
        if (status === 'SUCCESS' && results && results.length > 0) {
            // 角色ID在 results[0].text 中
            const characterId = results[0].text;
            onProgress?.('SUCCESS', '提取完成');
            return { success: true, characterId };
        } else if (status === 'FAILED') {
            onProgress?.('FAILED', errorMessage);
            return { success: false, error: errorMessage || '任务执行失败' };
        } else if (status === 'RUNNING') {
            onProgress?.('RUNNING', `提取中 (${i + 1}/${maxAttempts})`);
        }
    }
    
    return { success: false, error: '等待超时' };
};
