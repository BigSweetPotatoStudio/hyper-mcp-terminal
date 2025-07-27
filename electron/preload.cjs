const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用信息
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppName: () => ipcRenderer.invoke('app-name'),
  
  // 平台信息
  platform: process.platform,
  
  // 节点信息
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

// 当 DOM 准备就绪时
window.addEventListener('DOMContentLoaded', () => {
  // 可以在这里添加一些初始化逻辑
  console.log('Electron preload script loaded');
});