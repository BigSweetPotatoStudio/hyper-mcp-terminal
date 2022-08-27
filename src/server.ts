import { Shell } from "./shell";
import koa from 'koa';
import path from 'path';
import { createServer } from "http";
import { Server } from "socket.io";
import { options } from "./commander";
const serve = require('koa-static');
const app = new koa();
const auth = require('koa-basic-auth');


console.log(options);


// console.log(path.resolve(__dirname, '../build'));

// custom 401 handling
app.use(async (ctx, next) => {
    console.log(ctx);

    try {
        await next();
        if (ctx.request.url == '/' && ctx.response.status == 200) {
            // ctx.response.append('Set-Cookie', 'token=bar; Path=/; HttpOnly');
            console.log("success");
            ctx.redirect('?passwd=' + options.passwd)
        }
    } catch (err) {
        if (401 == err.status) {
            ctx.status = 401;
            ctx.set('WWW-Authenticate', 'Basic');
            ctx.body = 'cant haz that';
        } else {
            throw err;
        }
    }
});

// require auth
app.use(auth({ name: options.username, pass: options.passwd }));

app.use(serve(path.resolve(__dirname, '../build')));

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