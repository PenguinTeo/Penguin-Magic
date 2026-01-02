import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
const isDev = process.env.NODE_ENV === 'development';

// 获取后端可执行文件路径
function getBackendPath(): string {
  if (isDev) {
    return path.join(__dirname, '../backend-nodejs/src/server.js');
  }
  // 生产环境：从 resources 目录获取
  return path.join(process.resourcesPath, 'backend-nodejs', 'penguin-backend.exe');
}

// 检查端口是否被占用
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
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

// 启动后端服务
async function startBackend(): Promise<void> {
  try {
    const portInUse = await isPortInUse(8766);
    if (portInUse) {
      console.log('Port 8766 already in use, skipping backend start');
      return;
    }

    const backendPath = getBackendPath();

    if (isDev) {
      // 开发环境：使用 node 运行
      backendProcess = spawn('node', [backendPath], {
        cwd: path.join(__dirname, '../backend-nodejs'),
        stdio: 'inherit',
      });
    } else {
      // 生产环境：直接运行 exe
      backendProcess = spawn(backendPath, [], {
        stdio: 'inherit',
      });
    }

    backendProcess.on('error', (err) => {
      console.error('Backend process error:', err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // 等待后端启动
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('Failed to start backend:', error);
  }
}

// 创建主窗口
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:5176'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建菜单
function createMenu(): void {
  const template: any[] = [
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
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            // 可以打开关于对话框
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App 事件处理
app.on('ready', async () => {
  await startBackend();
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
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC 处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});
