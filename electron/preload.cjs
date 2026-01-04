const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 文件操作（可选，后续扩展）
  // selectFile: () => ipcRenderer.invoke('select-file'),
  // selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // 环境标识
  isElectron: true
});

console.log('Preload script loaded');
