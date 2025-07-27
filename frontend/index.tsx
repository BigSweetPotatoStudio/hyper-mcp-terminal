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

// Electron 环境检测和 socket 连接配置
const isElectron = !!(window as any).electronAPI;
const socketUrl = isElectron ? 'http://localhost:3000' : document.location.origin;

const socket = io(socketUrl, {
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
          <div className="p-5">
            <Alert
              message="应用程序错误"
              description={`应用程序遇到了一个错误: ${this.state.error?.message || '未知错误'}`}
              type="error"
              showIcon
              action={
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-500 hover:bg-red-600 text-white border-none px-2 py-1 rounded cursor-pointer"
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
  const [appInfo, setAppInfo] = useState<{name?: string, version?: string}>({});

  // Electron 应用信息获取
  useEffect(() => {
    if (isElectron && (window as any).electronAPI) {
      Promise.all([
        (window as any).electronAPI.getAppName(),
        (window as any).electronAPI.getAppVersion()
      ]).then(([name, version]) => {
        setAppInfo({ name, version });
        document.title = `${name} v${version}`;
      }).catch(err => {
        console.error('获取应用信息失败:', err);
      });
    }
  }, []);

  useEffect(function () {
    try {
      let dom = document.getElementById("terminal");
      if (!dom) {
        setError("终端容器元素未找到");
        setLoading(false);
        return;
      }

      var term = new Terminal({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        cursorBlink: true,
        allowTransparency: false,
        theme: {
          background: '#000000'
        }
      });
      
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(dom);
      
      // 延迟调用 fit() 确保 DOM 完全渲染
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
      
      window.onresize = () => {
        fitAddon.fit();
      };

      term.onData(function (data) {
        // 直接发送数据，socket.io 会处理连接状态
        socket.emit("shell", data);
      });

      // 添加调试信息
      console.log("设置 socket 监听器");

      socket.on("connect", function () {
        console.log("Socket.IO 连接成功");
        setConnected(true);
        setLoading(false);
        setError(null);
        // 连接成功后再次调用 fit() 确保尺寸正确
        setTimeout(() => {
          fitAddon.fit();
        }, 200);
      });

      socket.on("shell", (data) => {
        term.write(data);
      });

      socket.on("disconnect", function () {
        console.log("Socket.IO 连接断开");
        setConnected(false);
        setError("连接已断开");
      });

      socket.on("connect_error", function (error) {
        console.error("Socket.IO 连接错误:", error);
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
  }, []);
  return (
    <ConfigProvider locale={zhCN}>
      <div className="terminal-container flex flex-col h-screen">
        {loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <Spin size="large" tip="正在连接终端..." />
          </div>
        )}
        
        {error && (
          <Alert
            message="终端连接错误"
            description={error}
            type="error"
            showIcon
            className="absolute top-2.5 left-2.5 right-2.5 z-50"
            action={
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white border-none px-2 py-1 rounded cursor-pointer"
              >
                刷新页面
              </button>
            }
          />
        )}
        
        {!connected && !loading && !error && (
          <Alert
            message="连接状态"
            description="终端连接已断开，请检查网络连接"
            type="warning"
            showIcon
            className="absolute top-2.5 left-2.5 right-2.5 z-50"
          />
        )}
        
        <div 
          id="terminal" 
          className="terminal-wrapper flex-1"
        ></div>
        
        {/* Electron 状态栏 */}
        {isElectron && (
          <div className="flex justify-between items-center px-2 py-1 bg-gray-800 text-gray-300 text-xs border-t border-gray-600">
            <div className="flex items-center space-x-4">
              <span className={`flex items-center ${connected ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {connected ? '已连接' : '未连接'}
              </span>
              <span>WebSocket: {socketUrl}</span>
            </div>
            <div className="flex items-center space-x-4">
              {appInfo.name && <span>{appInfo.name}</span>}
              {appInfo.version && <span>v{appInfo.version}</span>}
              <span>Electron</span>
            </div>
          </div>
        )}
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
