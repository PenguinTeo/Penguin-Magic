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

module.exports = router;
