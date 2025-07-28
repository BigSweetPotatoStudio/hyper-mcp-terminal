import React, { useState, useEffect, Component, ErrorInfo, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  ConfigProvider,
  Spin,
  Alert,
  Tabs,
  Button,
} from "antd";
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
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
const socketUrl = isElectron ? 'http://localhost:13000' : document.location.origin;
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

// 终端会话接口
interface TerminalSession {
  id: string;
  title: string;
  terminal: Terminal;
  socket: any;
  fitAddon: FitAddon;
  connected: boolean;
  loading: boolean;
  error: string | null;
}

const App = () => {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [appInfo, setAppInfo] = useState<{name?: string, version?: string}>({});
  const sessionIdCounter = useRef(0);

  // 创建新的终端会话
  const createNewSession = useCallback(() => {
    const sessionId = `terminal-${++sessionIdCounter.current}`;
    const title = `终端 ${sessionIdCounter.current}`;
    
    const socket = io(socketUrl, {
      path: "/bash/",
      query: { sessionId }
    });

    const terminal = new Terminal({
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
      allowTransparency: false,
      theme: {
        background: '#000000'
      }
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    const session: TerminalSession = {
      id: sessionId,
      title,
      terminal,
      socket,
      fitAddon,
      connected: false,
      loading: true,
      error: null
    };

    // 设置终端事件监听
    terminal.onData((data) => {
      socket.emit("shell", data);
    });

    // 设置Socket事件监听
    socket.on("connect", () => {
      console.log(`Session ${sessionId} connected`);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, connected: true, loading: false, error: null } : s
      ));
    });

    socket.on("shell", (data) => {
      terminal.write(data);
    });

    socket.on("disconnect", () => {
      console.log(`Session ${sessionId} disconnected`);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, connected: false, error: '连接已断开' } : s
      ));
    });

    socket.on("connect_error", (error) => {
      console.error(`Session ${sessionId} connection error:`, error);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, error: '无法连接到服务器', loading: false } : s
      ));
    });

    setSessions(prev => [...prev, session]);
    setActiveTabKey(sessionId);
    
    // 通知后端这是新的活跃终端（延迟发送，确保连接已建立）
    setTimeout(() => {
      socket.emit('set-active-terminal', { sessionId });
    }, 100);
    
    return sessionId;
  }, []);

  // 关闭终端会话
  const closeSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.socket.disconnect();
      session.terminal.dispose();
      
      setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== sessionId);
        // 如果关闭的是当前活跃标签，切换到其他标签
        if (activeTabKey === sessionId && newSessions.length > 0) {
          setActiveTabKey(newSessions[newSessions.length - 1].id);
        } else if (newSessions.length === 0) {
          setActiveTabKey('');
        }
        return newSessions;
      });
    }
  }, [sessions, activeTabKey]);

  // 初始化第一个终端会话
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, [createNewSession, sessions.length]);

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

  // 终端尺寸调整
  useEffect(() => {
    const handleResize = () => {
      const activeSession = sessions.find(s => s.id === activeTabKey);
      if (activeSession) {
        setTimeout(() => {
          activeSession.fitAddon.fit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sessions, activeTabKey]);

  // 渲染终端到DOM
  useEffect(() => {
    const activeSession = sessions.find(s => s.id === activeTabKey);
    if (activeSession) {
      const terminalElement = document.getElementById(`terminal-${activeTabKey}`);
      if (terminalElement && !terminalElement.hasChildNodes()) {
        activeSession.terminal.open(terminalElement);
        setTimeout(() => {
          activeSession.fitAddon.fit();
        }, 100);
      }
    }
  }, [sessions, activeTabKey]);

  // 获取当前活跃会话
  const activeSession = sessions.find(s => s.id === activeTabKey);
  return (
    <ConfigProvider locale={zhCN}>
      <div className="terminal-container flex flex-col h-screen">
        {/* 标签页头部 */}
        <Tabs
          type="editable-card"
          activeKey={activeTabKey}
          onChange={(newActiveKey) => {
            setActiveTabKey(newActiveKey);
            // 通知后端活跃标签页变更
            const activeSession = sessions.find(s => s.id === newActiveKey);
            if (activeSession) {
              activeSession.socket.emit('set-active-terminal', { sessionId: newActiveKey });
            }
          }}
          onEdit={(targetKey, action) => {
            if (action === 'add') {
              createNewSession();
            } else if (action === 'remove' && typeof targetKey === 'string') {
              closeSession(targetKey);
            }
          }}
          items={sessions.map(session => ({
            key: session.id,
            label: (
              <span className="flex items-center gap-1">
                {session.title}
                {session.loading && <Spin size="small" />}
                {!session.connected && !session.loading && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" title="连接断开" />
                )}
                {session.connected && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="已连接" />
                )}
              </span>
            ),
            children: (
              <div className="terminal-tab-content flex-1 relative">
                {/* 状态提示 */}
                {session.loading && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                    <Spin size="large" tip="正在连接终端..." />
                  </div>
                )}
                
                {session.error && (
                  <Alert
                    message="终端连接错误"
                    description={session.error}
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
                
                {!session.connected && !session.loading && !session.error && (
                  <Alert
                    message="连接状态"
                    description="终端连接已断开，请检查网络连接"
                    type="warning"
                    showIcon
                    className="absolute top-2.5 left-2.5 right-2.5 z-50"
                  />
                )}
                
                {/* 终端容器 */}
                <div 
                  id={`terminal-${session.id}`}
                  className="terminal-wrapper h-full w-full"
                  style={{ height: 'calc(100vh - 46px)' }}
                />
              </div>
            )
          }))}
          className="h-full"
          tabBarStyle={{ margin: 0, backgroundColor: '#f5f5f5' }}
        />
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
