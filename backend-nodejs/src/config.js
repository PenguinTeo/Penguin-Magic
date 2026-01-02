const path = require('path');
const fs = require('fs');
const os = require('os');

// 检测运行环境
// 1. pkg 打包的 exe
const isPkg = typeof process.pkg !== 'undefined';
// 2. Electron 打包环境（通过环境变量或路径判断）
const isElectronProd = process.env.NODE_ENV === 'production' && !isPkg;

console.log('[Config] Environment:', { isPkg, isElectronProd, NODE_ENV: process.env.NODE_ENV });

// 获取用户数据目录
const getUserDataDir = () => {
  // 优先使用用户数据目录，确保数据持久化
  const platform = process.platform;
  let userDataDir;
  
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    userDataDir = path.join(appData, 'penguin-magic');
  } else if (platform === 'darwin') {
    userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'penguin-magic');
  } else {
    userDataDir = path.join(os.homedir(), '.config', 'penguin-magic');
  }
  
  // 生产环境（Electron 或 pkg）使用用户数据目录
  if (isPkg || isElectronProd) {
    console.log('[Config] Using user data directory:', userDataDir);
    return userDataDir;
  }
  
  // 开发环境：使用项目根目录
  const devDir = path.resolve(__dirname, '..', '..');
  console.log('[Config] Using development directory:', devDir);
  return devDir;
};

const DATA_BASE_DIR = getUserDataDir();

// 确保目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[Config] Created directory:', dir);
  }
};

// 获取前端静态资源目录
const getDistDir = () => {
  if (isPkg) {
    // pkg 打包：exe 同级目录
    return path.dirname(process.execPath);
  }
  if (isElectronProd) {
    // Electron 生产环境：相对于后端脚本的位置
    // 后端在 resources/backend/src/server.js
    // 前端在 resources/app/dist/ 或 app.asar/dist/
    // 但实际上 Electron 会直接加载 file:// 协议的 HTML
    // 这里返回一个不存在的路径，让前端路由回退返回 404
    return path.join(__dirname, '..', '..', '..', 'dist');
  }
  // 开发环境
  return path.join(path.resolve(__dirname, '..', '..'), 'dist');
};

// 配置项
const config = {
  // 服务器配置
  HOST: process.env.HOST || 'localhost',
  PORT: parseInt(process.env.PORT, 10) || 8766,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // 环境标识
  IS_PKG: isPkg,
  IS_ELECTRON_PROD: isElectronProd,
  
  // 目录路径 - 使用用户数据目录
  BASE_DIR: DATA_BASE_DIR,
  INPUT_DIR: path.join(DATA_BASE_DIR, 'input'),
  OUTPUT_DIR: path.join(DATA_BASE_DIR, 'output'),
  THUMBNAILS_DIR: path.join(DATA_BASE_DIR, 'thumbnails'),
  DATA_DIR: path.join(DATA_BASE_DIR, 'data'),
  CREATIVE_IMAGES_DIR: path.join(DATA_BASE_DIR, 'creative_images'),
  DIST_DIR: getDistDir(),
  
  // 缩略图配置
  THUMBNAIL_SIZE: 160, // 缩略图大小（像素）
  THUMBNAIL_QUALITY: 80, // 缩略图质量（JPEG）
  
  // 数据文件路径
  CREATIVE_IDEAS_FILE: path.join(DATA_BASE_DIR, 'data', 'creative_ideas.json'),
  HISTORY_FILE: path.join(DATA_BASE_DIR, 'data', 'history.json'),
  SETTINGS_FILE: path.join(DATA_BASE_DIR, 'data', 'settings.json'),
  DESKTOP_ITEMS_FILE: path.join(DATA_BASE_DIR, 'data', 'desktop_items.json'),
  
  // 业务配置
  MAX_HISTORY_COUNT: 500,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // 辅助方法
  ensureDirectories: () => {
    ensureDir(config.INPUT_DIR);
    ensureDir(config.OUTPUT_DIR);
    ensureDir(config.THUMBNAILS_DIR);
    ensureDir(config.DATA_DIR);
    ensureDir(config.CREATIVE_IMAGES_DIR);
    console.log('[Config] 数据目录:', DATA_BASE_DIR);
  }
};

module.exports = config;
