const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

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
let splashWindow = null;
let backendServer = null;

// 创建启动画面
function createSplashWindow() {
  const iconPath = getIconPath();
  const logoPath = iconPath.replace(/\\/g, '/'); // 路径转换为 URL 格式
  
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载启动画面 HTML
  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          -webkit-app-region: drag;
          border-radius: 16px;
          overflow: hidden;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
          animation: bounce 1s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 14px;
          color: #888;
          margin-bottom: 30px;
        }
        .loader {
          width: 200px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .loader-bar {
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          border-radius: 2px;
          animation: loading 1.5s ease-in-out infinite;
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .status {
          margin-top: 16px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <img class="logo" src="file:///${logoPath}" alt="Logo" onerror="this.outerHTML='🐧'" />
      <div class="title">PenguinMagic</div>
      <div class="subtitle">企鹅工坊</div>
      <div class="loader"><div class="loader-bar"></div></div>
      <div class="status">正在启动服务...</div>
    </body>
    </html>
  `)}`);

  splashWindow.center();
  splashWindow.show();
}

// 关闭启动画面
function closeSplashWindow() {
  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }
}

// 获取图标路径（开发环境和打包环境不同）
function getIconPath() {
  // Windows 使用 .ico，其他平台使用 .png
  const iconExt = process.platform === 'win32' ? 'ico' : 'png';
  
  if (!app.isPackaged) {
    // 开发环境
    return path.join(__dirname, `../resources/icon.${iconExt}`);
  } else {
    // 打包环境：图标在 resources 目录
    return path.join(process.resourcesPath, `icon.${iconExt}`);
  }
}

// 创建主窗口
function createWindow() {
  const iconPath = getIconPath();
  console.log('图标路径:', iconPath);
  
  mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    minWidth: CONFIG.minWidth,
    minHeight: CONFIG.minHeight,
    title: 'PenguinMagic - 企鹅工坊',
    icon: iconPath,
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

// 启动后端服务（直接在主进程中运行，不依赖外部 Node.js）
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 启动后端服务...');

    // 设置环境变量
    process.env.NODE_ENV = 'production';
    process.env.PORT = CONFIG.backendPort.toString();
    process.env.HOST = CONFIG.backendHost;
    process.env.IS_ELECTRON = 'true';
    process.env.USER_DATA_PATH = app.getPath('userData');

    // 计算后端路径
    let backendPath;
    if (CONFIG.isDev) {
      backendPath = path.join(__dirname, '../backend-nodejs/src/server.js');
    } else {
      // 打包后，asar 未打包的文件在 resources/app.asar.unpacked/ 目录
      backendPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend-nodejs', 'src', 'server.js');
    }

    console.log('resourcesPath:', process.resourcesPath);
    console.log('后端路径:', backendPath);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(backendPath)) {
      console.error('❌ 后端文件不存在:', backendPath);
      // 尝试其他可能的路径
      const altPath1 = path.join(app.getAppPath(), 'backend-nodejs', 'src', 'server.js');
      const altPath2 = path.join(process.resourcesPath, 'backend-nodejs', 'src', 'server.js');
      console.log('尝试替代路径1:', altPath1, fs.existsSync(altPath1));
      console.log('尝试替代路径2:', altPath2, fs.existsSync(altPath2));
      
      if (fs.existsSync(altPath1)) {
        backendPath = altPath1;
      } else if (fs.existsSync(altPath2)) {
        backendPath = altPath2;
      } else {
        reject(new Error('找不到后端文件'));
        return;
      }
    }

    try {
      // 直接 require 后端模块（使用 Electron 内置的 Node.js）
      const backendApp = require(backendPath);
      
      // 启动服务器
      backendServer = backendApp.listen(CONFIG.backendPort, CONFIG.backendHost, () => {
        console.log(`✅ 后端服务已启动: http://${CONFIG.backendHost}:${CONFIG.backendPort}`);
        resolve();
      });

      backendServer.on('error', (err) => {
        console.error('❌ 后端服务启动失败:', err);
        reject(err);
      });

    } catch (err) {
      console.error('❌ 加载后端模块失败:', err);
      reject(err);
    }
  });
}

// 停止后端服务
function stopBackendServer() {
  if (backendServer) {
    console.log('🛑 停止后端服务...');
    backendServer.close();
    backendServer = null;
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

  // 生产环境：先显示启动画面
  if (!CONFIG.isDev) {
    createSplashWindow();
    
    try {
      await startBackendServer();
    } catch (err) {
      console.error('❌ 后端服务启动失败:', err);
      closeSplashWindow();
      const { dialog } = require('electron');
      dialog.showErrorBox('启动失败', `后端服务启动失败: ${err.message}`);
      app.quit();
      return;
    }
  }

  // 创建主窗口
  createWindow();
  
  // 关闭启动画面
  closeSplashWindow();

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
