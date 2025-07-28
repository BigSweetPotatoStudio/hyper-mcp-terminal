import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIPC, createMainWindow, setupSecurity } from './window.js';
import { startServer } from './server.js';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  // 设置 IPC 处理程序
  setupIPC();
  
  // 设置安全策略
  setupSecurity();

  if (!isDev) {
    // 生产模式下启动服务器
    startServer().then(() => {
      console.log('服务器启动成功，创建窗口...');
      mainWindow = createMainWindow(false);
    }).catch((error) => {
      console.error('服务器启动失败:', error);
      app.quit();
    });
  } else {
    mainWindow = createMainWindow(true);
  }

  app.on('activate', () => {
    // 在 macOS 上，当单击停靠图标并且没有其他窗口打开时
    // 通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow(isDev);
    }
  });
});

// 当所有窗口都关闭时退出应用 (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  // 不再需要手动清理子进程，因为服务器在相同进程中运行
});