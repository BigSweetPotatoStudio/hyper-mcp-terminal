// Electron 应用数据管理模块
import fs from 'fs';
import path from 'path';
import os from 'os';

// 获取应用数据目录的函数
const getUserDataPath = (): string => {
  // 尝试使用Electron的app.getPath
  try {
    if (process.versions?.electron) {
      const { app } = require('electron');
      return app.getPath('userData');
    }
  } catch (error) {
    // Electron不可用，使用备用路径
  }
  
  // 备用路径（用于开发环境）
  const homeDir = os.homedir();
  const appName = 'hyper-mcp-terminal';
  
  switch (process.platform) {
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', appName);
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', appName);
    default:
      return path.join(homeDir, '.config', appName);
  }
};

// 应用设置接口定义
export interface AppSettings {
  server: {
    port: number;
  };
  terminal: {
    maxOutputTokens: number;
  };
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    maximized?: boolean;
  };
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  server: {
    port: 13000,
  },
  terminal: {
    maxOutputTokens: 10000,
  },
  window: {
    width: 1200,
    height: 800,
    maximized: false,
  },
};

// 应用数据管理类
class AppDataManager {
  private settingsPath: string;
  private settings: AppSettings;
  private changeListeners: Array<(settings: AppSettings) => void> = [];

  constructor() {
    // 获取应用数据目录
    const userDataPath = getUserDataPath();
    this.settingsPath = path.join(userDataPath, 'settings.json');
    
    // 确保目录存在
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    // 加载设置
    this.settings = this.loadSettings();
  }

  /**
   * 加载设置从磁盘
   */
  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const loadedSettings = JSON.parse(data);
        
        // 合并默认设置和加载的设置，确保新增的配置项有默认值
        return this.mergeSettings(DEFAULT_SETTINGS, loadedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    // 如果加载失败或文件不存在，返回默认设置
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 深度合并设置对象
   */
  private mergeSettings(defaultSettings: any, userSettings: any): any {
    const result = { ...defaultSettings };
    
    for (const key in userSettings) {
      if (userSettings.hasOwnProperty(key)) {
        if (typeof userSettings[key] === 'object' && userSettings[key] !== null) {
          result[key] = this.mergeSettings(defaultSettings[key] || {}, userSettings[key]);
        } else {
          result[key] = userSettings[key];
        }
      }
    }
    
    return result;
  }

  /**
   * 保存设置到磁盘
   */
  private saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * 获取所有设置
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * 获取特定设置项
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * 设置特定配置项
   */
  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = { ...this.settings[key], ...value };
    this.saveSettings();
    this.notifyChange();
  }

  /**
   * 设置嵌套配置项
   */
  setNestedSetting<K extends keyof AppSettings, N extends keyof AppSettings[K]>(
    category: K,
    key: N,
    value: AppSettings[K][N]
  ): void {
    if (!this.settings[category]) {
      this.settings[category] = {} as AppSettings[K];
    }
    (this.settings[category] as any)[key] = value;
    this.saveSettings();
    this.notifyChange();
  }

  /**
   * 重置所有设置为默认值
   */
  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.notifyChange();
  }

  /**
   * 重置特定类别的设置
   */
  resetCategory<K extends keyof AppSettings>(category: K): void {
    this.settings[category] = { ...DEFAULT_SETTINGS[category] };
    this.saveSettings();
    this.notifyChange();
  }

  /**
   * 添加设置变更监听器
   */
  onChange(listener: (settings: AppSettings) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * 移除设置变更监听器
   */
  removeChangeListener(listener: (settings: AppSettings) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器设置已更改
   */
  private notifyChange(): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.error('Error in settings change listener:', error);
      }
    });
  }

  /**
   * 获取设置文件路径（用于调试）
   */
  getSettingsPath(): string {
    return this.settingsPath;
  }
}

// 创建全局实例
export const appDataManager = new AppDataManager();

// 便捷函数
export const getAppSettings = () => appDataManager.getSettings();
export const getAppSetting = <K extends keyof AppSettings>(key: K) => appDataManager.getSetting(key);
export const setAppSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => 
  appDataManager.setSetting(key, value);
export const setNestedAppSetting = <K extends keyof AppSettings, N extends keyof AppSettings[K]>(
  category: K,
  key: N,
  value: AppSettings[K][N]
) => appDataManager.setNestedSetting(category, key, value);