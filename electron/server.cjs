// Electron 环境下的服务器启动脚本
// 直接使用主服务器逻辑，避免重复代码

console.log('Starting Electron backend server...');

// 设置环境为生产模式
process.env.NODE_ENV = 'production';

// 使用tsx运行TypeScript服务器
const { spawn } = require('child_process');
const path = require('path');

const serverProcess = spawn('npx', ['tsx', path.join(__dirname, '../src/server.ts')], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

serverProcess.on('error', (err) => {
  console.error('服务器启动失败:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
  process.exit(code);
});