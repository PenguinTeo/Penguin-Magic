/**
 * 🎨 FlowCanvas 发布上传工具
 * 用于将构建产物上传到服务器
 * 
 * 使用方法:
 *   1. 复制 config.example.json 为 config.json 并填入服务器信息
 *   2. 运行 npm run upload 或 npm run release
 */

const path = require('path');
const fs = require('fs');

// 路径配置
const UPLOADER_DIR = __dirname;
const PROJECT_ROOT = path.join(UPLOADER_DIR, '..');
const RELEASE_DIR = path.join(PROJECT_ROOT, 'release');
const CONFIG_PATH = path.join(UPLOADER_DIR, 'config.json');
const CONFIG_EXAMPLE_PATH = path.join(UPLOADER_DIR, 'config.example.json');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

// 获取当前版本号
function getCurrentVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    return pkg.version;
  } catch (err) {
    logError(`无法读取 package.json: ${err.message}`);
    process.exit(1);
  }
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = '') {
  console.log(`${color}${msg}${colors.reset}`);
}

function logSuccess(msg) { log(`✅ ${msg}`, colors.green); }
function logError(msg) { log(`❌ ${msg}`, colors.red); }
function logInfo(msg) { log(`📌 ${msg}`, colors.cyan); }
function logWarn(msg) { log(`⚠️  ${msg}`, colors.yellow); }

// 读取配置
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    logError('配置文件不存在: config.json');
    logInfo('请复制 config.example.json 为 config.json 并填入服务器信息');
    logInfo(`示例命令: copy "${CONFIG_EXAMPLE_PATH}" "${CONFIG_PATH}"`);
    process.exit(1);
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return config;
  } catch (err) {
    logError(`配置文件解析失败: ${err.message}`);
    process.exit(1);
  }
}

// 检测当前平台
function detectPlatform() {
  const platform = process.platform;
  // 也支持通过命令行参数强制指定平台
  const args = process.argv.slice(2);
  if (args.includes('--mac')) return 'darwin';
  if (args.includes('--win')) return 'win32';
  return platform;
}

