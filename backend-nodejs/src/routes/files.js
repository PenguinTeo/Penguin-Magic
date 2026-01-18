const express = require('express');
const path = require('path');
const config = require('../config');
const FileHandler = require('../utils/fileHandler');
const PathHelper = require('../utils/pathHelper');
const ThumbnailGenerator = require('../utils/thumbnail');

const router = express.Router();

// 列出输出文件
router.get('/output', (req, res) => {
  const files = FileHandler.listFiles(config.OUTPUT_DIR, ['.png', '.jpg', '.jpeg', '.webp', '.gif']);
  res.json({ success: true, data: files });
});

// 列出输入文件
router.get('/input', (req, res) => {
  const files = FileHandler.listFiles(config.INPUT_DIR, ['.png', '.jpg', '.jpeg', '.webp', '.gif']);
  res.json({ success: true, data: files });
});

// 保存图片到output目录（并生成缩略图）
router.post('/save-output', async (req, res) => {
  const { imageData, filename } = req.body;
  
  if (!imageData) {
    return res.status(400).json({ success: false, error: '缺少图片数据' });
  }
  
  const result = FileHandler.saveImage(imageData, config.OUTPUT_DIR, filename);
  
  // 异步生成缩略图（不阻塞主流程）
  if (result.success && result.data?.path) {
    ThumbnailGenerator.generate(result.data.path, 'output').then(thumbResult => {
      if (thumbResult.success) {
        console.log(`[Thumbnail] output: ${result.data.filename}`);
      }
    }).catch(err => console.error('[Thumbnail] 生成失败:', err.message));
  }
  
  res.json(result);
});

// 保存视频到output目录
router.post('/save-video', async (req, res) => {
  const { videoData, filename } = req.body;
  
  if (!videoData) {
    return res.status(400).json({ success: false, error: '缺少视频数据' });
  }
  
  const result = FileHandler.saveVideo(videoData, config.OUTPUT_DIR, filename);
  
  if (result.success) {
    console.log(`[Video] 视频已保存: ${result.data.filename}`);
  }
  
  res.json(result);
});

// 保存图片到input目录（并生成缩略图）
router.post('/save-input', async (req, res) => {
  const { imageData, filename } = req.body;
  
  if (!imageData) {
    return res.status(400).json({ success: false, error: '缺少图片数据' });
  }
  
  const result = FileHandler.saveImage(imageData, config.INPUT_DIR, filename);
  
  // 异步生成缩略图
  if (result.success && result.data?.path) {
    ThumbnailGenerator.generate(result.data.path, 'input').then(thumbResult => {
      if (thumbResult.success) {
        console.log(`[Thumbnail] input: ${result.data.filename}`);
      }
    }).catch(err => console.error('[Thumbnail] 生成失败:', err.message));
  }
  
  res.json(result);
});

// 保存图片到系统桌面
router.post('/save-desktop', (req, res) => {
  const { imageData, filename } = req.body;
  
  if (!imageData) {
    return res.status(400).json({ success: false, error: '缺少图片数据' });
  }
  
  const desktopPath = PathHelper.getDesktopPath();
  const result = FileHandler.saveImage(imageData, desktopPath, filename);
  
  if (result.success) {
    result.desktop_path = desktopPath;
  }
  
  res.json(result);
});

// 删除输出文件（同时删除缩略图）
router.delete('/output/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(config.OUTPUT_DIR, filename);
  
  // 安全检查：确保文件在output目录内
  const safePath = PathHelper.safePath(config.OUTPUT_DIR, filename);
  if (!safePath) {
    return res.status(400).json({ success: false, error: '非法文件路径' });
  }
  
  const deleted = FileHandler.deleteFile(filePath);
  if (deleted) {
    // 同时删除缩略图
    ThumbnailGenerator.delete(filename, 'output');
    res.json({ success: true, message: '文件已删除' });
  } else {
    res.status(404).json({ success: false, error: '文件不存在' });
  }
});

// 删除输入文件（同时删除缩略图）
router.delete('/input/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(config.INPUT_DIR, filename);
  
  // 安全检查：确保文件在input目录内
  const safePath = PathHelper.safePath(config.INPUT_DIR, filename);
  if (!safePath) {
    return res.status(400).json({ success: false, error: '非法文件路径' });
  }
  
  const deleted = FileHandler.deleteFile(filePath);
  if (deleted) {
    // 同时删除缩略图
    ThumbnailGenerator.delete(filename, 'input');
    res.json({ success: true, message: '文件已删除' });
  } else {
    res.status(404).json({ success: false, error: '文件不存在' });
  }
});

