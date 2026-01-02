const { contextBridge, ipcRenderer } = require('electron');

// 后端 API 基础 URL
const BACKEND_URL = 'http://localhost:8766';

contextBridge.exposeInMainWorld('electron', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 获取应用路径
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // 获取后端状态
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  
  // 标记这是 Electron 环境
  isElectron: true,
  
  // 后端 API URL
  backendUrl: BACKEND_URL,
});

// 暴露一个简单的 API 用于检查后端连接
contextBridge.exposeInMainWorld('api', {
  // 获取后端基础 URL
  getBaseUrl: () => BACKEND_URL,
  
  // 检查后端是否可用
  checkBackend: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/status`);
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Backend check failed:', error);
      return false;
    }
  },
});
