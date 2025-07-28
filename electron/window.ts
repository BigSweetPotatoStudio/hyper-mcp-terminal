// 共享的窗口创建逻辑
import { BrowserWindow, shell, ipcMain, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { appDataManager, AppSettings } from './app-data.js';

// 为 ES 模块创建 __dirname 等效物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置 IPC 处理程序
export function setupIPC() {
  // 基本应用信息
  ipcMain.handle('app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app-name', () => {
    return app.getName();
  });

  // 应用设置相关 IPC
  ipcMain.handle('get-app-settings', () => {
    return appDataManager.getSettings();
  });

  ipcMain.handle('get-app-setting', (event, key: keyof AppSettings) => {
    return appDataManager.getSetting(key);
  });

  ipcMain.handle('set-app-setting', (event, key: keyof AppSettings, value: any) => {
    appDataManager.setSetting(key, value);
    return true;
  });

  ipcMain.handle('set-nested-app-setting', (event, category: keyof AppSettings, key: string, value: any) => {
    // 使用类型断言来处理嵌套设置
    (appDataManager as any).setNestedSetting(category, key, value);
    return true;
  });

  ipcMain.handle('reset-app-settings', () => {
    appDataManager.resetSettings();
    return true;
  });

  ipcMain.handle('reset-app-setting-category', (event, category: keyof AppSettings) => {
    appDataManager.resetCategory(category);
    return true;
  });

  ipcMain.handle('get-settings-path', () => {
    return appDataManager.getSettingsPath();
  });
}

// 创建主窗口
export function createMainWindow(isDev: boolean = false): BrowserWindow {
  // 从应用数据获取窗口设置
  const windowSettings = appDataManager.getSetting('window');
  
  const mainWindow = new BrowserWindow({
    width: windowSettings.width,
    height: windowSettings.height,
    x: windowSettings.x,
    y: windowSettings.y,
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

  // 如果之前是最大化状态，则最大化窗口
  if (windowSettings.maximized) {
    mainWindow.maximize();
  }

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

  // 保存窗口状态的函数
  const saveWindowState = () => {
    if (mainWindow.isDestroyed()) return;
    
    const bounds = mainWindow.getBounds();
    const isMaximized = mainWindow.isMaximized();
    
    appDataManager.setSetting('window', {
      ...windowSettings,
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: isMaximized,
    });
  };

  // 监听窗口状态变化
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    // 窗口已关闭，释放引用
  });

  // 应用退出前保存窗口状态
  mainWindow.on('close', () => {
    saveWindowState();
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

