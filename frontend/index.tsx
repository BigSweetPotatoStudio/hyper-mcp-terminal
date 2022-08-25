import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ConfigProvider, DatePicker, message, Input, Divider, List, Typography } from 'antd';
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
const Item = List.Item;
import { PlusSquareOutlined } from '@ant-design/icons';


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
const cmds = [

]
const { Search } = Input;

function concatenate(...arrays) {

    let totalLen = 0;

    for (let arr of arrays)

        totalLen += arr.byteLength;

    let res = new Uint8Array(totalLen)

    let offset = 0

    for (let arr of arrays) {

        let uint8Arr = new Uint8Array(arr)

        res.set(uint8Arr, offset)

        offset += arr.byteLength

    }

    return res.buffer

}


let ResulData = new ArrayBuffer(0);
// function check() {
//     console.log(ResulData);
//     console.log(new TextDecoder('utf-8').decode(ResulData));
//     setTimeout(check, 200);
// }
// check();
const App = () => {
    let [result, setResult] = useState('');
    const [inputText, setInputText] = useState('ls');
    useEffect(function () {
        let dom = document.getElementById('terminal')!
        var term = new Terminal();
        term.open(dom);
        // dom.style.width = window.innerWidth + "px";
        // dom.style.height = window.innerHeight + "px";
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddon.fit();
        window.onresize = () => {
            fitAddon.fit();
        }

        term.onData(function (data) {
            ResulData = new ArrayBuffer(0);
            socket.emit("shell", data);
        })
        // term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
        socket.on("shell", (data) => {
            // console.log(data);
            // console.log(new TextDecoder('utf-8').decode(data));
            // result += data + '\n';
            // setResult(new TextDecoder('utf-8').decode(data))
            ResulData = concatenate(ResulData, data);
            term.write(new Uint8Array(data))
        });
        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    }, [])
    return (
        <ConfigProvider locale={zhCN}>
            <div className="container">
                <div id="terminal">

                </div>
                <div id="cmds">
                    <List
                        className='list'
                        size="small"
                        bordered
                        dataSource={cmds}
                        renderItem={item => <Item>
                            <Button onClick={() => {
                                if (typeof item.value === 'string') {
                                    ResulData = new ArrayBuffer(0);
                                    socket.emit("shell", item.value);
                                } else if (typeof item.value === 'function') {
                                    item.value(function (cmd) {
                                        socket.emit("shell", cmd);
                                        ResulData = new ArrayBuffer(0);
                                    }, function (reg, timer = 5000) {
                                        return new Promise((resolve, reject) => {
                                            let t: any;
                                            let timeout = false;
                                            let t2 = setTimeout(() => {
                                                timeout = true;
                                                console.log('超时');
                                            }, timer)
                                            function check() {
                                                if (timeout) {
                                                    message.error('超时');
                                                    reject(new Error('超时'))
                                                    return;
                                                }
                                                // console.log(ResulData);
                                                let text = new TextDecoder('utf-8').decode(ResulData);
                                                // console.log(text);

                                                if (text.match(reg)) {
                                                    resolve(1);
                                                    clearTimeout(t2);
                                                    clearTimeout(t);
                                                    return;
                                                } else {
                                                    t = setTimeout(check, 200);
                                                }
                                            }
                                            check();
                                        })
                                    });
                                }

                            }} type="dashed" block>
                                {item.label}
                            </Button>
                        </Item>}
                    />
                    {/* <div>
                        <Input addonAfter={<PlusSquareOutlined />} defaultValue="mysite" />
                    </div> */}
                </div>

            </div>
            {/* <TextArea value={inputText} onChange={(e) => {
                setInputText(e.target.value);
            }}></TextArea>
            <button onClick={() => {
                socket.emit("shell", inputText + '\n');
            }}>submit</button> */}
        </ConfigProvider >
    );
};


const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
