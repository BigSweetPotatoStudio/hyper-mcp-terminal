# Hyper MCP Terminal

一个基于 MCP (Model Context Protocol) 的终端应用，为 AI 助手提供安全的终端执行能力。

## 项目概述

Hyper MCP Terminal 是一个 TypeScript/Node.js 项目，提供了一个 Web 终端界面和 MCP 服务器，使 AI 助手能够安全地执行命令行操作。

## 核心功能

- **Web 终端界面**: 基于 xterm.js 的现代 Web 终端
- **MCP 服务器**: 符合 Model Context Protocol 标准的服务器实现
- **实时通信**: 使用 Socket.IO 进行客户端与服务器的实时通信
- **跨平台支持**: 支持 Windows、macOS 和 Linux

## 架构设计

### 主要组件

- `src/server.ts`: Web 服务器和 Socket.IO 服务器
- `src/main.mts`: MCP 服务器入口点
- `src/shell.ts`: 终端会话管理
- `src/commander.ts`: 命令行参数处理
- `frontend/`: React 前端界面

### 技术栈

- **后端**: Node.js + TypeScript + Koa
- **前端**: React + TypeScript + Ant Design
- **终端**: xterm.js + node-pty
- **通信**: Socket.IO
- **构建**: Webpack + TypeScript

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 pnpm
- C++ 编译环境（用于 node-pty 依赖）

### 常用命令

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 构建前端
npm run build:web

# 前端开发监听
npm run dev:web

# 启动服务（生产环境）
npm start

# 重启服务
npm restart
```

### 开发流程

1. 修改代码后运行 `npm run build` 编译 TypeScript
2. 使用 `npm run dev` 启动开发服务器
3. 前端修改使用 `npm run dev:web` 进行热重载

## 配置说明

### 环境变量

- `Terminal_End_CheckCount`: 终端结束检测次数（默认 15）
- `Terminal_Output_MaxToken`: 终端输出最大长度（默认 10000）
- `Terminal_Timeout`: 终端超时时间（默认 5 分钟）

### 端口配置

- Web 服务器默认端口可在 `src/server.ts` 中配置
- MCP 服务器使用 stdio 传输

## 安全考虑

- 终端会话隔离
- 输出长度限制
- 超时保护
- 命令执行监控

## 部署说明

1. 安装依赖: `npm install`
2. 构建项目: `npm run build`
3. 启动服务: `npm start`

## 故障排除

### node-pty 安装失败

node-pty 依赖需要 C++ 编译环境，请参考 [官方文档](https://github.com/microsoft/node-pty#dependencies) 安装相关依赖。

### 权限问题

确保运行用户有足够的权限执行终端命令。

## 测试

目前项目暂未包含自动化测试，建议手动测试各项功能。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License