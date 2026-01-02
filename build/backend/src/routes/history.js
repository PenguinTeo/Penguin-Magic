const express = require('express');
const config = require('../config');
const JsonStorage = require('../utils/jsonStorage');

const router = express.Router();

// 获取历史记录
router.get('/', (req, res) => {
  const history = JsonStorage.load(config.HISTORY_FILE, []);
  res.json({ success: true, data: history });
});

// 保存历史记录
router.post('/', (req, res) => {
  const history = JsonStorage.load(config.HISTORY_FILE, []);
  
  // 生成新ID
  const newId = Math.max(...history.map(h => h.id || 0), 0) + 1;
  const newRecord = {
    ...req.body,
    id: newId,
    timestamp: req.body.timestamp || Date.now()
  };
  
  // 新记录插入到开头
  history.unshift(newRecord);
  
  // 限制历史记录数量（最多保留500条）
  const limitedHistory = history.slice(0, config.MAX_HISTORY_COUNT);
  
  JsonStorage.save(config.HISTORY_FILE, limitedHistory);
  res.json({ success: true, data: newRecord });
});

// 删除单条历史记录
router.delete('/:id', (req, res) => {
  const historyId = parseInt(req.params.id);
  const history = JsonStorage.load(config.HISTORY_FILE, []);
  
  const originalLength = history.length;
  const filteredHistory = history.filter(h => h.id !== historyId);
  
  if (filteredHistory.length < originalLength) {
    JsonStorage.save(config.HISTORY_FILE, filteredHistory);
    res.json({ success: true, message: '删除成功' });
  } else {
    res.status(404).json({ success: false, error: '记录不存在' });
  }
});

// 清空所有历史记录
router.delete('/', (req, res) => {
  JsonStorage.save(config.HISTORY_FILE, []);
  res.json({ success: true, message: '历史记录已清空' });
});

module.exports = router;
