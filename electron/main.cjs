const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { setupIPC, createMainWindow, setupSecurity } = require('./window.cjs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;

// 启动后端服务器
function startServer() {
  const serverScript = path.join(__dirname, 'server.cjs');
  
  serverProcess = spawn('node', [serverScript], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  serverProcess.on('error', (err) => {
    console.error('服务器启动失败:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`服务器进程退出，代码: ${code}`);
  });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  // 设置 IPC 处理程序
  setupIPC();
  
  // 设置安全策略
  setupSecurity();

  if (!isDev) {
    // 生产模式下启动服务器
    startServer();
    
    // 等待服务器启动
    setTimeout(() => {
      mainWindow = createMainWindow(false);
    }, 2000);
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
  if (serverProcess) {
    serverProcess.kill();
  }
});