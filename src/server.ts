import { Shell } from "./shell";
import express from "express";
import path from "path";
import { Server } from "socket.io";
import { options } from "./commander";

import { fileURLToPath } from "url";
import os from "os";
// 导入 MCP 服务器实例和终端创建函数
import { server, createTerminalSession, globalTerminalMap, type Context } from "./index.mjs";

// 为 ES 模块创建 __dirname 等效物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(options);

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

io.on("connect", (socket) => {
  console.log("connected");

  // 创建新的终端会话
  const terminalID = createTerminalSession(socket.id);
  const context = globalTerminalMap.get(terminalID);

  if (context) {
    context.terminal.onData((data: string) => {
      // logger.info(data);
      socket.emit("shell", data);
    });

    socket.on("shell", (data) => {
      // logger.info(data);
      context.terminal.write(data);
    });

    socket.on("disconnect", function () {
      console.log("user disconnected");
      context.terminal.kill();
      globalTerminalMap.delete(terminalID);
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

// 统一使用3000端口
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`MCP HTTP endpoint: http://localhost:${PORT}/mcp`);
});
