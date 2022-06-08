import { Shell } from "./shell";
import koa from 'koa';
import { createServer } from "http";
import { Server } from "socket.io";
import { options } from "./commander";
const serve = require('koa-static');
const app = new koa();
console.log(options);


// app.use(ctx => {
//     ctx.body = 'Hello Koa';
// });
app.use(serve('./build'));

const httpServer = createServer(app.callback());
const io = new Server(httpServer, {
    path: '/bash/',
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
io.use((socket, next) => {
    // console.log(socket.handshake.auth);
    if (socket.handshake.auth.passwd == options.passwd) {
        next();
    } else {
        console.log('验证失败: ', socket.handshake.auth);
    }
});
io.on("connect", (socket) => {
    console.log('connect');
    const shell = new Shell();
    shell.onData((data) => {
        socket.emit('shell', data);
    })
    socket.on('shell', (data) => {
        shell.write(data);
    })
    socket.on('disconnect', function () {
        console.log('user disconnected');
        shell.kill();
    });
});

httpServer.listen(parseInt(options.port));