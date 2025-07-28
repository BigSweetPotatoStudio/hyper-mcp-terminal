// 共享的窗口创建逻辑
import { BrowserWindow, shell, ipcMain, app } from 'electron';
import path from 'path';

// 设置 IPC 处理程序
export function setupIPC() {
  ipcMain.handle('app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app-name', () => {
    return app.getName();
  });
}

// 创建主窗口
export function createMainWindow(isDev: boolean = false): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js') // 编译后是.js文件
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
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
    // 窗口已关闭，释放引用
  });

  // 阻止导航到其他页面
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  return mainWindow;
}

// 安全设置
export function setupSecurity() {
  // 防止新窗口创建  
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      // 使用外部浏览器打开链接
      shell.openExternal(url);
      return { action: 'deny' };
    });
  });
}

