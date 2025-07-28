// Electron 开发环境启动脚本
import { spawn, ChildProcess } from 'child_process';
import { app, BrowserWindow } from 'electron';
import { setupIPC, createMainWindow, setupSecurity } from './window.js';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// 等待服务器启动
function waitForServer(url: string, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const http = require('http');
      const req = http.get(url, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - startTime < timeout) {
          setTimeout(check, 1000);
        } else {
          reject(new Error('服务器启动超时'));
        }
      });
    };
    check();
  });
}

// 启动开发服务器
function startDevServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    serverProcess.on('error', reject);
    
    // 等待服务器启动
    setTimeout(() => {
      waitForServer('http://localhost:3000')
        .then(() => resolve())
        .catch(reject);
    }, 3000);
  });
}

app.whenReady().then(async () => {
  // 设置 IPC 处理程序
  setupIPC();
  
  // 设置安全策略
  setupSecurity();

  try {
    console.log('启动开发服务器...');
    await startDevServer();
    console.log('服务器启动成功，创建窗口...');
    mainWindow = createMainWindow(true); // 开发模式
  } catch (error) {
    console.error('启动失败:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});