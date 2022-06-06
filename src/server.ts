import { shell } from "./shell";
import { createServer } from "http";
import { Server } from "socket.io";


const httpServer = createServer();
const io = new Server(httpServer, {
    path: '/bash/',
    cors: {
        origin: "http://localhost:9000",
        methods: ["GET", "POST"]
    }
});
io.on("connect", (socket) => {
    console.log('connect');
    socket.on('shell', (data) => {
        shell.write(data);
    })
    shell.onData((data) => {  
        socket.emit('shell', data);
    })
});

io.listen(3000);