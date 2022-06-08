import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ConfigProvider, DatePicker, message, Input } from 'antd';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';
import 'xterm/css/xterm.css'
import './index.css';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from "socket.io-client";
import querystring from 'querystring-es3'
const TextArea = Input.TextArea;

moment.locale('zh-cn');
const socket = io(document.location.origin, {
    path: "/bash/",
    auth: {
        passwd: (querystring.parse(window.location.search.slice(1)).passwd || '')
    }
});
socket.on("connect", function () {
    console.log("connected");
    // socket.emit("shell", 'ls\n');
    // socket.emit("shell", 'ls -l\n');
})
const App = () => {
    let [result, setResult] = useState('');
    const [inputText, setInputText] = useState('ls');
    useEffect(function () {
        let dom = document.getElementById('terminal')
        var term = new Terminal();
        term.open(dom);
        dom.style.width = window.innerWidth + "px";
        dom.style.height = window.innerHeight + "px";
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddon.fit();
        term.onData(function (data) {
            socket.emit("shell", data);
        })
        // term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
        socket.on("shell", (data) => {
            // console.log(new TextDecoder('utf-8').decode(data));
            // result += data + '\n';
            // setResult(new TextDecoder('utf-8').decode(data))
            term.write(new Uint8Array(data))
        });
        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    }, [])
    return (
        <ConfigProvider locale={zhCN}>
            <div id="terminal">

            </div>

            {/* <TextArea value={inputText} onChange={(e) => {
                setInputText(e.target.value);
            }}></TextArea>
            <button onClick={() => {
                socket.emit("shell", inputText + '\n');
            }}>submit</button> */}
        </ConfigProvider>
    );
};


const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
