import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import net from 'net';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let backendProcess = null;
const isDev = process.env.NODE_ENV === 'development';

// 后端端口配置
const BACKEND_PORT = 8766;
const MAX_RETRY_COUNT = 30; // 最多重试30次
const RETRY_INTERVAL = 500; // 每次重试间隔500ms

// 日志函数
function log(message, ...args) {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`[${timestamp}] ${message}`, ...args);
}

function logError(message, ...args) {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.error(`[${timestamp}] ERROR: ${message}`, ...args);
}

// 获取后端路径配置
function getBackendPath() {
  if (isDev) {
    return {
      nodeExe: 'node',
      serverScript: path.join(__dirname, '../backend-nodejs/src/server.js'),
      cwd: path.join(__dirname, '../backend-nodejs'),
    };
  }
  
  // 生产环境：使用内置的 Node.js 运行后端源码
  const nodejsPath = path.join(process.resourcesPath, 'nodejs', 'node.exe');
  const serverScript = path.join(process.resourcesPath, 'backend', 'src', 'server.js');
  const cwd = path.join(process.resourcesPath, 'backend');
  
  log('Backend paths:');
  log('  Node.js:', nodejsPath, '- exists:', fs.existsSync(nodejsPath));
  log('  Server:', serverScript, '- exists:', fs.existsSync(serverScript));
  log('  CWD:', cwd, '- exists:', fs.existsSync(cwd));
  
  return {
    nodeExe: nodejsPath,
    serverScript: serverScript,
    cwd: cwd,
  };
}

// 检查端口是否被占用
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

// 检查后端服务是否真正可用（HTTP 健康检查）
function checkBackendHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/status',
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.success === true);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 等待后端服务就绪
async function waitForBackend(maxRetries = MAX_RETRY_COUNT) {
  log('Waiting for backend to be ready...');
  
  for (let i = 0; i < maxRetries; i++) {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      log(`Backend is ready after ${i + 1} attempts`);
      return true;
    }
    
    if (i % 5 === 0) {
      log(`Still waiting for backend... (attempt ${i + 1}/${maxRetries})`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
  }
  
  logError(`Backend failed to respond after ${maxRetries} attempts`);
  return false;
}

// 启动后端服务
async function startBackend() {
  try {
    // 先检查端口是否已被占用
    const portInUse = await isPortInUse(BACKEND_PORT);
    if (portInUse) {
      log(`Port ${BACKEND_PORT} already in use, checking if it's our backend...`);
      const isHealthy = await checkBackendHealth();
      if (isHealthy) {
        log('Existing backend is healthy, reusing it');
        return true;
      }
      logError('Port is in use but backend is not responding correctly');
      return false;
    }

    const backend = getBackendPath();
    
    // 检查必要文件是否存在
    if (!fs.existsSync(backend.nodeExe)) {
      logError('Node.js executable not found:', backend.nodeExe);
      return false;
    }
    
    if (!fs.existsSync(backend.serverScript)) {
      logError('Server script not found:', backend.serverScript);
      return false;
    }

    log('Starting backend process...');
    log('Command:', backend.nodeExe, backend.serverScript);
    
    // 启动后端进程
    backendProcess = spawn(backend.nodeExe, [backend.serverScript], {
      cwd: backend.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      detached: false,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(BACKEND_PORT),
      }
    });

    // 监听后端输出
    backendProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log('Backend:', output);
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        logError('Backend stderr:', output);
      }
    });

    backendProcess.on('error', (err) => {
      logError('Backend process error:', err.message);
    });

    backendProcess.on('exit', (code, signal) => {
      log(`Backend process exited with code ${code}, signal ${signal}`);
      backendProcess = null;
    });

    // 等待后端服务就绪
    const isReady = await waitForBackend();
    
    if (!isReady) {
      logError('Backend failed to start properly');
      // 尝试终止进程
      if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
      }
      return false;
    }

    log('Backend started successfully!');
    return true;
  } catch (error) {
    logError('Failed to start backend:', error.message);
    return false;
  }
}

// 停止后端服务
function stopBackend() {
  if (backendProcess) {
    log('Stopping backend process...');
    try {
      // Windows 上使用 taskkill 确保子进程也被终止
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'], {
          windowsHide: true,
        });
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (err) {
      logError('Error stopping backend:', err.message);
    }
    backendProcess = null;
  }
}

// 创建主窗口
function createWindow() {
  // 查找图标文件
  const iconPaths = [
    path.join(__dirname, '../build/resources/icon.png'),
    path.join(__dirname, '../assets/icon.png'),
    path.join(__dirname, '../public/favicon.svg'),
  ];
  
  let iconPath = undefined;
  for (const p of iconPaths) {
    if (fs.existsSync(p)) {
      iconPath = p;
      break;
    }
  }
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: iconPath,
    show: false, // 先隐藏，等加载完成后再显示
  });

  const startUrl = isDev
    ? 'http://localhost:5176'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl);

  // 页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 开发环境打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logError('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('Page loaded successfully');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于企鹅工坊',
              message: '企鹅工坊',
              detail: `版本: ${app.getVersion()}\n\n一个创意工具应用`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 显示错误对话框
async function showErrorDialog(title, message) {
  await dialog.showMessageBox({
    type: 'error',
    title: title,
    message: message,
    buttons: ['确定'],
  });
}

// App 事件处理
app.on('ready', async () => {
  log('App ready, starting backend...');
  
  const backendStarted = await startBackend();
  
  if (!backendStarted) {
    await showErrorDialog(
      '启动失败',
      '后端服务启动失败，请检查是否有其他程序占用端口 8766，或者尝试重新启动应用。'
    );
    app.quit();
    return;
  }
  
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 应用退出时清理后端进程
app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

// IPC 处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('get-backend-status', async () => {
  const isHealthy = await checkBackendHealth();
  return { healthy: isHealthy, port: BACKEND_PORT };
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
});
