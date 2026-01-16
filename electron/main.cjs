const { app, BrowserWindow, Menu, nativeImage, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { autoUpdater } = require('electron-updater');

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

// 版本更新内容说明（业务向）
const RELEASE_NOTES = {
  '1.4.2': {
    title: '🎉 重磅更新 v1.4.2',
    content: '本次更新内容：\n\n🍎 Mac 版本正式上线\n• 支持 macOS 平台\n• 支持 Apple Silicon (M1/M2/M3) 芯片\n• 自动更新功能同步支持\n\n感谢您的使用！'
  },
  '1.4.1': {
    title: '🎉 重磅更新 v1.4.1',
    content: '本次更新内容：\n\n✨ 视频节点批量输出改造\n• 视频节点现在支持批量生成（最多4个）\n• 生成结果自动弹出独立的视频容器节点\n\n🎬 视频工具栏\n• 新增视频专用工具球\n• 支持提取首帧/尾帧，输出为图片节点\n\n🚀 Veo3.1 全系列模型支持\n• 支持 6 种模型：fast/4k/pro/pro-4k/comp/comp-4k\n• 新增增强提示词开关\n\n📷 画布体验优化\n• 优化画布布局，满铺全屏\n• 优化错误状态显示\n\n感谢您的使用！'
  },
  '1.4.0': {
    title: '🎉 重磅更新 v1.4.0',
    content: '本次更新内容：\n\n✨ 视频节点批量输出改造\n• 视频节点现在支持批量生成（最多4个）\n• 生成结果自动弹出独立的视频容器节点\n\n🎬 视频工具栏\n• 新增视频专用工具球\n• 支持提取首帧/尾帧，输出为图片节点\n\n🚀 Veo3.1 全系列模型支持\n• 支持 6 种模型：fast/4k/pro/pro-4k/comp/comp-4k\n• 新增增强提示词开关\n\n📷 画布体验优化\n• 优化画布布局，满铺全屏\n• 优化错误状态显示\n\n感谢您的使用！'
  },
  '1.3.7': {
    title: '🎉 欢迎使用新版本 v1.3.7',
    content: '本次更新内容：\n\n• 新增自定义数据存储路径功能\n• 支持数据迁移到新位置\n• 可在设置中管理存储位置\n\n感谢您的使用！'
  },
  '1.2.7': {
    title: '🎉 欢迎使用新版本 v1.2.7',
    content: '本次更新内容：\n\n• 修复了画布中 Veo 3.1 视频生成后无法正常显示的问题\n• 优化了视频下载稳定性\n• 减少了浏览器内存占用\n\n感谢您的使用！'
  },
  '1.3.0': {
    title: '🎉 欢迎使用新版本 v1.3.0',
    content: '本次更新内容：\n\n• 优化了应用性能和稳定性\n• 修复了已知问题\n\n感谢您的使用！'
  },
  '1.3.1': {
    title: '🎉 欢迎使用新版本 v1.3.1',
    content: '本次更新内容：\n\n• 优化了应用性能和稳定性\n• 修复了已知问题\n\n感谢您的使用！'
  },
  '1.3.2': {
    title: '🎉 欢迎使用新版本 v1.3.2',
    content: '本次更新内容：\n\n• 全新自定义更新弹窗样式，更精美的UI体验\n• 设置中新增检查更新按钮\n• 优化了应用性能和稳定性\n\n感谢您的使用！'
  },
  '1.3.3': {
    title: '🎉 欢迎使用新版本 v1.3.3',
    content: '本次更新内容：\n\n• 修复更新弹窗内容显示不全的问题\n• 优化设置弹窗UI风格\n• 统一应用内滚动条样式\n\n感谢您的使用！'
  },
  '1.3.7': {
    title: '🎉 欢迎使用新版本 v1.3.7',
    content: '本次更新内容：\n\n• 新增自定义数据存储路径功能\n• 支持数据迁移到新位置\n• 可在设置中管理存储位置\n\n感谢您的使用！'
  },
  '1.3.6': {
    title: '🎉 欢迎使用新版本 v1.3.6',
    content: '本次更新内容：\n\n• 全新设置弹窗 UI 设计\n• 统一冰蓝色系视觉风格\n• 优化 API 配置布局\n• 底部信息栏固定展示\n\n感谢您的使用！'
  },
  '1.3.5': {
    title: '🎉 欢迎使用新版本 v1.3.5',
    content: '本次更新内容：\n\n• 全新设置弹窗 UI 设计\n• 统一冰蓝色系视觉风格\n• 优化 API 配置布局\n• 底部信息栏固定展示\n\n感谢您的使用！'
  },
  '1.3.4': {
    title: '🎉 欢迎使用新版本 v1.3.4',
    content: '本次更新内容：\n\n• 修复更新弹窗图标无法显示的问题\n• 修复弹窗可拖动的问题\n• 修复内容区域无法滚动的问题\n\n感谢您的使用！'
  }
};

// 检查并显示更新后欢迎提示（自定义弹窗）
function checkAndShowWelcome() {
  const currentVersion = app.getVersion();
  const versionFile = path.join(app.getPath('userData'), 'last_version.txt');
  
  let lastVersion = '';
  try {
    if (fs.existsSync(versionFile)) {
      lastVersion = fs.readFileSync(versionFile, 'utf-8').trim();
    }
  } catch (e) {
    console.log('读取版本文件失败:', e.message);
  }
  
  // 保存当前版本
  try {
    fs.writeFileSync(versionFile, currentVersion);
  } catch (e) {
    console.log('保存版本文件失败:', e.message);
  }
  
  // 如果版本不同且有更新日志，显示自定义欢迎弹窗
  if (lastVersion && lastVersion !== currentVersion && RELEASE_NOTES[currentVersion]) {
    const notes = RELEASE_NOTES[currentVersion];
    setTimeout(() => {
      showUpdateDialog(currentVersion, notes);
    }, 2000);
  }
}

// 显示自定义更新弹窗
function showUpdateDialog(version, notes) {
  const contentLines = notes.content.split('\n').filter(line => line.trim());
  const contentHtml = contentLines.map(line => {
    if (line.startsWith('•')) {
      return `<div class="item"><span class="dot"></span><span>${line.substring(1).trim()}</span></div>`;
    }
    return `<div class="text">${line}</div>`;
  }).join('');

  const updateWindow = new BrowserWindow({
    width: 380,
    height: 440,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        html, body {
          height: 100%;
          overflow: hidden;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* 自定义滚动条 */
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-track { background: transparent; }
        .content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        .content::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        .card {
          width: 340px;
          max-height: 400px;
          background: linear-gradient(180deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          animation: fadeIn 0.3s ease-out;
          display: flex;
          flex-direction: column;
        }
        .header {
          padding: 24px 24px 16px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .icon-wrap {
          width: 56px;
          height: 56px;
          margin: 0 auto 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .badge-text {
          font-size: 11px;
          font-weight: 600;
          color: #60a5fa;
          letter-spacing: 0.02em;
        }
        .version {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .content {
          padding: 20px 24px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          max-height: 150px;
        }
        .section-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }
        .item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .item span:last-child {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }
        .text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          padding: 4px 0;
        }
        .footer {
          padding: 16px 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .btn {
          width: 100%;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }
        .btn:active {
          transform: translateY(0) scale(0.98);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div class="badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span class="badge-text">NEW VERSION</span>
          </div>
          <div class="version">v${version}</div>
          <div class="subtitle">已成功更新到最新版本</div>
        </div>
        <div class="content">
          <div class="section-title">更新内容</div>
          ${contentHtml}
        </div>
        <div class="footer">
          <button class="btn" onclick="window.close()">开始使用</button>
        </div>
      </div>
    </body>
    </html>
  `)}`);

  updateWindow.once('ready-to-show', () => {
    updateWindow.show();
  });
}

// 下载进度弹窗引用
let downloadProgressWindow = null;

// 显示发现新版本弹窗
function showUpdateAvailableDialog(version, notes) {
  const iconPath = getIconPath().replace(/\\/g, '/');
  const contentLines = notes.split('\n').filter(line => line.trim());
  const contentHtml = contentLines.map(line => {
    if (line.startsWith('•')) {
      return `<div class="item"><span class="dot"></span><span>${line.substring(1).trim()}</span></div>`;
    }
    return `<div class="text">${line}</div>`;
  }).join('');

  const updateAvailableWindow = new BrowserWindow({
    width: 380,
    height: 380,
    frame: false,
    transparent: true,
    resizable: false,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  updateAvailableWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: transparent;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-app-region: drag;
        }
        .card {
          width: 340px;
          background: linear-gradient(180deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          animation: fadeIn 0.3s ease-out;
        }
        .header {
          padding: 24px 24px 16px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .icon { font-size: 40px; margin-bottom: 12px; }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .badge-text {
          font-size: 11px;
          font-weight: 600;
          color: #4ade80;
          letter-spacing: 0.02em;
        }
        .version {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .content {
          padding: 20px 24px;
          max-height: 150px;
          overflow-y: auto;
        }
        .section-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }
        .item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .item span:last-child {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }
        .text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          padding: 4px 0;
        }
        .footer {
          padding: 16px 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          gap: 10px;
        }
        .btn {
          flex: 1;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-app-region: no-drag;
        }
        .btn-primary {
          color: white;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
        }
        .btn-secondary {
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.08);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .btn:active { transform: translateY(0) scale(0.98); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="icon">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="url(#rocket-bg)" />
              <path d="M24 12c-2 4-3 8-3 12 0 2 .5 4 1.5 6l-4.5 3 1.5-6-3-3h5l2.5-5 2.5 5h5l-3 3 1.5 6-4.5-3c1-2 1.5-4 1.5-6 0-4-1-8-3-12z" fill="#fff"/>
              <circle cx="24" cy="22" r="2" fill="#4ade80"/>
              <defs>
                <linearGradient id="rocket-bg" x1="4" y1="4" x2="44" y2="44">
                  <stop stop-color="#22c55e"/>
                  <stop offset="1" stop-color="#16a34a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5">
              <path d="M12 2v20M2 12h20"/>
            </svg>
            <span class="badge-text">UPDATE AVAILABLE</span>
          </div>
          <div class="version">v${version}</div>
          <div class="subtitle">发现新版本</div>
        </div>
        <div class="content">
          <div class="section-title">更新内容</div>
          ${contentHtml}
        </div>
        <div class="footer">
          <button class="btn btn-secondary" onclick="require('electron').ipcRenderer.send('update-response', 'later');window.close()">稍后</button>
          <button class="btn btn-primary" onclick="require('electron').ipcRenderer.send('update-response', 'download');window.close()">立即更新</button>
        </div>
      </div>
    </body>
    </html>
  `)}`);

  updateAvailableWindow.once('ready-to-show', () => {
    updateAvailableWindow.show();
  });
}

// 显示下载进度弹窗
function showDownloadProgressWindow() {
  if (downloadProgressWindow) return;

  downloadProgressWindow = new BrowserWindow({
    width: 340,
    height: 180,
    frame: false,
    transparent: true,
    resizable: false,
    parent: mainWindow,
    modal: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  downloadProgressWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: transparent;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-app-region: drag;
        }
        .card {
          width: 300px;
          padding: 24px;
          background: linear-gradient(180deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          animation: fadeIn 0.3s ease-out;
          text-align: center;
        }
        .icon { font-size: 32px; margin-bottom: 12px; }
        .title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .progress-bg {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .percent {
          font-size: 24px;
          font-weight: 700;
          color: #60a5fa;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="url(#dl-bg)" opacity="0.15"/>
            <path d="M24 14v14m0 0l-5-5m5 5l5-5" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 32h20" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
            <defs>
              <linearGradient id="dl-bg" x1="4" y1="4" x2="44" y2="44">
                <stop stop-color="#3b82f6"/>
                <stop offset="1" stop-color="#60a5fa"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="title">正在下载更新...</div>
        <div class="progress-bg"><div class="progress-bar" id="progress" style="width: 0%"></div></div>
        <div class="percent" id="percent">0%</div>
      </div>
    </body>
    </html>
  `)}`);

  downloadProgressWindow.once('ready-to-show', () => {
    downloadProgressWindow.show();
  });
}

// 更新下载进度
function updateDownloadProgress(percent) {
  if (!downloadProgressWindow) {
    showDownloadProgressWindow();
    return;
  }
  downloadProgressWindow.webContents.executeJavaScript(`
    document.getElementById('progress').style.width = '${percent}%';
    document.getElementById('percent').textContent = '${percent.toFixed(1)}%';
  `).catch(() => {});
}

// 关闭下载进度弹窗
function closeDownloadProgressWindow() {
  if (downloadProgressWindow) {
    downloadProgressWindow.close();
    downloadProgressWindow = null;
  }
}

// 显示更新就绪弹窗
function showUpdateReadyDialog(version) {
  const updateReadyWindow = new BrowserWindow({
    width: 380,
    height: 280,
    frame: false,
    transparent: true,
    resizable: false,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  updateReadyWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: transparent;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-app-region: drag;
        }
        .card {
          width: 340px;
          padding: 32px 24px;
          background: linear-gradient(180deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          animation: fadeIn 0.3s ease-out;
          text-align: center;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: bounce 1s ease-in-out infinite;
        }
        .title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 24px;
        }
        .footer {
          display: flex;
          gap: 10px;
        }
        .btn {
          flex: 1;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-app-region: no-drag;
        }
        .btn-primary {
          color: white;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }
        .btn-secondary {
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.08);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .btn:active { transform: translateY(0) scale(0.98); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="url(#check-bg)"/>
            <path d="M16 24l6 6 10-12" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="check-bg" x1="4" y1="4" x2="44" y2="44">
                <stop stop-color="#22c55e"/>
                <stop offset="1" stop-color="#16a34a"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="title">v${version} 已准备就绪</div>
        <div class="subtitle">重启应用以完成更新</div>
        <div class="footer">
          <button class="btn btn-secondary" onclick="window.close()">稍后</button>
          <button class="btn btn-primary" onclick="require('electron').ipcRenderer.send('update-response', 'install');window.close()">立即重启</button>
        </div>
      </div>
    </body>
    </html>
  `)}`);

  updateReadyWindow.once('ready-to-show', () => {
    updateReadyWindow.show();
  });
}

// 检查并释放端口（Windows）
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve();
      return;
    }
    
    // 查找占用端口的进程PID
    exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (err, stdout) => {
      if (err || !stdout.trim()) {
        console.log(`✅ 端口 ${port} 未被占用`);
        resolve();
        return;
      }
      
      // 解析PID
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') {
          pids.add(pid);
        }
      });
      
      if (pids.size === 0) {
        resolve();
        return;
      }
      
      console.log(`⚠️ 端口 ${port} 被占用，尝试终止进程: ${[...pids].join(', ')}`);
      
      // 杀掉占用端口的进程
      const killPromises = [...pids].map(pid => {
        return new Promise((res) => {
          exec(`taskkill /F /PID ${pid}`, (killErr) => {
            if (killErr) {
              console.log(`杀死进程 ${pid} 失败:`, killErr.message);
            } else {
              console.log(`✅ 已终止进程 ${pid}`);
            }
            res();
          });
        });
      });
      
      Promise.all(killPromises).then(() => {
        // 等待一下确保端口释放
        setTimeout(resolve, 500);
      });
    });
  });
}

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
  const iconExt = process.platform === 'win32' ? 'ico' : 'png';
  let iconPath;
  
  if (!app.isPackaged) {
    // 开发环境
    iconPath = path.join(__dirname, `../resources/icon.${iconExt}`);
  } else {
    // 打包环境：尝试多个可能的位置
    const possiblePaths = [
      path.join(process.resourcesPath, `icon.${iconExt}`),
      path.join(process.resourcesPath, 'resources', `icon.${iconExt}`),
      path.join(app.getAppPath(), 'resources', `icon.${iconExt}`),
      path.join(__dirname, `../resources/icon.${iconExt}`)
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        iconPath = p;
        console.log('✅ 找到图标:', p);
        break;
      } else {
        console.log('❌ 图标不存在:', p);
      }
    }
    
    if (!iconPath) {
      console.error('❌ 无法找到图标文件');
      return null;
    }
  }
  
  return iconPath;
}

// 创建 nativeImage 图标
function getNativeIcon() {
  const iconPath = getIconPath();
  if (!iconPath) return null;
  
  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.error('❌ 图标加载失败（空图片）:', iconPath);
      return null;
    }
    console.log('✅ 图标加载成功:', iconPath, '尺寸:', icon.getSize());
    return icon;
  } catch (e) {
    console.error('❌ 图标加载异常:', e);
    return null;
  }
}

// 创建主窗口
function createWindow() {
  const icon = getNativeIcon();
  console.log('窗口图标:', icon ? '已加载' : '未加载');
  
  mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    minWidth: CONFIG.minWidth,
    minHeight: CONFIG.minHeight,
    title: 'PenguinMagic - 企鹅工坊',
    icon: icon || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false // 先隐藏，等加载完成后显示
  });
  
  // 设置任务栏图标（Windows特有）
  if (icon && process.platform === 'win32') {
    mainWindow.setIcon(icon);
  }

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

    // 读取自定义存储路径
    const storageConfig = loadStorageConfig();
    const userDataPath = storageConfig.customPath || app.getPath('userData');
    console.log('数据存储路径:', userDataPath);

    // 设置环境变量
    process.env.NODE_ENV = 'production';
    process.env.PORT = CONFIG.backendPort.toString();
    process.env.HOST = CONFIG.backendHost;
    process.env.IS_ELECTRON = 'true';
    process.env.USER_DATA_PATH = userDataPath;

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

