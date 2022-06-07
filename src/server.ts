import { Shell } from "./shell";
import koa from 'koa';
import { createServer } from "http";
import { Server } from "socket.io";
const serve = require('koa-static');
const app = new koa();


// app.use(ctx => {
//     ctx.body = 'Hello Koa';
// });
app.use(serve('./build'));

const httpServer = createServer(app.callback());
const io = new Server(httpServer, {
    path: '/bash/',
    cors: {
        origin: "http://localhost:9000",
        methods: ["GET", "POST"]
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

});

httpServer.listen(3000);