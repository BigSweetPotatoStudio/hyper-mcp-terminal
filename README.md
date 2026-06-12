# Hyper MCP Terminal

> **归档项目**：本项目已归档，主要保留用于历史参考和旧版本追溯，不再作为活跃维护项目继续开发。新项目不建议继续基于本仓库扩展；如需类似能力，建议重新评估当前 MCP、终端和桌面应用方案。

一个基于 MCP (Model Context Protocol) 的 Electron 桌面终端应用，为 AI 助手提供安全的终端执行能力。让AI可以帮你运行远程机器的shell。

使用http协议
```
    "terminal": {
      "type": "http",
       "url": "http://localhost:13000/mcp"
    }

    "terminal": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:13000/mcp"
      ]
    }
```

<img width="1549" height="875" alt="image" src="https://github.com/user-attachments/assets/bc946181-2b78-424d-86f9-e1a67bfc30a5" />
<img width="1774" height="1289" alt="395ab63caa6f840b536029016a82083" src="https://github.com/user-attachments/assets/71d10904-8397-46bf-9ff3-885c4f237e9b" />
<img width="1276" height="897" alt="098e7e54cb2f65ed297fc7b8f4dee67" src="https://github.com/user-attachments/assets/f1d1fae5-6d78-43ea-b8aa-e95f41361950" />
<img width="1633" height="982" alt="c9230250-8c39-4fc3-bd0c-362b041ca0c0" src="https://github.com/user-attachments/assets/61a7acf6-39b5-4b3d-8d94-4c76f3477dab" />


## 项目概述

Hyper MCP Terminal 是一个现代化的桌面终端应用，集成了 MCP 协议支持，使 AI 助手能够安全地执行命令行操作。应用基于 Electron + TypeScript 构建，提供多标签页终端界面和实时通信能力。

## 核心功能

- 🖥️ **Electron 桌面应用**: 跨平台桌面终端应用
- 📑 **多标签页终端**: 支持多个独立的终端会话
- 🤖 **MCP 协议集成**: 符合 Model Context Protocol 标准
- 🔄 **实时通信**: 基于 WebSocket 的实时终端交互
- 🎨 **现代化界面**: 基于 Ant Design 的美观界面
- ⚡ **TypeScript**: 完整的类型安全支持

## 技术架构

### 主要组件

- `electron/main.ts`: Electron 主进程入口
- `electron/server.ts`: 内置 HTTP/WebSocket 服务器
- `electron/index.mts`: MCP 服务器实现
- `electron/window.ts`: 窗口管理和 IPC 处理
- `frontend/`: React + TypeScript 前端界面

### 技术栈

- **桌面框架**: Electron
- **后端**: Node.js + TypeScript + Express
- **前端**: React + TypeScript + Ant Design
- **终端**: xterm.js + node-pty
- **通信**: Socket.IO + IPC
- **构建**: Webpack + TypeScript Compiler

## 开发环境

### 环境要求

- Node.js 18+
- npm 或 pnpm
- C++ 编译环境（用于 node-pty 依赖）
- Python (Windows 用户)

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 启动开发服务器（后端）
npm run dev

# 启动前端开发监听
npm run dev:web

# 构建 TypeScript
npm run build

# 构建前端
npm run build:web

# 运行 Electron 应用
npm run electron

# 开发模式运行（启动服务器并打开应用）
npm run electron:dev

# 完整构建并打包
npm run electron:build

# 打包（不分发）
npm run electron:pack
```

## 项目结构

```
hyper-mcp-terminal/
├── electron/                 # 核心逻辑目录
│   ├── main.ts              # Electron 主进程
│   ├── server.ts            # HTTP/WebSocket 服务器
│   ├── index.mts            # MCP 服务器
│   ├── commander.ts         # 命令行参数处理
│   ├── shell.ts             # 终端会话管理
│   ├── window.ts            # 窗口管理
│   ├── preload.ts           # 预加载脚本
│   └── dev.ts               # 开发环境启动
├── frontend/                # React 前端界面
│   ├── index.tsx            # 前端入口
│   ├── index.css            # 样式文件
│   └── index.html           # HTML 模板
├── build/                   # 前端构建输出
├── dist/electron/           # TypeScript 编译输出
└── dist-electron/           # Electron 打包输出
```

## 配置说明

### 应用设置

应用设置自动保存在系统的应用数据目录中：
- **macOS**: `~/Library/Application Support/hyper-mcp-terminal/`
- **Windows**: `%APPDATA%/hyper-mcp-terminal/`
- **Linux**: `~/.config/hyper-mcp-terminal/`

#### 默认设置

```json
{
  "server": {
    "port": 13000
  },
  "terminal": {
    "maxOutputTokens": 10000
  },
  "window": {
    "width": 1200,
    "height": 800,
    "maximized": false
  }
}
```

#### 环境变量

- `NODE_ENV`: 运行环境 (development/production)

### 设置管理

- **自动保存**: 所有设置更改自动保存到本地
- **窗口记忆**: 应用会记住窗口位置、大小和最大化状态
- **IPC 接口**: 支持通过 IPC 调用动态修改设置
- **默认值回退**: 无效设置自动回退到默认值

### 端口配置

- Web 服务器端口可通过应用设置修改，默认: 3000
- MCP 服务器使用 stdio 传输

## 安全特性

- 终端会话隔离
- 输出长度限制
- 超时保护
- 命令执行监控
- IPC 安全策略

## 故障排除

### node-pty 安装失败

node-pty 依赖需要 C++ 编译环境，请参考 [官方文档](https://github.com/microsoft/node-pty#dependencies) 安装相关依赖：

**Windows:**
```bash
npm install --global windows-build-tools
```

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential
```

### Electron 原生模块兼容性

node-pty 是一个原生模块，需要为 Electron 的 Node.js 版本重新编译。

**开发环境解决方案：**
```bash
# 方法1：使用electron-rebuild
npm run rebuild

# 方法2：重新安装node-pty
npm uninstall node-pty && npm install node-pty

# 方法3：手动重建
npx electron-rebuild
```

**生产环境解决方案：**
- 使用 `electron-builder` 打包时会自动处理原生模块重建
- 确保在目标平台上构建应用

**注意事项：**
- 开发时的 node-pty 版本问题不影响应用的核心功能（设置管理、窗口状态等）
- 终端功能需要 node-pty 正常工作
- 如果无法解决 node-pty 问题，可以考虑使用其他终端实现

## 使用截图

![终端界面](https://github.com/user-attachments/assets/5c79e0c6-1f0c-4fac-ba77-13609e5e32c4)

![多标签页](https://github.com/user-attachments/assets/3488724b-f061-454d-bfb3-06c69e0e2f83)

![MCP 集成](https://github.com/user-attachments/assets/0fcfab81-b5e8-49bb-b990-eee5dcda1b29)

<img width="1633" height="982" alt="c9230250-8c39-4fc3-bd0c-362b041ca0c0" src="https://github.com/user-attachments/assets/5edf61cd-6879-493d-9471-5383cede15fb" />


## 演示视频

[YouTube 演示](https://www.youtube.com/watch?v=fVeUWu2Cvk0)

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

## 构建和分发

### 开发构建

```bash
npm run build
npm run build:web
npm run electron
```

### 生产构建

```bash
npm run electron:build
```

构建产物将输出到 `dist-electron/` 目录。

## 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 许可证

MIT License

## 相关项目

- [HyperChat](https://github.com/BigSweetPotatoStudio/HyperChat) - AI 聊天客户端
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 官方文档
