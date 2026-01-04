const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const http = require('http');
const config = require('../config');
const JsonStorage = require('../utils/jsonStorage');
const FileHandler = require('../utils/fileHandler');
const { CreativeExtractor, extract } = require('../utils/creativeExtractor');

const router = express.Router();

// 智能导入并发锁
let isSmartImporting = false;

/**
 * 下载远程URL图片并保存到本地
 */
function downloadAndSaveImage(imageUrl, saveDir) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(imageUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const request = client.get(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000
      }, (response) => {
        // 处理重定向
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          downloadAndSaveImage(response.headers.location, saveDir).then(resolve);
          return;
        }
        
        if (response.statusCode !== 200) {
          console.error(`  ✗ 下载图片失败: HTTP ${response.statusCode}`);
          resolve({ success: false, error: `HTTP ${response.statusCode}` });
          return;
        }
        
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            const contentType = response.headers['content-type'] || 'image/jpeg';
            
            // 确定文件扩展名
            let ext = '.jpg';
            if (contentType.includes('png')) ext = '.png';
            else if (contentType.includes('gif')) ext = '.gif';
            else if (contentType.includes('webp')) ext = '.webp';
            else if (contentType.includes('svg')) ext = '.svg';
            
            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{6})$/, '$1_$2');
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const filename = `penguin_${timestamp}_${randomSuffix}${ext}`;
            const filePath = path.join(saveDir, filename);
            
            // 确保目录存在
            if (!fs.existsSync(saveDir)) {
              fs.mkdirSync(saveDir, { recursive: true });
            }
            
            // 保存文件
            fs.writeFileSync(filePath, buffer);
            const relativeUrl = `/files/creative_images/${filename}`;
            console.log(`  ✓ 远程图片已下载: ${filename}`);
            resolve({ success: true, data: { url: relativeUrl, filename } });
          } catch (saveError) {
            console.error(`  ✗ 保存下载图片失败: ${saveError.message}`);
            resolve({ success: false, error: saveError.message });
          }
        });
      });
      
      request.on('error', (error) => {
        console.error(`  ✗ 下载图片请求失败: ${error.message}`);
        resolve({ success: false, error: error.message });
      });
      
      request.on('timeout', () => {
        request.destroy();
        console.error('  ✗ 下载图片超时');
        resolve({ success: false, error: '下载超时' });
      });
    } catch (error) {
      console.error(`  ✗ 下载图片异常: ${error.message}`);
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * 处理创意图片：将base64或远程URL保存为本地文件
 * 改进错误处理，避免因图片保存失败导致创意无法保存
 */
async function processCreativeImage(idea) {
  try {
    const imageUrl = idea.imageUrl || '';
    
    // 如果已经是本地文件URL，直接返回
    if (!imageUrl || imageUrl.startsWith('/files/')) {
      return idea;
    }
    
    // 如果是base64，保存到文件
    if (imageUrl.startsWith('data:')) {
      const result = FileHandler.saveImage(imageUrl, config.CREATIVE_IMAGES_DIR);
      if (result.success) {
        idea.imageUrl = result.data.url;
        console.log(`  ✓ 创意图片已保存: ${result.data.filename}`);
      } else {
        console.error(`  ✗ 创意图片保存失败: ${result.error}`);
        console.log(`  ⚠️ 保留原始图片URL以避免丢失`);
      }
      return idea;
    }
    
    // 如果是远程URL，下载并保存到本地
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const result = await downloadAndSaveImage(imageUrl, config.CREATIVE_IMAGES_DIR);
      if (result.success) {
        idea.imageUrl = result.data.url;
      } else {
        console.error(`  ✗ 下载远程图片失败: ${result.error}`);
        console.log(`  ⚠️ 保留原始远程URL`);
      }
      return idea;
    }
    
    return idea;
  } catch (error) {
    console.error(`  ✗ 处理创意图片时发生错误: ${error.message}`);
    console.log(`  ⚠️ 保留原始图片URL以避免丢失`);
    return idea;
  }
}

// 获取所有创意
router.get('/', (req, res) => {
  const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
  res.json({ success: true, data: ideas });
});

// 获取单个创意
router.get('/:id', (req, res) => {
  const ideaId = parseInt(req.params.id);
  const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
  const idea = ideas.find(i => i.id === ideaId);
  
  if (idea) {
    res.json({ success: true, data: idea });
  } else {
    res.status(404).json({ success: false, error: '创意不存在' });
  }
});