// ============ 自动更新配置 ============
function setupAutoUpdater() {
  if (CONFIG.isDev) {
    console.log('📦 开发模式，跳过自动更新检查');
    return;
  }

  // 配置更新服务器
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'http://updates.pebbling.cn/'
  });

  // 禁用自动下载，让用户选择
  autoUpdater.autoDownload = false;

  // 检查更新出错
  autoUpdater.on('error', (err) => {
    console.error('❌ 更新检查出错:', err.message);
  });

  // 检查到新版本
  autoUpdater.on('update-available', (info) => {
    console.log('🆕 发现新版本:', info.version);
    
    // 优先使用服务器返回的 releaseNotes，否则使用默认说明
    let notes = '• 性能优化和问题修复';
    if (info.releaseNotes) {
      // releaseNotes 可能是字符串或数组
      if (typeof info.releaseNotes === 'string') {
        notes = info.releaseNotes;
      } else if (Array.isArray(info.releaseNotes)) {
        notes = info.releaseNotes.map(n => n.note || n).join('\n');
      }
    }
    
    console.log('📝 更新说明:', notes.substring(0, 100) + '...');
    showUpdateAvailableDialog(info.version, notes);
  });

  // 无新版本
  autoUpdater.on('update-not-available', () => {
    console.log('✅ 当前已是最新版本');
    // 通知渲染进程
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'up-to-date', version: app.getVersion() });
    }
  });

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    const percent = progress.percent.toFixed(1);
    console.log(`📥 下载进度: ${percent}%`);
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100);
      mainWindow.webContents.send('update-status', { status: 'downloading', percent: progress.percent });
    }
    // 更新进度弹窗
    updateDownloadProgress(progress.percent);
  });

  // 下载完成
  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ 更新下载完成:', info.version);
    if (mainWindow) {
      mainWindow.setProgressBar(-1);
    }
    closeDownloadProgressWindow();
    showUpdateReadyDialog(info.version);
  });

  // 延迟 5 秒后检查更新
  setTimeout(() => {
    console.log('🔍 开始检查更新...');
    autoUpdater.checkForUpdates().catch(err => {
      console.error('检查更新失败:', err.message);
    });
  }, 5000);
}

