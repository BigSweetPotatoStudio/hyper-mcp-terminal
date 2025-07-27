// Electron 开发环境启动脚本
const { spawn } = require('child_process');
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let serverProcess;

// 等待服务器启动
function waitForServer(url, timeout = 30000) {
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
function startDevServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    serverProcess.on('error', reject);
    
    // 等待服务器启动
    setTimeout(() => {
      waitForServer('http://localhost:3000')
        .then(resolve)
        .catch(reject);
    }, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload.cjs')
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log('启动开发服务器...');
    await startDevServer();
    console.log('服务器启动成功，创建窗口...');
    createWindow();
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