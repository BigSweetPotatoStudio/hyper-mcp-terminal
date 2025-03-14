import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  ConfigProvider,
  DatePicker,
  message,
  Input,
  Divider,
  List,
  Typography,
} from "antd";
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from "antd/lib/locale/zh_CN";
import moment from "moment";
import "moment/locale/zh-cn";
import "antd/dist/antd.css";
import "@xterm/xterm/css/xterm.css";
import "./index.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

import { io } from "socket.io-client";
import querystring from "querystring-es3";
const TextArea = Input.TextArea;
const Item = List.Item;
import { PlusSquareOutlined } from "@ant-design/icons";

moment.locale("zh-cn");
const socket = io(document.location.origin, {
  path: "/bash/",
  auth: {
    passwd: querystring.parse(window.location.search.slice(1)).passwd || "",
  },
});
socket.on("connect", function () {
  console.log("connected");
  // socket.emit("shell", 'ls\n');
  // socket.emit("shell", 'ls -l\n');
});

const { Search } = Input;

function concatenate(...arrays) {
  let totalLen = 0;

  for (let arr of arrays) totalLen += arr.byteLength;

  let res = new Uint8Array(totalLen);

  let offset = 0;

  for (let arr of arrays) {
    let uint8Arr = new Uint8Array(arr);

    res.set(uint8Arr, offset);

    offset += arr.byteLength;
  }

  return res.buffer;
}
const origin_cmds = [];

let ResulData = new ArrayBuffer(0);

function _translateBufferLineToStringWithWrap(
  lineIndex: number,
  trimRight: boolean,
  terminal: Terminal
): [string, number] {
  let lineString = "";
  let lineWrapsToNext: boolean;
  let prevLinesToWrap: boolean;

  do {
    const line = terminal.buffer.active.getLine(lineIndex);
    if (!line) {
      break;
    }

    if (line.isWrapped) {
      lineIndex--;
    }

    prevLinesToWrap = line.isWrapped;
  } while (prevLinesToWrap);

  const startLineIndex = lineIndex;

  do {
    const nextLine = terminal.buffer.active.getLine(lineIndex + 1);
    lineWrapsToNext = nextLine ? nextLine.isWrapped : false;
    const line = terminal.buffer.active.getLine(lineIndex);
    if (!line) {
      break;
    }
    lineString += line
      .translateToString(!lineWrapsToNext && trimRight)
      .substring(0, terminal.cols);
    lineIndex++;
  } while (lineWrapsToNext);

  return [lineString, startLineIndex];
}

const App = () => {
  let [result, setResult] = useState("");
  let [cmds, setCmds] = useState(origin_cmds);
  const [inputText, setInputText] = useState("");
  useEffect(function () {
    let dom = document.getElementById("terminal")!;
    var term = new Terminal({
      cols: 80,
      rows: 30,
    });
    // term.open(document.getElementById('terminal'));
    // term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
    // return;
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(dom);
    fitAddon.fit();
    window.onresize = () => {
      fitAddon.fit();
    };

    // setInterval(() => {
    //     console.log(_translateBufferLineToStringWithWrap(-1, false,term));
    // }, 10000)

    term.onData(function (data) {
      socket.emit("shell", data);
    });

    socket.on("shell", (data) => {
      term.write(data);
    });
    socket.on("disconnect", function () {
      console.log("user disconnected");
    });
  }, []);
  return (
    <ConfigProvider locale={zhCN}>
      <div className="container">
        <div id="terminal"></div>
        {/* <div id="cmds">
          <List<any>
            className="list"
            size="small"
            bordered
            dataSource={cmds}
            renderItem={(item) => (
              <Item>
                <Button
                  onClick={() => {
                    if (typeof item.value === "string") {
                      ResulData = new ArrayBuffer(0);
                      socket.emit("shell", item.value);
                    } else if (typeof item.value === "function") {
                      item.value(
                        function (cmd) {
                          socket.emit("shell", cmd);
                          ResulData = new ArrayBuffer(0);
                        },
                        function (reg, timer = 5000) {
                          return new Promise((resolve, reject) => {
                            let t: any;
                            let timeout = false;
                            let t2 = setTimeout(() => {
                              timeout = true;
                              console.log("超时");
                            }, timer);
                            function check() {
                              if (timeout) {
                                message.error("超时");
                                reject(new Error("超时"));
                                return;
                              }
                              // console.log(ResulData);
                              let text = new TextDecoder("utf-8").decode(
                                ResulData
                              );
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
                          });
                        }
                      );
                    }
                  }}
                  type="dashed"
                  block
                >
                  {item.label}
                </Button>
              </Item>
            )}
          />
          <TextArea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
            }}
          ></TextArea>
          <Button
            style={{ width: "100%" }}
            onClick={() => {
              let cmd = inputText + "\n";
              socket.emit("shell", cmd);
              if (inputText.trim() == "") {
                return;
              }
              cmds.push({
                label: cmd,
                value: cmd,
              });
              setCmds(cmds.concat([]));
            }}
          >
            submit
          </Button>
        </div> */}
      </div>
    </ConfigProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
