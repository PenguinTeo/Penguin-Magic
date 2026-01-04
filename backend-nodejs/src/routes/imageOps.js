const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

const router = express.Router();

// 图片合并
router.post('/merge', async (req, res) => {
  try {
    const { imagePaths, layout, gridColumns = 2, resizeStrategy = 'keep', spacing = 0, backgroundColor = '#FFFFFF' } = req.body;
    
    if (!imagePaths || imagePaths.length < 2) {
      return res.json({ success: false, error: '至少需要2张图片进行合并' });
    }
    
    // 验证图片路径并转换为绝对路径
    const validPaths = [];
    for (const imgPath of imagePaths) {
      // 处理不同格式的路径
      let fullPath;
      if (imgPath.startsWith('/api/')) {
        fullPath = path.join(config.BASE_DIR, imgPath.replace('/api/', ''));
      } else if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
        // 跳过网络图片
        continue;
      } else {
        fullPath = path.join(config.BASE_DIR, imgPath);
      }
      
      try {
        await fs.access(fullPath);
        validPaths.push(fullPath);
      } catch (e) {
        console.error(`图片不存在: ${imgPath}`);
      }
    }
    
    if (validPaths.length < 2) {
      return res.json({ success: false, error: '可用图片不足2张' });
    }
    
    // 加载所有图片并获取尺寸
    const images = await Promise.all(
      validPaths.map(async p => {
        const img = sharp(p);
        const metadata = await img.metadata();
        return { path: p, image: img, width: metadata.width, height: metadata.height };
      })
    );
    
    let canvasWidth, canvasHeight;
    let positions = [];
    
    if (layout === 'horizontal') {
      // 左右合并
      const maxHeight = Math.max(...images.map(i => i.height));
      canvasWidth = images.reduce((sum, i) => sum + i.width, 0) + spacing * (images.length - 1);
      canvasHeight = maxHeight;
      
      let offsetX = 0;
      images.forEach(img => {
        positions.push({
          input: img.path,
          top: Math.floor((maxHeight - img.height) / 2),
          left: offsetX,
        });
        offsetX += img.width + spacing;
      });
      
    } else if (layout === 'vertical') {
      // 上下合并
      const maxWidth = Math.max(...images.map(i => i.width));
      canvasWidth = maxWidth;
      canvasHeight = images.reduce((sum, i) => sum + i.height, 0) + spacing * (images.length - 1);
      
      let offsetY = 0;
      images.forEach(img => {
        positions.push({
          input: img.path,
          top: offsetY,
          left: Math.floor((maxWidth - img.width) / 2),
        });
        offsetY += img.height + spacing;
      });
      
    } else if (layout === 'grid') {
      // 网格布局
      const cols = gridColumns;
      const rows = Math.ceil(images.length / cols);
      
      const maxWidth = Math.max(...images.map(i => i.width));
      const maxHeight = Math.max(...images.map(i => i.height));
      
      canvasWidth = cols * maxWidth + spacing * (cols - 1);
      canvasHeight = rows * maxHeight + spacing * (rows - 1);
      
      images.forEach((img, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positions.push({
          input: img.path,
          top: row * (maxHeight + spacing) + Math.floor((maxHeight - img.height) / 2),
          left: col * (maxWidth + spacing) + Math.floor((maxWidth - img.width) / 2),
        });
      });
    }
    
    // 创建画布并合成
    const timestamp = Date.now();
    const outputFilename = `merged_${timestamp}.png`;
    const outputPath = path.join(config.OUTPUT_DIR, outputFilename);
    
    await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: backgroundColor,
      }
    })
    .composite(positions)
    .png()
    .toFile(outputPath);
    
    res.json({
      success: true,
      data: {
        imageUrl: `/api/output/${outputFilename}`,
        width: canvasWidth,
        height: canvasHeight,
      }
    });
    
  } catch (error) {
    console.error('图片合并失败:', error);
    res.json({ success: false, error: error.message });
  }
});

// 图片裁切
router.post('/crop', async (req, res) => {
  try {
    const { imagePath, cropRegion } = req.body;
    const { left, top, width, height } = cropRegion;
    
    // 处理路径
    let fullPath;
    if (imagePath.startsWith('/api/')) {
      fullPath = path.join(config.BASE_DIR, imagePath.replace('/api/', ''));
    } else {
      fullPath = path.join(config.BASE_DIR, imagePath);
    }
    
    await fs.access(fullPath);
    
    const timestamp = Date.now();
    const outputFilename = `cropped_${timestamp}.png`;
    const outputPath = path.join(config.OUTPUT_DIR, outputFilename);
    
    await sharp(fullPath)
      .extract({ left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) })
      .toFile(outputPath);
    
    res.json({
      success: true,
      data: {
        imageUrl: `/api/output/${outputFilename}`,
        width: Math.round(width),
        height: Math.round(height),
      }
    });
    
  } catch (error) {
    console.error('图片裁切失败:', error);
    res.json({ success: false, error: error.message });
  }
});

// 图片缩放
router.post('/resize', async (req, res) => {
  try {
    const { imagePath, width, height, fit = 'inside', maintainAspectRatio = true } = req.body;
    
    // 处理路径
    let fullPath;
    if (imagePath.startsWith('/api/')) {
      fullPath = path.join(config.BASE_DIR, imagePath.replace('/api/', ''));
    } else {
      fullPath = path.join(config.BASE_DIR, imagePath);
    }
    
    await fs.access(fullPath);
    
    const timestamp = Date.now();
    const outputFilename = `resized_${timestamp}.png`;
    const outputPath = path.join(config.OUTPUT_DIR, outputFilename);
    
    const resizeOptions = {};
    if (width) resizeOptions.width = Math.round(width);
    if (height) resizeOptions.height = Math.round(height);
    
    if (maintainAspectRatio) {
      resizeOptions.fit = fit;
    } else {
      resizeOptions.fit = 'fill';
    }
    
    const result = await sharp(fullPath)
      .resize(resizeOptions)
      .toFile(outputPath);
    
    res.json({
      success: true,
      data: {
        imageUrl: `/api/output/${outputFilename}`,
        width: result.width,
        height: result.height,
      }
    });
    
  } catch (error) {
    console.error('图片缩放失败:', error);
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