// ============ IPC 通信处理 ============
// 处理更新弹窗的响应
ipcMain.on('update-response', (event, action) => {
  if (action === 'download') {
    autoUpdater.downloadUpdate();
  } else if (action === 'install') {
    autoUpdater.quitAndInstall(false, true);
  }
});

// 获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 手动检查更新
ipcMain.handle('check-for-updates', async () => {
  if (CONFIG.isDev) {
    return { status: 'dev-mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', version: result?.updateInfo?.version };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

// ============ 存储路径相关 IPC ============
// 获取自定义存储路径配置文件路径
function getStorageConfigPath() {
  return path.join(app.getPath('userData'), 'storage_config.json');
}

// 读取存储路径配置
function loadStorageConfig() {
  const configPath = getStorageConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('读取存储配置失败:', e.message);
  }
  return { customPath: null };
}

// 保存存储路径配置
function saveStorageConfig(config) {
  const configPath = getStorageConfigPath();
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.log('保存存储配置失败:', e.message);
    return false;
  }
}

// 获取当前存储路径
ipcMain.handle('get-storage-path', () => {
  const config = loadStorageConfig();
  const defaultPath = app.getPath('userData');
  return {
    currentPath: config.customPath || defaultPath,
    isCustom: !!config.customPath,
    defaultPath: defaultPath
  };
});

// 选择存储路径
ipcMain.handle('select-storage-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择数据存储位置',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: '选择此文件夹'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false };
});

