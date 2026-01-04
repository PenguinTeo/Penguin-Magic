const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// 配置参数
const CONFIG = {
  windowWidth: 1280,
  windowHeight: 800,
  minWidth: 1024,
  minHeight: 768,
  backendPort: 8765,
  backendHost: '127.0.0.1',
  isDev: !app.isPackaged
};

let mainWindow = null;
let backendProcess = null;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    minWidth: CONFIG.minWidth,
    minHeight: CONFIG.minHeight,
    title: 'PenguinMagic - 企鹅工坊',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false // 先隐藏，等加载完成后显示
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载应用
  if (CONFIG.isDev) {
    // 开发环境：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5176');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载本地后端服务
    mainWindow.loadURL(`http://${CONFIG.backendHost}:${CONFIG.backendPort}`);
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 启动后端服务
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 启动后端服务...');

    const backendPath = CONFIG.isDev
      ? path.join(__dirname, '../backend-nodejs/src/server.js')
      : path.join(process.resourcesPath, 'app.asar/backend-nodejs/src/server.js');

    console.log('后端路径:', backendPath);

    // 设置环境变量
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: CONFIG.backendPort.toString(),
      HOST: CONFIG.backendHost,
      // Electron 环境标识
      IS_ELECTRON: 'true',
      // 用户数据目录
      USER_DATA_PATH: app.getPath('userData')
    };

    // 启动后端进程
    backendProcess = spawn('node', [backendPath], {
      env,
      stdio: 'inherit' // 继承标准输入输出，可以看到后端日志
    });

    backendProcess.on('error', (err) => {
      console.error('❌ 后端服务启动失败:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ 后端服务异常退出，代码: ${code}`);
      }
    });

    // 等待后端服务就绪
    const maxRetries = 30;
    let retries = 0;

    const checkServer = setInterval(() => {
      const http = require('http');
      const options = {
        host: CONFIG.backendHost,
        port: CONFIG.backendPort,
        path: '/api/status',
        timeout: 1000
      };

      const req = http.get(options, (res) => {
        if (res.statusCode === 200) {
          clearInterval(checkServer);
          console.log('✅ 后端服务就绪');
          resolve();
        }
      });

      req.on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(checkServer);
          reject(new Error('后端服务启动超时'));
        }
      });

      req.end();
    }, 1000);
  });
}

// 停止后端服务
function stopBackendServer() {
  if (backendProcess) {
    console.log('🛑 停止后端服务...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 PenguinMagic',
              message: 'PenguinMagic - 企鹅工坊',
              detail: `版本: ${app.getVersion()}\n基于 Electron 和 React 构建的 AI 图像管理应用`,
              buttons: ['确定']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用启动
app.whenReady().then(async () => {
  console.log('🐧 PenguinMagic 启动中...');
  console.log('用户数据目录:', app.getPath('userData'));
  console.log('应用路径:', app.getAppPath());
  console.log('开发模式:', CONFIG.isDev);

  // 创建菜单
  createMenu();

  // 在生产环境启动后端服务
  if (!CONFIG.isDev) {
    try {
      await startBackendServer();
    } catch (err) {
      console.error('❌ 后端服务启动失败:', err);
      app.quit();
      return;
    }
  }

  // 创建窗口
  createWindow();

  // macOS 特定：点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  stopBackendServer();
});

// 应用退出
app.on('quit', () => {
  console.log('👋 PenguinMagic 已关闭');
});

// 全局异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