// 获取需要上传的文件（只匹配当前版本）
function getFilesToUpload(config, version) {
  const files = [];
  const platform = detectPlatform();

  // 读取 release 目录
  if (!fs.existsSync(RELEASE_DIR)) {
    logError(`release 目录不存在: ${RELEASE_DIR}`);
    logInfo('请先运行: npm run package 或 npm run pack:mac');
    process.exit(1);
  }

  const allFiles = fs.readdirSync(RELEASE_DIR);

  // 根据平台选择要上传的文件
  let targetFiles = [];
  
  if (platform === 'darwin') {
    // Mac 平台文件 - 使用正则匹配支持不同架构 (arm64/x64)
    logInfo('检测到 Mac 平台，上传 Mac 版本文件');
    
    // 必须上传: yml
    if (allFiles.includes('latest-mac.yml')) {
      files.push('latest-mac.yml');
    }
    
    // 匹配 dmg 和 dmg.blockmap (支持 arm64/x64 架构)
    const dmgPattern = new RegExp(`^FlowCanvas-${version}(-arm64|-x64)?\\.dmg$`);
    const blockmapPattern = new RegExp(`^FlowCanvas-${version}(-arm64|-x64)?\\.dmg\\.blockmap$`);
    
    for (const file of allFiles) {
      if (dmgPattern.test(file) || blockmapPattern.test(file)) {
        const filePath = path.join(RELEASE_DIR, file);
        if (fs.statSync(filePath).isFile()) {
          files.push(file);
        }
      }
    }
    
    return files;
  } else {
    // Windows 平台文件
    logInfo('检测到 Windows 平台，上传 Windows 版本文件');
    targetFiles = [
      'latest.yml',
      `FlowCanvas Setup ${version}.exe`,
      `FlowCanvas Setup ${version}.exe.blockmap`
    ];
  }

  for (const target of targetFiles) {
    if (allFiles.includes(target)) {
      const filePath = path.join(RELEASE_DIR, target);
      if (fs.statSync(filePath).isFile()) {
        files.push(target);
      }
    }
  }

  return files;
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// SFTP 上传
async function uploadViaSFTP(files, config) {
  let Client;
  try {
    Client = require('ssh2-sftp-client');
  } catch (e) {
    logError('缺少依赖: ssh2-sftp-client');
    logInfo('请运行: npm install ssh2-sftp-client --save-dev');
    process.exit(1);
  }

  const sftp = new Client();
  const cfg = config.sftp;

  log(`\n🔗 连接服务器: ${cfg.host}:${cfg.port || 22}`, colors.blue);

  try {
    const connectOptions = {
      host: cfg.host,
      port: cfg.port || 22,
      username: cfg.username
    };

    // 优先使用私钥认证
    if (cfg.privateKey && fs.existsSync(cfg.privateKey)) {
      connectOptions.privateKey = fs.readFileSync(cfg.privateKey);
      logInfo('使用私钥认证');
    } else if (cfg.password) {
      connectOptions.password = cfg.password;
      logInfo('使用密码认证');
    } else {
      logError('请在配置中提供 password 或 privateKey');
      process.exit(1);
    }

    await sftp.connect(connectOptions);
    logSuccess('连接成功\n');

    // 确保远程目录存在
    const remoteDir = cfg.remotePath.endsWith('/') ? cfg.remotePath : cfg.remotePath + '/';
    try {
      await sftp.mkdir(remoteDir, true);
    } catch (e) {
      // 目录可能已存在，忽略错误
    }

    // 上传文件
    let uploadedCount = 0;
    for (const file of files) {
      const localPath = path.join(RELEASE_DIR, file);
      const remotePath = remoteDir + file;
      const fileSize = formatSize(fs.statSync(localPath).size);

      log(`📤 上传: ${file} (${fileSize})`, colors.cyan);
      
      const startTime = Date.now();
      await sftp.put(localPath, remotePath);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      logSuccess(`完成 → ${remotePath} (${duration}s)`);
      uploadedCount++;
    }

    await sftp.end();
    return uploadedCount;

  } catch (err) {
    logError(`SFTP 错误: ${err.message}`);
    try { await sftp.end(); } catch (e) {}
    return 0;
  }
}

// FTP 上传
async function uploadViaFTP(files, config) {
  let ftp;
  try {
    ftp = require('basic-ftp');
  } catch (e) {
    logError('缺少依赖: basic-ftp');
    logInfo('请运行: npm install basic-ftp --save-dev');
    process.exit(1);
  }

  const client = new ftp.Client();
  const cfg = config.ftp;

  log(`\n🔗 连接服务器: ${cfg.host}:${cfg.port || 21}`, colors.blue);

  try {
    await client.access({
      host: cfg.host,
      port: cfg.port || 21,
      user: cfg.username,
      password: cfg.password,
      secure: cfg.secure || false
    });

    logSuccess('连接成功\n');

    // 确保远程目录存在
    const remoteDir = cfg.remotePath.endsWith('/') ? cfg.remotePath : cfg.remotePath + '/';
    await client.ensureDir(remoteDir);

    // 上传文件
    let uploadedCount = 0;
    for (const file of files) {
      const localPath = path.join(RELEASE_DIR, file);
      const remotePath = remoteDir + file;
      const fileSize = formatSize(fs.statSync(localPath).size);

      log(`📤 上传: ${file} (${fileSize})`, colors.cyan);
      
      const startTime = Date.now();
      await client.uploadFrom(localPath, remotePath);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      logSuccess(`完成 (${duration}s)`);
      uploadedCount++;
    }

    client.close();
    return uploadedCount;

  } catch (err) {
    logError(`FTP 错误: ${err.message}`);
    client.close();
    return 0;
  }
}

// 主函数
async function main() {
  console.log('');
  log('═══════════════════════════════════════════════════', colors.bright);
  log('      🎨 FlowCanvas 发布上传工具', colors.bright + colors.cyan);
  log('═══════════════════════════════════════════════════', colors.bright);

  // 加载配置
  const config = loadConfig();

  // 获取当前版本
  const version = getCurrentVersion();
  logInfo(`当前版本: ${version}`);

  // 获取文件列表（只匹配当前版本）
  const files = getFilesToUpload(config, version);
  if (files.length === 0) {
    logError('没有找到需要上传的文件');
    logInfo(`请确保 release 目录中存在版本 ${version} 的文件`);
    process.exit(1);
  }

  log(`\n📁 找到 ${files.length} 个文件 (版本 ${version}):`, colors.blue);
  files.forEach(f => {
    const size = formatSize(fs.statSync(path.join(RELEASE_DIR, f)).size);
    console.log(`   - ${f} (${size})`);
  });

  // 根据配置选择上传方式
  const method = (config.method || 'sftp').toLowerCase();
  log(`\n📡 使用 ${method.toUpperCase()} 方式上传...`, colors.blue);

  let uploadedCount = 0;

  if (method === 'sftp') {
    uploadedCount = await uploadViaSFTP(files, config);
  } else if (method === 'ftp') {
    uploadedCount = await uploadViaFTP(files, config);
  } else {
    logError(`不支持的上传方式: ${method}`);
    logInfo('支持的方式: sftp, ftp');
    process.exit(1);
  }

  // 结果
  console.log('');
  log('═══════════════════════════════════════════════════', colors.bright);
  if (uploadedCount === files.length) {
    logSuccess(`上传完成！成功上传 ${uploadedCount} 个文件`);
    log('🎉 新版本已发布到服务器', colors.green);
  } else if (uploadedCount > 0) {
    logWarn(`部分上传完成: ${uploadedCount}/${files.length} 个文件`);
  } else {
    logError('上传失败，请检查配置和网络');
    process.exit(1);
  }
  log('═══════════════════════════════════════════════════', colors.bright);
  console.log('');
}

// 运行
main().catch(err => {
  logError(`未知错误: ${err.message}`);
  process.exit(1);
});
