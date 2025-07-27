// Electron 环境下的简化服务器启动脚本
const express = require('express');
const path = require('path');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { spawn } = require('child_process');
const os = require('os');

console.log('Starting Electron backend server...');

// console.log(path.resolve(__dirname, '../build'));
const app = express();

app.use(express.json());
app.use(express.static(path.resolve(__dirname, "./build")));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/bash/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 简化的终端会话管理
const terminalSessions = new Map();

io.on("connect", (socket) => {
  console.log("connected");

  // 创建新的终端进程
  const terminal = spawn(os.platform() === 'win32' ? 'cmd.exe' : 'bash', [], {
    stdio: 'pipe',
    env: process.env,
    cwd: os.homedir()
  });

  terminalSessions.set(socket.id, terminal);

  terminal.stdout.on('data', (data) => {
    socket.emit("shell", data.toString());
  });

  terminal.stderr.on('data', (data) => {
    socket.emit("shell", data.toString());
  });

  socket.on("shell", (data) => {
    if (terminal.stdin.writable) {
      terminal.stdin.write(data);
    }
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
    const terminal = terminalSessions.get(socket.id);
    if (terminal) {
      terminal.kill();
      terminalSessions.delete(socket.id);
    }
  });

  terminal.on('exit', () => {
    console.log('Terminal process exited');
    socket.disconnect();
    terminalSessions.delete(socket.id);
  });
});

// 统一使用3000端口
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Electron server running on http://localhost:${PORT}`);
});