const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 更新相关
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('update-status');
  },
  
  // 环境标识
  isElectron: true
});

console.log('Preload script loaded');
