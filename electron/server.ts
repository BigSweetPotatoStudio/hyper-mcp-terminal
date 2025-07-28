
import express from "express";
import path from "path";
import { Server } from "socket.io";
import { appDataManager } from "./app-data.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { fileURLToPath } from "url";
import os from "os";
// 导入 MCP 服务器实例和终端创建函数
import { createTerminalSession, globalTerminalMap, server, setActiveTerminalID, type Context } from "./mcpTool.mjs";

// 为 ES 模块创建 __dirname 等效物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(options);

// console.log(path.resolve(__dirname, '../build'));
const app = express();

app.use(express.json());
app.use(express.static(path.resolve(__dirname, "../build")));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/bash/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

import log4js from "log4js";
import dayjs from "dayjs";
import { createServer } from "http";
const tempDir = os.tmpdir();
const logFilePath = path.join(tempDir, `hyper-mcp-terminal-${dayjs().format("YYYY-MM-DD")}.log`);
log4js.configure({
  appenders: {
    log: {
      type: "file",
      filename: logFilePath,
    },
  },
  categories: { default: { appenders: ["log"], level: "trace" } },
});
console.log(`Log file will be created at: ${logFilePath}`);
const logger = log4js.getLogger();

// 存储socket到会话的映射
const socketSessionMap = new Map<string, number>();

io.on("connect", (socket) => {
  console.log("Socket connected:", socket.id);

  // 获取会话ID（从查询参数中）
  const sessionId = socket.handshake.query.sessionId as string || socket.id;
  console.log("Session ID:", sessionId);

  // 创建新的终端会话（函数返回number类型的ID）
  const terminalID = createTerminalSession();
  const context = globalTerminalMap.get(terminalID);

  // 记录socket和会话的映射关系
  socketSessionMap.set(socket.id, terminalID);

  if (context) {
    context.terminal.onData((data: string) => {
      // logger.info(data);
      socket.emit("shell", data);
    });

    socket.on("shell", (data) => {
      // logger.info(data);
      context.terminal.write(data);
    });

    // 监听活跃终端切换事件
    socket.on("set-active-terminal", ({ sessionId }) => {
      console.log(`Setting active terminal to session: ${sessionId}, terminalID: ${terminalID}`);
      // 更新全局的 lastTerminalID 为当前活跃的终端ID
      setActiveTerminalID(terminalID);
    });

    socket.on("disconnect", function () {
      console.log("Socket disconnected:", socket.id);
      const terminalID = socketSessionMap.get(socket.id);
      if (terminalID) {
        const context = globalTerminalMap.get(terminalID);
        if (context) {
          context.terminal.kill();
          globalTerminalMap.delete(terminalID);
        }
        socketSessionMap.delete(socket.id);
      }
    });
  }
});



app.post("/mcp", async (req, res) => {
  try {
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error("MCP request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// 检查端口是否可用的辅助函数
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const testServer = createServer();
    testServer.listen(port, () => {
      testServer.close(() => resolve(true));
    }).on('error', () => resolve(false));
  });
}

// 查找可用端口的函数
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`无法找到可用端口（尝试了 ${startPort} 到 ${startPort + maxAttempts - 1}）`);
}

// 导出启动服务器的函数
export async function startServer(tryAlternativePort: boolean = false) {
  return new Promise<void>(async (resolve, reject) => {
    // 从应用数据获取端口设置
    const serverSettings = appDataManager.getSetting('server');
    let PORT = serverSettings.port;

    // 如果允许尝试其他端口，先检查原端口是否可用
    if (tryAlternativePort) {
      try {
        PORT = await findAvailablePort(PORT);
        if (PORT !== serverSettings.port) {
          console.log(`原端口 ${serverSettings.port} 被占用，改为使用端口 ${PORT}`);
        }
      } catch (error) {
        reject(new Error(`无法找到可用端口：${error instanceof Error ? error.message : String(error)}`));
        return;
      }
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`MCP HTTP endpoint: http://localhost:${PORT}/mcp`);
      resolve();
    }).on('error', (error: any) => {
      console.error('服务器启动失败:', error);
      
      // 增强错误信息
      if (error.code === 'EADDRINUSE') {
        error.message = `端口 ${PORT} 已被其他程序占用`;
      }
      
      reject(error);
    });
  });
}

// 导出停止服务器的函数
export async function stopServer() {
  return new Promise<void>((resolve) => {
    if (httpServer.listening) {
      console.log('正在关闭服务器...');
      
      // 关闭所有socket连接
      io.disconnectSockets(true);
      
      // 清理所有终端会话
      for (const [terminalID, context] of globalTerminalMap) {
        context.terminal.kill();
        globalTerminalMap.delete(terminalID);
      }
      socketSessionMap.clear();
      
      // 关闭HTTP服务器
      httpServer.close(() => {
        console.log('服务器已关闭');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// 如果直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
