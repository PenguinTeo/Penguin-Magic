const express = require('express');
const config = require('../config');
const JsonStorage = require('../utils/jsonStorage');

const router = express.Router();

// 获取设置
router.get('/', (req, res) => {
  const settings = JsonStorage.load(config.SETTINGS_FILE, { theme: 'dark' });
  res.json({ success: true, data: settings });
});

// 保存设置
router.post('/', (req, res) => {
  JsonStorage.save(config.SETTINGS_FILE, req.body);
  res.json({ success: true, data: req.body });
});

// =====================
// RH 应用创意包 API
// =====================

// 获取 RH 应用列表
router.get('/rh-apps', (req, res) => {
  const apps = JsonStorage.load(config.RH_APPS_FILE, []);
  res.json({ success: true, data: apps });
});

// 添加 RH 应用
router.post('/rh-apps', (req, res) => {
  const { webappId, title, coverUrl } = req.body;
  
  if (!webappId || !title) {
    return res.json({ success: false, error: '缺少必要参数' });
  }
  
  const apps = JsonStorage.load(config.RH_APPS_FILE, []);
  
  // 检查是否已存在
  const exists = apps.find(app => app.webappId === webappId);
  if (exists) {
    return res.json({ success: false, error: '应用已存在' });
  }
  
  const newApp = {
    id: `rh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    webappId,
    title,
    coverUrl: coverUrl || null,
    addedAt: Date.now()
  };
  
  apps.push(newApp);
  JsonStorage.save(config.RH_APPS_FILE, apps);
  
  res.json({ success: true, data: newApp });
});

// 删除 RH 应用
router.delete('/rh-apps/:id', (req, res) => {
  const { id } = req.params;
  
  let apps = JsonStorage.load(config.RH_APPS_FILE, []);
  const originalLength = apps.length;
  
  apps = apps.filter(app => app.id !== id);
  
  if (apps.length === originalLength) {
    return res.json({ success: false, error: '应用不存在' });
  }
  
  JsonStorage.save(config.RH_APPS_FILE, apps);
  res.json({ success: true });
});

module.exports = router;
