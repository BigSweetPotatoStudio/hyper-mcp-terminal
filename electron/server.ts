
import express from "express";
import path from "path";
import { Server } from "socket.io";
// import { options } from "./commander.js";

import { fileURLToPath } from "url";
import os from "os";
// 导入 MCP 服务器实例和终端创建函数
import { createTerminalSession, globalTerminalMap, setActiveTerminalID, type Context } from "./index.mjs";

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



// 添加 MCP HTTP 路由 - 暂时禁用，因为 SDK 版本不兼容
// app.post("/mcp", async (req, res) => {
//   try {
//     // TODO: 更新到新的 MCP SDK API
//     res.status(501).json({ error: "MCP HTTP endpoint not implemented" });
//   } catch (error) {
//     logger.error("MCP request error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// 导出启动服务器的函数
export async function startServer() {
  return new Promise<void>((resolve, reject) => {
    const PORT = 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`MCP HTTP endpoint: http://localhost:${PORT}/mcp`);
      resolve();
    }).on('error', (error) => {
      console.error('服务器启动失败:', error);
      reject(error);
    });
  });
}

// 如果直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
