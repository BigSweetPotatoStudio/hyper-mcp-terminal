# Electron 应用结构说明

## 📁 文件结构整理

经过重构后，所有Electron相关文件现在统一放在 `electron/` 目录下：

```
electron/
├── main.cjs          # 主进程入口（生产环境）
├── dev.cjs           # 开发环境启动脚本
├── server.cjs        # Electron环境服务器启动器
├── preload.cjs       # 预加载脚本（IPC桥接）
├── window.cjs        # 共享窗口逻辑
└── README.md         # 此文档
```

## 🎯 重构改进

### **消除的问题**
- ❌ 文件散布在根目录和electron目录
- ❌ 重复的窗口创建逻辑
- ❌ 重复的IPC处理代码
- ❌ 重复的安全设置
- ❌ 独立的服务器实现

### **新的架构**
- ✅ 统一的文件组织结构
- ✅ 共享的窗口创建逻辑 (`window.cjs`)
- ✅ 统一的IPC处理 (`setupIPC`)
- ✅ 复用主服务器逻辑 (`server.cjs`)
- ✅ 模块化的安全设置

## 📋 文件说明

### `main.cjs` - 主进程入口
- 生产环境的应用入口
- 启动独立的服务器进程
- 使用共享窗口逻辑

### `dev.cjs` - 开发环境启动器
- 开发环境专用启动脚本
- 自动启动开发服务器
- 连接到热重载服务器

### `server.cjs` - 服务器启动器
- Electron环境下的服务器启动器
- 使用tsx运行TypeScript主服务器
- 避免重复的Socket.IO实现

### `window.cjs` - 共享窗口逻辑
- 统一的窗口创建函数
- IPC处理程序设置
- 安全策略配置
- 支持开发/生产模式切换

### `preload.cjs` - 预加载脚本
- 安全的IPC桥接
- 暴露有限的Node.js API
- 上下文隔离

## 🚀 使用方法

### 开发模式
```bash
npm run electron:dev
```
- 自动启动开发服务器
- 开启开发者工具
- 支持热重载

### 生产模式
```bash
npm run electron
```
- 使用构建后的静态文件
- 启动独立服务器进程
- 生产环境优化

### 构建分发
```bash
npm run electron:build
```
- 构建前端和后端
- 打包Electron应用
- 生成安装包

## 🔧 技术细节

### 服务器复用
- 生产环境使用完整的MCP服务器
- 支持多标签页和活跃终端跟踪
- 统一的Socket.IO事件处理

### 窗口管理
- 统一的窗口配置
- 自动安全设置
- 跨平台兼容性

### IPC通信
- 安全的上下文隔离
- 最小权限原则
- 标准化的API暴露

## 📦 依赖关系

```
main.cjs → window.cjs → preload.cjs
dev.cjs  → window.cjs → preload.cjs
server.cjs → ../src/server.ts
```

这种结构消除了代码重复，提高了可维护性，同时保持了功能的完整性。