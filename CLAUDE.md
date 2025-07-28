# Hyper MCP Terminal

一个基于 MCP (Model Context Protocol) 的 Electron 桌面终端应用，为 AI 助手提供安全的终端执行能力。

## 项目概述

Hyper MCP Terminal 是一个现代化的 Electron 桌面应用，集成了 MCP 协议支持和多标签页终端界面，使 AI 助手能够安全地执行命令行操作。

## 核心功能

- **Electron 桌面应用**: 跨平台桌面终端应用
- **多标签页终端**: 支持多个独立的终端会话
- **MCP 服务器**: 符合 Model Context Protocol 标准的服务器实现
- **实时通信**: 使用 Socket.IO 进行客户端与服务器的实时通信
- **活跃终端跟踪**: 自动检测和切换活跃终端会话
- **跨平台支持**: 支持 Windows、macOS 和 Linux

## 架构设计

### 主要组件

- `electron/main.ts`: Electron 主进程入口点
- `electron/server.ts`: 内置 HTTP/WebSocket 服务器
- `electron/index.mts`: MCP 服务器实现
- `electron/window.ts`: 窗口管理和 IPC 处理
- `electron/shell.ts`: 终端会话管理
- `electron/commander.ts`: 命令行参数处理
- `frontend/`: React + TypeScript 前端界面

### 技术栈

- **桌面框架**: Electron
- **后端**: Node.js + TypeScript + Express
- **前端**: React + TypeScript + Ant Design
- **终端**: xterm.js + node-pty
- **通信**: Socket.IO + IPC
- **构建**: Webpack + TypeScript Compiler

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 pnpm
- C++ 编译环境（用于 node-pty 依赖）

### 常用命令

```bash
# 开发服务器
npm run dev

# 前端开发监听
npm run dev:web

# 构建 TypeScript
npm run build

# 构建前端
npm run build:web

# 运行 Electron 应用
npm run electron

# 开发模式运行
npm run electron:dev

# 完整构建并打包
npm run electron:build

# 打包（不分发）
npm run electron:pack
```

### 开发流程

1. 修改 electron 代码后运行 `npm run build` 编译 TypeScript
2. 使用 `npm run dev` 启动开发服务器
3. 前端修改使用 `npm run dev:web` 进行热重载
4. 使用 `npm run electron` 测试 Electron 应用

## 配置说明

### 环境变量

- `NODE_ENV`: 运行环境 (development/production)
- `Terminal_End_CheckCount`: 终端结束检测次数（默认 15）
- `Terminal_Output_MaxToken`: 终端输出最大长度（默认 10000）
- `Terminal_Timeout`: 终端超时时间（默认 5 分钟）

### 端口配置

- Web 服务器默认端口: 3000
- MCP 服务器使用 stdio 传输

## 安全特性

- 终端会话隔离
- 输出长度限制
- 超时保护
- 命令执行监控
- IPC 安全策略
- Electron 安全配置

## 构建和分发

### 开发构建

1. 安装依赖: `npm install`
2. 构建 TypeScript: `npm run build`
3. 构建前端: `npm run build:web`
4. 运行应用: `npm run electron`

### 生产构建

1. 完整构建: `npm run electron:build`
2. 构建产物将输出到 `dist-electron/` 目录

## 故障排除

### node-pty 安装失败

node-pty 依赖需要 C++ 编译环境，请参考 [官方文档](https://github.com/microsoft/node-pty#dependencies) 安装相关依赖。

### Electron 版本兼容性

如果遇到原生模块版本问题，请重新构建：

```bash
npm rebuild
```

### 权限问题

确保运行用户有足够的权限执行终端命令。

## MCP 集成

### 在 Claude Desktop 中使用

在 Claude Desktop 的配置文件中添加：

```json
{
  "mcpServers": {
    "hyper-mcp-terminal": {
      "command": "path/to/hyper-mcp-terminal/dist/electron/index.mjs"
    }
  }
}
```

### 支持的 MCP 工具

- `execute-command`: 在活跃终端中执行命令
- `create-terminal-session`: 创建新的终端会话
- 自动活跃终端检测和切换

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License