// 下载远程图片并保存到本地output目录（支持URL格式）
router.post('/download-remote', async (req, res) => {
  const { imageUrl, filename } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({ success: false, error: '缺少图片URL' });
  }
  
  // 验证是否为有效的URL
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return res.status(400).json({ success: false, error: '无效的URL格式' });
  }
  
  try {
    console.log('[Download] 开始下载远程图片:', imageUrl.substring(0, 80) + '...');
    
    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // 确定文件类型
    const contentType = response.headers.get('content-type') || 'image/png';
    const mimeType = contentType.split(';')[0].trim();
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // 保存到output目录
    const result = FileHandler.saveImage(dataUrl, config.OUTPUT_DIR, filename);
    
    // 异步生成缩略图
    if (result.success && result.data?.path) {
      ThumbnailGenerator.generate(result.data.path, 'output').then(thumbResult => {
        if (thumbResult.success) {
          console.log(`[Thumbnail] output: ${result.data.filename}`);
        }
      }).catch(err => console.error('[Thumbnail] 生成失败:', err.message));
    }
    
    console.log('[Download] 远程图片已保存:', result.data?.filename);
    res.json(result);
  } catch (error) {
    console.error('[Download] 下载远程图片失败:', error.message);
    res.status(500).json({ success: false, error: `下载失败: ${error.message}` });
  }
});

// 下载远程视频并保存到本地output目录（后端代理，绕过CORS）
router.post('/download-remote-video', async (req, res) => {
  const { videoUrl, filename } = req.body;
  
  if (!videoUrl) {
    return res.status(400).json({ success: false, error: '缺少视频URL' });
  }
  
  // 验证是否为有效的URL
  if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
    return res.status(400).json({ success: false, error: '无效的URL格式' });
  }
  
  try {
    console.log('[Download Video] 开始下载远程视频:', videoUrl.substring(0, 80) + '...');
    
    // 下载视频
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // 确定文件类型
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const mimeType = contentType.split(';')[0].trim();
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // 保存到output目录
    const result = FileHandler.saveVideo(dataUrl, config.OUTPUT_DIR, filename);
    
    console.log('[Download Video] 远程视频已保存:', result.data?.filename, '大小:', (buffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
    res.json(result);
  } catch (error) {
    console.error('[Download Video] 下载远程视频失败:', error.message);
    res.status(500).json({ success: false, error: `下载失败: ${error.message}` });
  }
});

// 批量生成缩略图（用于历史数据迁移）
// 🔧 单独重建某个图片的缩略图
router.post('/rebuild-thumbnail', async (req, res) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl || !imageUrl.startsWith('/files/')) {
    return res.status(400).json({ success: false, error: '无效的图片URL' });
  }

  try {
    // 解析路径: /files/output/filename.png
    const parts = imageUrl.split('/');
    if (parts.length < 4) {
      return res.status(400).json({ success: false, error: '无效的图片路径格式' });
    }

    const dirName = parts[2]; // output, input, creative_images
    const filename = parts[3];
    
    // 确定源目录
    let sourceDir;
    if (dirName === 'output') sourceDir = config.OUTPUT_DIR;
    else if (dirName === 'input') sourceDir = config.INPUT_DIR;
    else if (dirName === 'creative_images' || dirName === 'creative') sourceDir = config.CREATIVE_IMAGES_DIR;
    else {
      return res.status(400).json({ success: false, error: '不支持的目录' });
    }

    const sourcePath = path.join(sourceDir, filename);
    
    // 检查原图是否存在
    const fs = require('fs');
    if (!fs.existsSync(sourcePath)) {
      return res.json({ success: false, error: '原图不存在' });
    }

    // 生成缩略图
    const normalizedDirName = dirName === 'creative' ? 'creative_images' : dirName;
    const result = await ThumbnailGenerator.generate(sourcePath, normalizedDirName);
    
    if (result.success) {
      console.log(`[Thumbnail] 重建缩略图成功: ${filename}`);
      res.json({ success: true, thumbnailUrl: result.thumbnailUrl });
    } else {
      res.json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('[Thumbnail] 重建失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-thumbnails', async (req, res) => {
  try {
    console.log('[Thumbnail] 开始批量生成缩略图...');
    
    const results = {
      output: await ThumbnailGenerator.generateBatch(config.OUTPUT_DIR, 'output'),
      input: await ThumbnailGenerator.generateBatch(config.INPUT_DIR, 'input'),
      creative: await ThumbnailGenerator.generateBatch(config.CREATIVE_IMAGES_DIR, 'creative_images'),
    };
    
    const totalCount = results.output.count + results.input.count + results.creative.count;
    const totalSkipped = (results.output.skipped || 0) + (results.input.skipped || 0) + (results.creative.skipped || 0);
    
    res.json({
      success: true,
      message: `缩略图生成完成: ${totalCount} 个新生成, ${totalSkipped} 个已跳过`,
      data: results
    });
  } catch (error) {
    console.error('[Thumbnail] 批量生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔧 保存缩略图到thumbnails目录（用于视频首帧缩略图）
router.post('/save-thumbnail', async (req, res) => {
  const { imageData, filename } = req.body;
  
  if (!imageData) {
    return res.status(400).json({ success: false, error: '缺少图片数据' });
  }
  
  try {
    // 确保缩略图目录存在
    const fs = require('fs');
    if (!fs.existsSync(config.THUMBNAILS_DIR)) {
      fs.mkdirSync(config.THUMBNAILS_DIR, { recursive: true });
    }
    
    // 保存到缩略图目录
    const result = FileHandler.saveImage(imageData, config.THUMBNAILS_DIR, filename);
    
    if (result.success && result.data) {
      // 返回正确的URL路径
      result.data.url = `/files/thumbnails/${result.data.filename}`;
      console.log(`[Thumbnail] 视频缩略图已保存: ${result.data.filename}`);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[Thumbnail] 保存失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
