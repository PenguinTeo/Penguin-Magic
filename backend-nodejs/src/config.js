const path = require('path');

// 判断是否在 Electron 打包环境中运行
const IS_ELECTRON = process.env.IS_ELECTRON === 'true';
const USER_DATA_PATH = process.env.USER_DATA_PATH;

// 获取项目根目录 (backend-nodejs的上一级)
const PROJECT_DIR = path.resolve(__dirname, '..', '..');

// 数据存储基础目录：
// - Electron 打包环境：使用用户数据目录 (%APPDATA%/penguin-magic)
// - 开发环境：使用项目目录
const BASE_DIR = IS_ELECTRON && USER_DATA_PATH ? USER_DATA_PATH : PROJECT_DIR;

// 计算 DIST_DIR：
// - Electron 打包环境：dist 在 app.asar 包内
// - 开发环境：在项目根目录的 dist
function getDistDir() {
  if (IS_ELECTRON) {
    // 打包后：__dirname 是 resources/app.asar.unpacked/backend-nodejs/src
    // dist 在 resources/app.asar.unpacked/dist（因为 dist 在 asarUnpack 配置中）
    return path.resolve(__dirname, '..', '..', 'dist');
  }
  return path.join(PROJECT_DIR, 'dist');
}

// 配置项
const config = {
  // 服务器配置
  HOST: process.env.HOST || '127.0.0.1',
  PORT: process.env.PORT || 8765,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // 目录路径（用户数据目录）
  BASE_DIR: BASE_DIR,
  INPUT_DIR: path.join(BASE_DIR, 'input'),
  OUTPUT_DIR: path.join(BASE_DIR, 'output'),
  THUMBNAILS_DIR: path.join(BASE_DIR, 'thumbnails'),
  DATA_DIR: path.join(BASE_DIR, 'data'),
  CREATIVE_IMAGES_DIR: path.join(BASE_DIR, 'creative_images'),
  
  // 静态资源目录
  DIST_DIR: getDistDir(),
  
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
