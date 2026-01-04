const path = require('path');

// 判断是否在 Electron 环境中运行
const isElectron = process.env.IS_ELECTRON === 'true';
const userDataPath = process.env.USER_DATA_PATH;

// 获取项目根目录
let BASE_DIR;
if (isElectron && userDataPath) {
  // Electron 环境：使用用户数据目录
  BASE_DIR = userDataPath;
  console.log('[Config] Electron 环境，使用用户数据目录:', BASE_DIR);
} else {
  // 开发环境：使用项目根目录 (backend-nodejs的上一级)
  BASE_DIR = path.resolve(__dirname, '..', '..');
  console.log('[Config] 开发环境，使用项目根目录:', BASE_DIR);
}

// 配置项
const config = {
  // 服务器配置
  HOST: process.env.HOST || '127.0.0.1',
  PORT: process.env.PORT || 8765,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // 目录路径
  BASE_DIR: BASE_DIR,
  INPUT_DIR: path.join(BASE_DIR, 'input'),
  OUTPUT_DIR: path.join(BASE_DIR, 'output'),
  THUMBNAILS_DIR: path.join(BASE_DIR, 'thumbnails'),
  DATA_DIR: path.join(BASE_DIR, 'data'),
  CREATIVE_IMAGES_DIR: path.join(BASE_DIR, 'creative_images'),
  DIST_DIR: path.join(BASE_DIR, 'dist'),
  
  // 缩略图配置
  THUMBNAIL_SIZE: 160, // 缩略图大小（像素）
  THUMBNAIL_QUALITY: 80, // 缩略图质量（JPEG）
  
  // 数据文件路径
  CREATIVE_IDEAS_FILE: path.join(BASE_DIR, 'data', 'creative_ideas.json'),
  HISTORY_FILE: path.join(BASE_DIR, 'data', 'history.json'),
  SETTINGS_FILE: path.join(BASE_DIR, 'data', 'settings.json'),
  DESKTOP_ITEMS_FILE: path.join(BASE_DIR, 'data', 'desktop_items.json'),
  
  // 业务配置
  MAX_HISTORY_COUNT: 500,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

module.exports = config;
