/**
 * RunningHub API 代理路由
 * 代理前端请求到 RunningHub 平台
 */
const express = require('express');
const config = require('../config');
const JsonStorage = require('../utils/jsonStorage');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// RunningHub API 基础地址
const RH_BASE_URL = 'https://www.runninghub.cn';

// 文件上传配置
const upload = multer({
    dest: path.join(config.DATA_DIR, 'rh_uploads'),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ============================================
// 辅助函数
// ============================================

/**
 * 获取存储的 RunningHub 会员消费 API Key (用于 AI 应用)
 */
function getAppApiKey() {
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    return settings.runningHubAppApiKey || '';
}

/**
 * 获取存储的 RunningHub 企业共享 API Key (用于 RH Magic)
 */
function getMagicApiKey() {
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    return settings.runningHubMagicApiKey || '';
}

/**
 * 设置 RunningHub 会员消费 API Key
 */
function setAppApiKey(apiKey) {
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    settings.runningHubAppApiKey = apiKey;
    JsonStorage.save(config.SETTINGS_FILE, settings);
}

/**
 * 设置 RunningHub 企业共享 API Key
 */
function setMagicApiKey(apiKey) {
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    settings.runningHubMagicApiKey = apiKey;
    JsonStorage.save(config.SETTINGS_FILE, settings);
}

/**
 * 代理请求到 RunningHub
 */
async function proxyToRH(endpoint, method, body, headers = {}) {
    const url = `${RH_BASE_URL}${endpoint}`;
    const apiKey = getApiKey();
    
    if (!apiKey) {
        throw new Error('未配置 RunningHub API Key');
    }
    
    // 在 body 中注入 apiKey
    const requestBody = body ? { ...body, apiKey } : { apiKey };
    
    const response = await fetch(url, {
        method,
        headers: {
            'Host': 'www.runninghub.cn',
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify(requestBody)
    });
    
    return response.json();
}

// ============================================
// API 路由
// ============================================

/**
 * GET /config - 获取 RunningHub 配置状态
 */
router.get('/config', (req, res) => {
    try {
        const appApiKey = getAppApiKey();
        const magicApiKey = getMagicApiKey();
        res.json({
            success: true,
            data: {
                // 会员消费 API (AI 应用)
                appConfigured: !!appApiKey,
                appApiKeyPreview: appApiKey ? `${appApiKey.slice(0, 8)}...${appApiKey.slice(-4)}` : null,
                // 企业共享 API (RH Magic)
                magicConfigured: !!magicApiKey,
                magicApiKeyPreview: magicApiKey ? `${magicApiKey.slice(0, 8)}...${magicApiKey.slice(-4)}` : null,
                baseUrl: RH_BASE_URL
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /config - 保存 RunningHub API Key
 * 支持保存 appApiKey (会员消费) 或 magicApiKey (企业共享)
 */
router.post('/config', (req, res) => {
    try {
        const { apiKey, appApiKey, magicApiKey } = req.body;
        
        // 兼容旧的单 key 模式
        if (apiKey && !appApiKey && !magicApiKey) {
            // 旧模式：同时设置两个 key
            setAppApiKey(apiKey);
            setMagicApiKey(apiKey);
            return res.json({
                success: true,
                data: {
                    appConfigured: true,
                    magicConfigured: true,
                    appApiKeyPreview: `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`,
                    magicApiKeyPreview: `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
                }
            });
        }
        
        // 新模式：分别保存
        if (appApiKey) {
            setAppApiKey(appApiKey);
        }
        if (magicApiKey) {
            setMagicApiKey(magicApiKey);
        }
        
        const currentAppKey = getAppApiKey();
        const currentMagicKey = getMagicApiKey();
        
        res.json({
            success: true,
            data: {
                appConfigured: !!currentAppKey,
                magicConfigured: !!currentMagicKey,
                appApiKeyPreview: currentAppKey ? `${currentAppKey.slice(0, 8)}...${currentAppKey.slice(-4)}` : null,
                magicApiKeyPreview: currentMagicKey ? `${currentMagicKey.slice(0, 8)}...${currentMagicKey.slice(-4)}` : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /ai-app/info - 获取 AI 应用信息
 * 获取 nodeInfoList、应用名称、封面等
 * 使用会员消费 API Key
 */
router.post('/ai-app/info', async (req, res) => {
    try {
        const { webappId } = req.body;
        if (!webappId) {
            return res.status(400).json({ success: false, error: '缺少 webappId 参数' });
        }
        
        const apiKey = getAppApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 会员消费 API Key' });
        }
        
        // 使用 GET 请求获取 AI 应用信息
        const url = `${RH_BASE_URL}/api/webapp/apiCallDemo?apiKey=${encodeURIComponent(apiKey)}&webappId=${encodeURIComponent(webappId)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Host': 'www.runninghub.cn'
            }
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.json({
                success: false,
                error: result.msg || '获取 AI 应用信息失败',
                code: result.code
            });
        }
    } catch (error) {
        console.error('获取 AI 应用信息失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /upload - 上传文件到 RunningHub
 * 使用会员消费 API Key
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const apiKey = getAppApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 会员消费 API Key' });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        
        // 读取文件
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        
        // 构建 FormData
        const formData = new FormData();
        formData.append('apiKey', apiKey);
        formData.append('fileType', 'input');
        formData.append('file', fileBuffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        
        // 上传到 RunningHub
        const response = await fetch(`${RH_BASE_URL}/task/openapi/upload`, {
            method: 'POST',
            headers: {
                'Host': 'www.runninghub.cn',
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const result = await response.json();
        
        // 清理临时文件
        fs.unlinkSync(filePath);
        
        if (result.code === 0) {
            res.json({
                success: true,
                fileName: result.data?.fileName,
                fileType: result.data?.fileType
            });
        } else {
            res.json({
                success: false,
                error: result.msg || '文件上传失败'
            });
        }
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /upload-image - 上传 base64 图片到 RunningHub
 * 使用标准模型 API 的上传接口: /openapi/v2/media/upload/binary
 * 使用企业共享 API Key (RH Magic)
 */
router.post('/upload-image', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, error: '缺少图片数据' });
        }
        
        console.log('[RH Upload] 开始上传图片, 数据长度:', image.length);
        
        // 解析 base64 数据
        let base64Data = image;
        let mimeType = 'image/png';
        let extension = '.png';
        
        if (image.startsWith('data:')) {
            const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
                
                // 根据 MIME 类型确定扩展名
                if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
                    extension = '.jpg';
                } else if (mimeType.includes('png')) {
                    extension = '.png';
                } else if (mimeType.includes('gif')) {
                    extension = '.gif';
                } else if (mimeType.includes('webp')) {
                    extension = '.webp';
                }
            }
        }
        
        console.log('[RH Upload] MIME:', mimeType, '扩展名:', extension);
        
        // 将 base64 转换为 Buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `upload_${Date.now()}${extension}`;
        
        console.log('[RH Upload] 文件名:', fileName, '大小:', imageBuffer.length);
        
        // 构建 FormData - 使用标准模型 API 的上传接口
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: fileName,
            contentType: mimeType
        });
        
        // 上传到 RunningHub - 使用新的标准模型 API 上传接口
        console.log('[RH Upload] 请求 RH API: /openapi/v2/media/upload/binary');
        const response = await fetch(`${RH_BASE_URL}/openapi/v2/media/upload/binary`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const result = await response.json();
        console.log('[RH Upload] RH响应:', JSON.stringify(result));
        
        if (result.code === 0 && result.data?.download_url) {
            // 返回 download_url 用于标准模型 API
            res.json({
                success: true,
                data: {
                    fileName: result.data.download_url,  // 直接返回完整 URL
                    downloadUrl: result.data.download_url,
                    fileType: result.data.type
                }
            });
        } else {
            res.json({
                success: false,
                error: result.message || '图片上传失败'
            });
        }
    } catch (error) {
        console.error('[RH Upload] 图片上传失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /upload-image-for-app - 上传 base64 图片到 RunningHub（AI 应用专用）
 * 使用 AI 应用的上传接口: /task/openapi/upload
 * 使用会员消费 API Key
 */
router.post('/upload-image-for-app', async (req, res) => {
    try {
        const apiKey = getAppApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 会员消费 API Key' });
        }
        
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, error: '缺少图片数据' });
        }
        
        console.log('[RH App Upload] 开始上传图片, 数据长度:', image.length);
        
        // 解析 base64 数据
        let base64Data = image;
        let mimeType = 'image/png';
        let extension = '.png';
        
        if (image.startsWith('data:')) {
            const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
                
                // 根据 MIME 类型确定扩展名
                if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
                    extension = '.jpg';
                } else if (mimeType.includes('png')) {
                    extension = '.png';
                } else if (mimeType.includes('gif')) {
                    extension = '.gif';
                } else if (mimeType.includes('webp')) {
                    extension = '.webp';
                }
            }
        }
        
        console.log('[RH App Upload] MIME:', mimeType, '扩展名:', extension);
        
        // 将 base64 转换为 Buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `upload_${Date.now()}${extension}`;
        
        console.log('[RH App Upload] 文件名:', fileName, '大小:', imageBuffer.length);
        
        // 构建 FormData - 使用 AI 应用的上传接口
        const formData = new FormData();
        formData.append('apiKey', apiKey);
        formData.append('fileType', 'input');
        formData.append('file', imageBuffer, {
            filename: fileName,
            contentType: mimeType
        });
        
        // 上传到 RunningHub - 使用 AI 应用的上传接口
        console.log('[RH App Upload] 请求 RH API: /task/openapi/upload');
        const response = await fetch(`${RH_BASE_URL}/task/openapi/upload`, {
            method: 'POST',
            headers: {
                'Host': 'www.runninghub.cn',
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const result = await response.json();
        console.log('[RH App Upload] RH响应:', JSON.stringify(result));
        
        if (result.code === 0 && result.data?.fileName) {
            // 返回 fileName 用于 AI 应用
            res.json({
                success: true,
                data: {
                    fileKey: result.data.fileName,  // AI 应用需要 fileKey
                    fileName: result.data.fileName,
                    fileType: result.data.fileType
                }
            });
        } else {
            res.json({
                success: false,
                error: result.msg || '图片上传失败'
            });
        }
    } catch (error) {
        console.error('[RH App Upload] 图片上传失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /ai-app/run - 发起 AI 应用任务
 * 使用会员消费 API Key
 */
router.post('/ai-app/run', async (req, res) => {
    try {
        const { webappId, nodeInfoList, webhookUrl, instanceType } = req.body;
        
        if (!webappId) {
            return res.status(400).json({ success: false, error: '缺少 webappId 参数' });
        }
        
        const apiKey = getAppApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 会员消费 API Key' });
        }
        
        const requestBody = {
            apiKey,
            webappId,
            nodeInfoList: nodeInfoList || []
        };
        
        if (webhookUrl) requestBody.webhookUrl = webhookUrl;
        if (instanceType) requestBody.instanceType = instanceType;
        
        const response = await fetch(`${RH_BASE_URL}/task/openapi/ai-app/run`, {
            method: 'POST',
            headers: {
                'Host': 'www.runninghub.cn',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.json({
                success: false,
                error: result.msg || '发起任务失败',
                code: result.code
            });
        }
    } catch (error) {
        console.error('发起 AI 应用任务失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /outputs - 查询任务输出结果
 * 使用会员消费 API Key
 */
router.post('/outputs', async (req, res) => {
    try {
        const { taskId } = req.body;
        
        if (!taskId) {
            return res.status(400).json({ success: false, error: '缺少 taskId 参数' });
        }
        
        const apiKey = getAppApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 会员消费 API Key' });
        }
        
        const response = await fetch(`${RH_BASE_URL}/task/openapi/outputs`, {
            method: 'POST',
            headers: {
                'Host': 'www.runninghub.cn',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey, taskId })
        });
        
        const result = await response.json();
        
        // 根据 code 返回不同状态
        // code 0 = 成功, code 804 = 运行中, code 813 = 排队中, code 805 = 失败
        if (result.code === 0) {
            res.json({
                success: true,
                status: 'SUCCESS',
                data: result.data
            });
        } else if (result.code === 804) {
            res.json({
                success: true,
                status: 'RUNNING',
                data: result.data
            });
        } else if (result.code === 813) {
            res.json({
                success: true,
                status: 'QUEUED',
                data: null
            });
        } else if (result.code === 805) {
            res.json({
                success: false,
                status: 'FAILED',
                error: result.msg || '任务失败',
                failedReason: result.data?.failedReason
            });
        } else {
            res.json({
                success: false,
                error: result.msg || '查询失败',
                code: result.code
            });
        }
    } catch (error) {
        console.error('查询任务输出失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /generate - 一站式生成：发起任务并轮询等待结果
 * 使用会员消费 API Key
 */
router.post('/generate', async (req, res) => {
    try {
        const { webappId, nodeInfoList, maxAttempts = 60, interval = 5000 } = req.body;
        
        if (!webappId) {
            return res.status(400).json({ success: false, error: '缺少 webappId 参数' });
        }
        
        const apiKey = getAppApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 会员消费 API Key' });
        }
        
        // 1. 发起任务
        const createResponse = await fetch(`${RH_BASE_URL}/task/openapi/ai-app/run`, {
            method: 'POST',
            headers: {
                'Host': 'www.runninghub.cn',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey,
                webappId,
                nodeInfoList: nodeInfoList || []
            })
        });
        
        const createResult = await createResponse.json();
        
        if (createResult.code !== 0) {
            return res.json({
                success: false,
                error: createResult.msg || '发起任务失败'
            });
        }
        
        const taskId = createResult.data?.taskId;
        if (!taskId) {
            return res.json({
                success: false,
                error: '未获取到 taskId'
            });
        }
        
        // 2. 轮询等待结果
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            
            const outputResponse = await fetch(`${RH_BASE_URL}/task/openapi/outputs`, {
                method: 'POST',
                headers: {
                    'Host': 'www.runninghub.cn',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey, taskId })
            });
            
            const outputResult = await outputResponse.json();
            
            if (outputResult.code === 0 && Array.isArray(outputResult.data) && outputResult.data.length > 0) {
                // 成功获取结果
                return res.json({
                    success: true,
                    data: {
                        taskId,
                        outputs: outputResult.data
                    }
                });
            } else if (outputResult.code === 805) {
                // 任务失败
                return res.json({
                    success: false,
                    error: outputResult.msg || '任务执行失败',
                    failedReason: outputResult.data?.failedReason
                });
            }
            // 其他状态（运行中、排队中）继续轮询
        }
        
        // 超时
        res.json({
            success: false,
            error: '等待超时，任务可能仍在运行中',
            taskId
        });
        
    } catch (error) {
        console.error('一站式生成失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// 香蕉 (全能图片PRO) API 代理
// 使用企业共享 API Key (RH Magic)
// ============================================

/**
 * POST /banana/text-to-image - 文生图
 * 使用企业共享 API Key
 */
router.post('/banana/text-to-image', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const { prompt, resolution, aspectRatio, official } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: '缺少 prompt 参数' });
        }
        
        // 根据 official 选择 API 端点
        const endpoint = official !== false 
            ? '/openapi/v2/rhart-image-n-pro-official/text-to-image'
            : '/openapi/v2/rhart-image-n-pro/text-to-image';
        
        // 对官方模型，分辨率需要小写
        const body = { prompt, resolution: resolution || '2K' };
        if (official !== false && body.resolution) {
            // 官方模型：1K -> 1k, 2K -> 2k, 4K -> 4k
            body.resolution = body.resolution.toLowerCase();
        }
        if (aspectRatio) body.aspectRatio = aspectRatio;
        
        const response = await fetch(`${RH_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        console.log('[Banana] 文生图响应:', JSON.stringify(result));
        res.json(result);
    } catch (error) {
        console.error('香蕉文生图失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /banana/image-to-image - 图生图
 * 使用企业共享 API Key
 */
router.post('/banana/image-to-image', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const { prompt, resolution, aspectRatio, imageUrls, official } = req.body;
        console.log('[Banana I2I] 收到请求:', { prompt: prompt?.slice(0, 30), resolution, aspectRatio, imageUrlsCount: imageUrls?.length, imageUrls, official });
        
        if (!prompt || !imageUrls || imageUrls.length === 0) {
            return res.status(400).json({ success: false, error: '缺少 prompt 或 imageUrls 参数' });
        }
        
        // 根据 official 选择 API 端点
        const endpoint = official !== false 
            ? '/openapi/v2/rhart-image-n-pro-official/edit'
            : '/openapi/v2/rhart-image-n-pro/edit';
        
        const body = { prompt, imageUrls };
        if (resolution) {
            // 对官方模型，分辨率需要小写
            if (official !== false) {
                // 官方模型：1K -> 1k, 2K -> 2k, 4K -> 4k
                body.resolution = resolution.toLowerCase();
            } else {
                body.resolution = resolution;
            }
        }
        if (aspectRatio) body.aspectRatio = aspectRatio;
        
        console.log('[Banana I2I] 调用RH API:', endpoint, '请求体:', JSON.stringify(body));
        
        const response = await fetch(`${RH_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        console.log('[Banana] 图生图响应:', JSON.stringify(result));
        res.json(result);
    } catch (error) {
        console.error('香蕉图生图失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /banana/query - 查询任务状态
 * 使用企业共享 API Key
 */
router.post('/banana/query', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({ success: false, error: '缺少 taskId 参数' });
        }
        
        const response = await fetch(`${RH_BASE_URL}/openapi/v2/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ taskId })
        });
        
        const result = await response.json();
        console.log('[Banana] 查询响应:', JSON.stringify(result));
        res.json(result);
    } catch (error) {
        console.error('香蕉查询任务失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// 全能视频S API 代理
// 使用企业共享 API Key (RH Magic)
// ============================================

/**
 * 根据配置组合获取全能视频S的API端点
 * @param {string} source - 'official' | 'community'
 * @param {string} mode - 't2v' | 'i2v'
 * @param {string} version - 'standard' | 'pro'
 * @param {boolean} realistic - 真人模式（仅官方+图生视频）
 */
function getRhVideoSEndpoint(source, mode, version, realistic) {
    const isOfficial = source === 'official';
    const basePath = isOfficial ? '/openapi/v2/rhart-video-s-official' : '/openapi/v2/rhart-video-s';
    
    if (mode === 'i2v') {
        // 图生视频
        if (isOfficial && realistic) {
            return `${basePath}/image-to-video-realistic`;
        }
        return version === 'pro' ? `${basePath}/image-to-video-pro` : `${basePath}/image-to-video`;
    } else {
        // 文生视频
        return version === 'pro' ? `${basePath}/text-to-video-pro` : `${basePath}/text-to-video`;
    }
}

/**
 * POST /rh-video-s/generate - 全能视频S统一生成入口
 * 使用企业共享 API Key
 */
router.post('/rh-video-s/generate', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const {
            source = 'official',     // 'official' | 'community'
            mode = 'i2v',            // 't2v' | 'i2v'
            version = 'standard',    // 'standard' | 'pro'
            realistic = false,       // 真人模式
            prompt,                  // 提示词
            imageUrl,                // 图片URL（图生视频必须）
            duration,                // 时长
            aspectRatio,             // 宽高比
            resolution,              // 分辨率
            size                     // 视频尺寸（官方文生视频用）
        } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ success: false, error: '缺少 prompt 参数' });
        }
        
        if (mode === 'i2v' && !imageUrl) {
            return res.status(400).json({ success: false, error: '图生视频模式缺少 imageUrl 参数' });
        }
        
        // 获取API端点
        const endpoint = getRhVideoSEndpoint(source, mode, version, realistic);
        console.log('[RH-Video-S] API端点:', endpoint);
        
        // 构建请求体
        const body = { prompt };
        
        if (mode === 'i2v') {
            // 图生视频
            body.imageUrl = imageUrl;
            if (duration) body.duration = duration;
            if (aspectRatio) body.aspectRatio = aspectRatio;
            
            // 非官方普通版需要resolution参数
            if (source === 'community' && version === 'standard' && resolution) {
                body.resolution = resolution;
            }
            // 官方PRO版需要resolution参数
            if (source === 'official' && version === 'pro' && resolution) {
                body.resolution = resolution;
            }
        } else {
            // 文生视频
            if (duration) body.duration = duration;
            if (aspectRatio) body.aspectRatio = aspectRatio;
            
            // 非官方文生视频需要resolution和aspectRatio
            if (source === 'community') {
                if (resolution) body.resolution = resolution;
            }
            // 官方文生视频需要size参数
            if (source === 'official') {
                if (size) body.size = size;
            }
        }
        
        console.log('[RH-Video-S] 请求体:', JSON.stringify(body));
        
        const response = await fetch(`${RH_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        console.log('[RH-Video-S] 响应:', JSON.stringify(result));
        res.json(result);
    } catch (error) {
        console.error('[RH-Video-S] 生成失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /rh-video-s/character-extract - 角色提取
 * 使用企业共享 API Key
 */
router.post('/rh-video-s/character-extract', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const { videoUrl } = req.body;
        if (!videoUrl) {
            return res.status(400).json({ success: false, error: '缺少 videoUrl 参数' });
        }
        
        console.log('[RH-Video-S] 角色提取, videoUrl:', videoUrl);
        
        const response = await fetch(`${RH_BASE_URL}/openapi/v2/rhart-video-s/sora-upload-character`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ videoUrl })
        });
        
        const result = await response.json();
        console.log('[RH-Video-S] 角色提取响应:', JSON.stringify(result));
        res.json(result);
    } catch (error) {
        console.error('[RH-Video-S] 角色提取失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /rh-video-s/query - 查询任务状态
 * 使用企业共享 API Key
 * 复用标准模型API的查询接口
 */
router.post('/rh-video-s/query', async (req, res) => {
    try {
        const apiKey = getMagicApiKey();
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '未配置 RunningHub 企业共享 API Key' });
        }
        
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({ success: false, error: '缺少 taskId 参数' });
        }
        
        const response = await fetch(`${RH_BASE_URL}/openapi/v2/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ taskId })
        });
        
        const result = await response.json();
        console.log('[RH-Video-S] 查询响应:', JSON.stringify(result));
        res.json(result);
    } catch (error) {
        console.error('[RH-Video-S] 查询任务失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