// 创建新创意
router.post('/', async (req, res) => {
  try {
    const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
    
    // 生成新ID
    const newId = Math.max(...ideas.map(i => i.id || 0), 0) + 1;
    const newIdea = {
      ...req.body,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 处理图片：将base64或远程URL保存为本地文件
    await processCreativeImage(newIdea);
    
    ideas.push(newIdea);
    JsonStorage.save(config.CREATIVE_IDEAS_FILE, ideas);
    
    res.json({ success: true, data: newIdea });
  } catch (error) {
    console.error('创建创意失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新创意
router.put('/:id', async (req, res) => {
  try {
    const ideaId = parseInt(req.params.id);
    const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
    
    const index = ideas.findIndex(i => i.id === ideaId);
    if (index !== -1) {
      const updatedIdea = {
        ...ideas[index],
        ...req.body,
        id: ideaId,
        updatedAt: new Date().toISOString()
      };
      
      // 处理图片：将base64或远程URL保存为本地文件
      await processCreativeImage(updatedIdea);
      
      ideas[index] = updatedIdea;
      JsonStorage.save(config.CREATIVE_IDEAS_FILE, ideas);
      
      res.json({ success: true, data: updatedIdea });
    } else {
      res.status(404).json({ success: false, error: '创意不存在' });
    }
  } catch (error) {
    console.error('更新创意失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除创意
router.delete('/:id', (req, res) => {
  const ideaId = parseInt(req.params.id);
  const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
  
  const originalLength = ideas.length;
  const filteredIdeas = ideas.filter(i => i.id !== ideaId);
  
  if (filteredIdeas.length < originalLength) {
    JsonStorage.save(config.CREATIVE_IDEAS_FILE, filteredIdeas);
    res.json({ success: true, message: '删除成功' });
  } else {
    res.status(404).json({ success: false, error: '创意不存在' });
  }
});

// 批量导入创意（去重：标题+提示词相同则跳过）
router.post('/import', async (req, res) => {
  try {
    const newIdeas = req.body.ideas || [];
    const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
    
    // 创建现有创意的特征集合（标题 + 提示词）
    const existingSet = new Set();
    ideas.forEach(idea => {
      const title = (idea.title || '').trim().toLowerCase();
      const prompt = (idea.prompt || '').trim().toLowerCase();
      existingSet.add(`${title}::${prompt}`);
    });
    
    let maxId = Math.max(...ideas.map(i => i.id || 0), 0);
    const imported = [];
    let skipped = 0;
    
    for (const idea of newIdeas) {
      // 检查是否已存在
      const title = (idea.title || '').trim().toLowerCase();
      const prompt = (idea.prompt || '').trim().toLowerCase();
      const key = `${title}::${prompt}`;
      
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }
      
      // 新创意，添加到库中
      maxId++;
      const newIdea = {
        ...idea,
        id: maxId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 处理图片（下载远程URL或保存base64）
      await processCreativeImage(newIdea);
      
      ideas.push(newIdea);
      imported.push(newIdea);
      existingSet.add(key);
    }
    
    JsonStorage.save(config.CREATIVE_IDEAS_FILE, ideas);
    
    res.json({
      success: true,
      data: imported,
      imported: imported.length,
      skipped: skipped,
      message: `导入成功: ${imported.length} 个新创意${skipped > 0 ? `, 跳过 ${skipped} 个重复` : ''}`
    });
  } catch (error) {
    console.error('导入创意失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 重新排序创意
router.post('/reorder', (req, res) => {
  const orderedIds = req.body.orderedIds || [];
  const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
  
  // 创建ID到创意的映射
  const idToIdea = {};
  ideas.forEach(idea => {
    idToIdea[idea.id] = idea;
  });
  
  // 按新顺序重排
  const reordered = [];
  orderedIds.forEach((ideaId, index) => {
    if (idToIdea[ideaId]) {
      const idea = idToIdea[ideaId];
      idea.order = index;
      reordered.push(idea);
    }
  });
  
  // 添加未在列表中的创意
  ideas.forEach(idea => {
    if (!orderedIds.includes(idea.id)) {
      reordered.push(idea);
    }
  });
  
  JsonStorage.save(config.CREATIVE_IDEAS_FILE, reordered);
  res.json({ success: true, message: '排序已更新' });
});

// 代理外部API数据获取（解决CORS问题）
router.get('/external-data', async (req, res) => {
  try {
    const { url } = req.query;
    console.log('收到外部数据请求，URL:', url); // 调试信息
    
    if (!url) {
      console.log('缺少URL参数');
      return res.status(400).json({ success: false, error: '缺少URL参数' });
    }
    
    // 验证URL是否为允许的域名
    const allowedDomains = ['opennana.com'];
    
    try {
      const parsedUrlForValidation = new URL(url);
      console.log('解析的主机名:', parsedUrlForValidation.hostname); // 调试信息
      
      if (!allowedDomains.some(domain => parsedUrlForValidation.hostname.includes(domain))) {
        console.log('不允许的域名:', parsedUrlForValidation.hostname);
        return res.status(400).json({ success: false, error: '不允许的域名' });
      }
    } catch (urlError) {
      console.log('URL解析错误:', urlError.message);
      return res.status(400).json({ success: false, error: '无效的URL格式' });
    }
    
    // 使用内置的http/https模块替代fetch，以避免Node.js版本兼容性问题
    const https = require('https');
    const http = require('http');
    
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const request = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            const jsonData = JSON.parse(data);
            res.json({ success: true, data: jsonData });
          } else {
            res.status(response.statusCode).json({ success: false, error: `HTTP ${response.statusCode}: ${response.statusMessage}` });
          }
        } catch (parseError) {
          console.error('解析响应失败:', parseError.message);
          res.status(500).json({ success: false, error: `解析响应失败: ${parseError.message}` });
        }
      });
    });
    
    request.on('error', (error) => {
      console.error('请求外部数据失败:', error);
      res.status(500).json({ success: false, error: error.message });
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      console.error('请求超时');
      res.status(408).json({ success: false, error: '请求超时' });
    });
  } catch (error) {
    console.error('获取外部数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 智能导入：从外部URL提取创意并导入
router.post('/smart-import', async (req, res) => {
  // 检查并发锁
  if (isSmartImporting) {
    console.log('智能导入正在进行中，拒绝新请求');
    return res.status(429).json({
      success: false,
      error: '正在导入中，请等待当前导入完成后再试'
    });
  }
  
  // 设置锁
  isSmartImporting = true;
  
  try {
    const { url, idRange } = req.body;
    
    console.log('=== 智能导入请求 ===');
    console.log('URL:', url);
    console.log('ID范围:', idRange);
    
    if (!url) {
      return res.status(400).json({ success: false, error: '缺少数据URL参数' });
    }
    
    if (!idRange) {
      return res.status(400).json({ success: false, error: '缺少ID范围参数' });
    }
    
    // 验证URL是否为允许的域名
    const allowedDomains = ['opennana.com'];
    try {
      const parsedUrl = new URL(url);
      if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
        return res.status(400).json({ success: false, error: '不允许的数据源域名' });
      }
    } catch (urlError) {
      return res.status(400).json({ success: false, error: '无效的URL格式' });
    }
    
    // 使用CreativeExtractor提取数据
    console.log('开始提取数据...');
    const extractedData = await extract({
      url: url,
      idRange: idRange,
      onProgress: (current, total, record) => {
        console.log(`进度: ${current}/${total} - ID: ${record.id}`);
      }
    });
    
    console.log(`提取完成，共 ${extractedData.length} 条记录`);
    
    if (extractedData.length === 0) {
      return res.json({
        success: true,
        data: [],
        imported: 0,
        skipped: 0,
        message: '未找到符合条件的记录'
      });
    }
    
    // 导入到创意库
    const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
    
    // 创建现有创意的特征集合（标题 + 提示词）
    const existingSet = new Set();
    ideas.forEach(idea => {
      const title = (idea.title || '').trim().toLowerCase();
      const prompt = (idea.prompt || '').trim().toLowerCase();
      existingSet.add(`${title}::${prompt}`);
    });
    
    let maxId = Math.max(...ideas.map(i => i.id || 0), 0);
    const imported = [];
    let skipped = 0;
    
    for (const idea of extractedData) {
      // 检查是否已存在
      const title = (idea.title || '').trim().toLowerCase();
      const prompt = (idea.prompt || '').trim().toLowerCase();
      const key = `${title}::${prompt}`;
      
      if (existingSet.has(key)) {
        skipped++;
        console.log(`跳过重复: ${idea.title}`);
        continue;
      }
      
      // 新创意，添加到库中
      maxId++;
      const newIdea = {
        ...idea,
        id: maxId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 处理图片（下载远程URL到本地）
      await processCreativeImage(newIdea);
      
      ideas.push(newIdea);
      imported.push(newIdea);
      existingSet.add(key);
    }
    
    JsonStorage.save(config.CREATIVE_IDEAS_FILE, ideas);
    
    console.log(`=== 导入完成 ===`);
    console.log(`新增: ${imported.length}, 跳过: ${skipped}`);
    
    res.json({
      success: true,
      data: imported,
      imported: imported.length,
      skipped: skipped,
      message: `导入成功: ${imported.length} 个新创意${skipped > 0 ? `, 跳过 ${skipped} 个重复` : ''}`
    });
    
  } catch (error) {
    console.error('智能导入失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '提取数据失败'
    });
  } finally {
    // 释放锁
    isSmartImporting = false;
  }
});

module.exports = router;

// 清理创意库中的远程URL，下载到本地
router.post('/cleanup-remote-urls', async (req, res) => {
  try {
    console.log('=== 开始清理远程URL ===');
    const ideas = JsonStorage.load(config.CREATIVE_IDEAS_FILE, []);
    
    let cleaned = 0;
    let failed = 0;
    
    for (const idea of ideas) {
      if (idea.imageUrl && (idea.imageUrl.startsWith('http://') || idea.imageUrl.startsWith('https://'))) {
        console.log(`处理: ${idea.title} - ${idea.imageUrl.substring(0, 50)}...`);
        const result = await downloadAndSaveImage(idea.imageUrl, config.CREATIVE_IMAGES_DIR);
        if (result.success) {
          idea.imageUrl = result.data.url;
          cleaned++;
        } else {
          failed++;
        }
      }
    }
    
    JsonStorage.save(config.CREATIVE_IDEAS_FILE, ideas);
    
    console.log(`=== 清理完成: 成功 ${cleaned}, 失败 ${failed} ===`);
    
    res.json({
      success: true,
      cleaned,
      failed,
      message: `清理完成: ${cleaned} 个远程图片已下载到本地${failed > 0 ? `, ${failed} 个失败` : ''}`
    });
  } catch (error) {
    console.error('清理失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
