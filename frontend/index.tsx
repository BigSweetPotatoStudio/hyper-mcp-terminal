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
import { io } from "socket.io-client";
const TextArea = Input.TextArea;

moment.locale('zh-cn');
const socket = io("http://localhost:3000", {
    path: "/bash/"
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

        var term = new Terminal();
        term.open(document.getElementById('terminal'));

        socket.on("shell", (data) => {
            console.log(new TextDecoder('utf-8').decode(data));
            // result += data + '\n';
            setResult(new TextDecoder('utf-8').decode(data))
            term.write(new Uint8Array(data))
        });
    }, [])
    return (
        <ConfigProvider locale={zhCN}>
            <div id="terminal">

            </div>
            <pre >
                {result}
            </pre>
            <TextArea value={inputText} onChange={(e) => {
                setInputText(e.target.value);
            }}></TextArea>
            <button onClick={() => {
                socket.emit("shell", inputText + '\n');
            }}>submit</button>
        </ConfigProvider>
    );
};


const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
