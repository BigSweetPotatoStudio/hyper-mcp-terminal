import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { setupIPC, createMainWindow, setupSecurity } from './window.js';
import { startServer, stopServer } from './server.js';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let isServerShutdown = false;

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
    }).catch(async (error) => {
      console.error('服务器启动失败:', error);
      
      // 检查是否是端口占用错误
      const isPortInUse = error.code === 'EADDRINUSE';
      
      if (isPortInUse) {
        // 询问用户是否尝试其他端口
        const response = await dialog.showMessageBox({
          type: 'warning',
          title: '端口被占用',
          message: '13000 端口被占用，无法启动服务器',
          detail: `${error.message}\n\n是否尝试使用其他可用端口？`,
          buttons: ['尝试其他端口', '退出应用', '查看详情'],
          defaultId: 0,
          cancelId: 1
        });
        
        if (response.response === 0) {
          // 尝试其他端口
          try {
            await startServer(true);
            console.log('使用备用端口启动成功，创建窗口...');
            mainWindow = createMainWindow(false);
          } catch (retryError) {
            dialog.showErrorBox('启动失败', `即使尝试其他端口也无法启动服务器：${retryError instanceof Error ? retryError.message : String(retryError)}`);
            app.quit();
          }
        } else if (response.response === 2) {
          // 查看详情
          dialog.showErrorBox('详细错误信息', `错误代码：${error.code}\n错误信息：${error.message}\n\n建议：\n1. 检查是否有其他应用占用了该端口\n2. 重启计算机\n3. 修改应用设置中的端口配置`);
          app.quit();
        } else {
          app.quit();
        }
      } else {
        // 其他类型的错误
        dialog.showErrorBox('启动失败', `服务器启动失败：${error.message}`);
        app.quit();
      }
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
app.on('before-quit', async (event) => {
  if (!isDev && !isServerShutdown) {
    // 阻止默认退出行为，先关闭服务器
    event.preventDefault();
    isServerShutdown = true;
    
    try {
      await stopServer();
      console.log('服务器已清理完成，应用即将退出');
    } catch (error) {
      console.error('关闭服务器时出错:', error);
    }
    
    // 服务器关闭后再次调用quit
    app.quit();
  }
});