// 设置存储路径
ipcMain.handle('set-storage-path', (event, newPath) => {
  try {
    // 验证路径是否有效
    if (newPath && !fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }
    
    const config = loadStorageConfig();
    config.customPath = newPath || null;
    const saved = saveStorageConfig(config);
    
    return { 
      success: saved, 
      message: saved ? '存储路径已更新，重启应用后生效' : '保存配置失败',
      needRestart: true
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
});

// 迁移数据到新路径
ipcMain.handle('migrate-data', async (event, newPath) => {
  try {
    const config = loadStorageConfig();
    const currentPath = config.customPath || app.getPath('userData');
    
    if (currentPath === newPath) {
      return { success: true, message: '目标路径与当前路径相同' };
    }
    
    // 要迁移的文件夹
    const foldersToMigrate = ['data', 'input', 'output', 'creative_images', 'thumbnails', 'canvas_images'];
    let migratedCount = 0;
    let fileCount = 0;
    
    // 递归复制文件夹
    function copyDirRecursive(src, dest) {
      if (!fs.existsSync(src)) return 0;
      
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      let count = 0;
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          count += copyDirRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
          count++;
        }
      }
      return count;
    }
    
    for (const folder of foldersToMigrate) {
      const srcDir = path.join(currentPath, folder);
      const destDir = path.join(newPath, folder);
      
      if (fs.existsSync(srcDir)) {
        const copied = copyDirRecursive(srcDir, destDir);
        if (copied > 0) {
          migratedCount++;
          fileCount += copied;
        }
      }
    }
    
    // 保存新路径配置
    config.customPath = newPath;
    saveStorageConfig(config);
    
    return { 
      success: true, 
      message: `已迁移 ${migratedCount} 个文件夹（${fileCount} 个文件），重启应用后生效`,
      needRestart: true
    };
  } catch (e) {
    return { success: false, message: '迁移失败: ' + e.message };
  }
});

// 打开存储路径
ipcMain.handle('open-storage-path', () => {
  const config = loadStorageConfig();
  const currentPath = config.customPath || app.getPath('userData');
  shell.openPath(currentPath);
  return { success: true };
});

// 应用启动
app.whenReady().then(async () => {
  console.log('🐧 PenguinMagic 启动中...');
  console.log('用户数据目录:', app.getPath('userData'));
  console.log('应用路径:', app.getAppPath());
  console.log('开发模式:', CONFIG.isDev);

  // 创建菜单（仅在开发环境）
  if (CONFIG.isDev) {
    createMenu();
  } else {
    // 生产环境：隐藏菜单栏
    Menu.setApplicationMenu(null);
  }

  // 生产环境：先显示启动画面
  if (!CONFIG.isDev) {
    createSplashWindow();
    
    try {
      // 先检查并释放端口
      await killProcessOnPort(CONFIG.backendPort);
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

  // 设置自动更新（生产环境）
  setupAutoUpdater();

  // 检查并显示更新后欢迎提示（生产环境）
  if (!CONFIG.isDev) {
    checkAndShowWelcome();
  }

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
