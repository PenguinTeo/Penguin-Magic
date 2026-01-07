const express = require('express');
const config = require('../config');
const JsonStorage = require('../utils/jsonStorage');
const FileHandler = require('../utils/fileHandler');
const path = require('path');

const router = express.Router();

// 画布图片存储目录
const CANVAS_IMAGES_DIR = path.join(config.BASE_DIR, 'canvas_images');

// 确保目录存在
FileHandler.ensureDir(CANVAS_IMAGES_DIR);

// 初始化画布数据文件
JsonStorage.init(config.CANVAS_FILE, []);

/**
 * 获取画布列表（不含详细节点数据，只返回元信息）
 */
router.get('/', (req, res) => {
  try {
    const canvasList = JsonStorage.load(config.CANVAS_FILE, []);
    // 返回列表时不包含nodes和connections详情，减少传输量
    const listWithoutDetails = canvasList.map(canvas => ({
      id: canvas.id,
      name: canvas.name,
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
      nodeCount: canvas.nodes?.length || 0,
      thumbnail: canvas.thumbnail || null, // 缩略图URL
    }));
    res.json({ success: true, data: listWithoutDetails });
  } catch (e) {
    console.error('[Canvas] 获取列表失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 获取单个画布详情
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const canvasList = JsonStorage.load(config.CANVAS_FILE, []);
    const canvas = canvasList.find(c => c.id === id);
    
    if (!canvas) {
      return res.status(404).json({ success: false, error: '画布不存在' });
    }
    
    res.json({ success: true, data: canvas });
  } catch (e) {
    console.error('[Canvas] 获取详情失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 创建新画布
 */
router.post('/', (req, res) => {
  try {
    const { name, nodes = [], connections = [] } = req.body;
    const canvasList = JsonStorage.load(config.CANVAS_FILE, []);
    
    const now = Date.now();
    const newCanvas = {
      id: `canvas-${now}-${Math.random().toString(36).substring(2, 8)}`,
      name: name || `画布 ${canvasList.length + 1}`,
      nodes: nodes,
      connections: connections,
      createdAt: now,
      updatedAt: now,
      thumbnail: null,
    };
    
    canvasList.push(newCanvas);
    JsonStorage.save(config.CANVAS_FILE, canvasList);
    
    res.json({ success: true, data: newCanvas });
  } catch (e) {
    console.error('[Canvas] 创建失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 更新画布（自动保存）
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, nodes, connections, thumbnail } = req.body;
    const canvasList = JsonStorage.load(config.CANVAS_FILE, []);
    
    const index = canvasList.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: '画布不存在' });
    }
    
    // 更新字段
    if (name !== undefined) canvasList[index].name = name;
    if (nodes !== undefined) canvasList[index].nodes = nodes;
    if (connections !== undefined) canvasList[index].connections = connections;
    if (thumbnail !== undefined) canvasList[index].thumbnail = thumbnail;
    canvasList[index].updatedAt = Date.now();
    
    JsonStorage.save(config.CANVAS_FILE, canvasList);
    
    res.json({ success: true, data: canvasList[index] });
  } catch (e) {
    console.error('[Canvas] 更新失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 删除画布
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const canvasList = JsonStorage.load(config.CANVAS_FILE, []);
    
    const index = canvasList.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: '画布不存在' });
    }
    
    // 删除画布关联的图片文件（可选，暂不实现）
    // const canvas = canvasList[index];
    // canvas.nodes?.forEach(node => { ... });
    
    canvasList.splice(index, 1);
    JsonStorage.save(config.CANVAS_FILE, canvasList);
    
    res.json({ success: true, message: '画布已删除' });
  } catch (e) {
    console.error('[Canvas] 删除失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 保存画布节点图片到本地文件
 * 将 base64 图片保存到 canvas_images 目录，返回文件URL
 */
router.post('/save-image', (req, res) => {
  try {
    const { imageData, canvasId, nodeId } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }
    
    // 生成文件名
    const timestamp = Date.now();
    const filename = `${canvasId || 'temp'}_${nodeId || timestamp}_${timestamp}.png`;
    
    const result = FileHandler.saveImage(imageData, CANVAS_IMAGES_DIR, filename);
    
    if (result.success) {
      // 返回相对URL
      result.data.url = `/files/canvas_images/${result.data.filename}`;
    }
    
    res.json(result);
  } catch (e) {
    console.error('[Canvas] 保存图片失败:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
