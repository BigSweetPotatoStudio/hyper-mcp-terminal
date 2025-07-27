import { Shell } from "./shell";
import koa from "koa";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { options } from "./commander";
import serve from "koa-static";
const app = new koa();
import { fileURLToPath } from "url";
import os from "os";

// 为 ES 模块创建 __dirname 等效物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(options);

// console.log(path.resolve(__dirname, '../build'));


app.use(serve(path.resolve(__dirname, "../build")));

const httpServer = createServer(app.callback());
const io = new Server(httpServer, {
  path: "/bash/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

import log4js from "log4js";
import dayjs from "dayjs";
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
  const shell = new Shell();
  shell.onData((data) => {
    // logger.info(data);
    socket.emit("shell", data);
  });
  socket.on("shell", (data) => {
    // logger.info(data);
    shell.write(data);
  });
  socket.on("disconnect", function () {
    console.log("user disconnected");
    shell.kill();
  });
});

httpServer.listen(parseInt(options.port));
