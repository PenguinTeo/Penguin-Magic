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
  
  // 存储路径相关
  selectStoragePath: () => ipcRenderer.invoke('select-storage-path'),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  setStoragePath: (path) => ipcRenderer.invoke('set-storage-path', path),
  migrateData: (newPath) => ipcRenderer.invoke('migrate-data', newPath),
  openStoragePath: () => ipcRenderer.invoke('open-storage-path'),
  
  // 环境标识
  isElectron: true
});

console.log('Preload script loaded');
