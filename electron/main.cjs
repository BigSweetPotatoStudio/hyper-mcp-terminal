const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;

// 启动后端服务器
function startServer() {
  const serverScript = path.join(__dirname, '../electron-server.cjs');
  
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

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../assets/icon.png'), // 可选：应用图标
    titleBarStyle: 'default',
    show: false // 先不显示，等加载完成后再显示
  });

  // 设置窗口标题
  mainWindow.setTitle('Hyper MCP Terminal');

  // 加载应用
  if (isDev) {
    // 开发模式：连接到开发服务器
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载本地文件
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // 窗口准备就绪时显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 可选：聚焦窗口
    if (isDev) {
      mainWindow.focus();
    }
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 阻止导航到其他页面
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  // 设置 IPC 处理程序
  ipcMain.handle('app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app-name', () => {
    return app.getName();
  });

  if (!isDev) {
    // 生产模式下启动服务器
    startServer();
    
    // 等待服务器启动
    setTimeout(() => {
      createWindow();
    }, 2000);
  } else {
    createWindow();
  }

  app.on('activate', () => {
    // 在 macOS 上，当单击停靠图标并且没有其他窗口打开时
    // 通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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

// 安全：防止新窗口创建  
app.on('web-contents-created', (_event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // 阻止创建新窗口
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

