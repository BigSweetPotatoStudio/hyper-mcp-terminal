import React, { useState, useEffect, Component, ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import {
  ConfigProvider,
  Spin,
  Alert,
} from "antd";
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "@xterm/xterm/css/xterm.css";
import "./index.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

import { io } from "socket.io-client";

dayjs.locale("zh-cn");
const socket = io(document.location.origin, {
  path: "/bash/",
});
// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('应用程序错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ConfigProvider locale={zhCN}>
          <div style={{ padding: '20px' }}>
            <Alert
              message="应用程序错误"
              description={`应用程序遇到了一个错误: ${this.state.error?.message || '未知错误'}`}
              type="error"
              showIcon
              action={
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    background: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  刷新页面
                </button>
              }
            />
          </div>
        </ConfigProvider>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(function () {
    // 确保 DOM 元素已经渲染
    const initTerminal = () => {
      try {
        let dom = document.getElementById("terminal");
        if (!dom) {
          // 如果元素还没有渲染，稍后重试
          setTimeout(initTerminal, 100);
          return;
        }

      var term = new Terminal({
        cols: 80,
        rows: 30,
      });
      
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(dom);
      fitAddon.fit();
      
      window.onresize = () => {
        fitAddon.fit();
      };

      term.onData(function (data) {
        if (connected) {
          socket.emit("shell", data);
        }
      });

      socket.on("connect", function () {
        console.log("连接成功");
        setConnected(true);
        setLoading(false);
        setError(null);
      });

      socket.on("shell", (data) => {
        term.write(data);
      });

      socket.on("disconnect", function () {
        console.log("连接断开");
        setConnected(false);
        setError("连接已断开");
      });

      socket.on("connect_error", function (error) {
        console.error("连接错误:", error);
        setError("无法连接到服务器");
        setLoading(false);
      });

      return () => {
        socket.off("connect");
        socket.off("shell");
        socket.off("disconnect");
        socket.off("connect_error");
        term.dispose();
      };
      } catch (err) {
        console.error("初始化终端失败:", err);
        setError("初始化终端失败");
        setLoading(false);
      }
    };
    
    // 开始初始化
    initTerminal();
  }, []);
  if (loading) {
    return (
      <ConfigProvider locale={zhCN}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" tip="正在连接终端..." />
        </div>
      </ConfigProvider>
    );
  }

  if (error) {
    return (
      <ConfigProvider locale={zhCN}>
        <div className="container" style={{ padding: '20px' }}>
          <Alert
            message="终端连接错误"
            description={error}
            type="error"
            showIcon
            action={
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                刷新页面
              </button>
            }
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <div className="container">
        {!connected && (
          <Alert
            message="连接状态"
            description="终端连接已断开，请检查网络连接"
            type="warning"
            showIcon
            style={{ marginBottom: '10px' }}
          />
        )}
        <div id="terminal"></div>
      </div>
    </ConfigProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
