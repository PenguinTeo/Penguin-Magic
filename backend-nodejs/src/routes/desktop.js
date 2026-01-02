const express = require('express');
const config = require('../config');
const JsonStorage = require('../utils/jsonStorage');

const router = express.Router();

// 获取桌面状态
router.get('/', (req, res) => {
  const desktopItems = JsonStorage.load(config.DESKTOP_ITEMS_FILE, []);
  res.json({ success: true, data: desktopItems });
});

// 保存桌面状态
router.post('/', (req, res) => {
  const items = req.body.items || [];
  JsonStorage.save(config.DESKTOP_ITEMS_FILE, items);
  res.json({ success: true, message: '桌面状态已保存' });
});

module.exports = router;
