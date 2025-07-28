// Electron 环境下的服务器启动脚本
// 直接导入服务器逻辑，避免spawn子进程

import path from 'path';
import { fileURLToPath } from 'url';

console.log('Starting Electron backend server...');

// 设置环境为生产模式
process.env.NODE_ENV = 'production';

// 为 ES 模块创建 __dirname 等效物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 启动服务器函数
export async function startServer() {
  try {
    // 动态导入服务器模块以启动服务
    // 使用相对路径导入编译后的server.js
    const serverPath = path.resolve(__dirname, '../src/server.js');
    console.log('Importing server from:', serverPath);
    
    // 动态导入服务器模块
    await import(serverPath);
    console.log('Server started successfully!');
  } catch (error) {
    console.error('服务器启动失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}