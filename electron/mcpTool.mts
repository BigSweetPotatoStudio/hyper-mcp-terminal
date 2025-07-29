#!/usr/bin/env node
import { z } from "zod";

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import os from "os";
import fs from "fs";
import path from "path";
import strip from "strip-ansi";
import * as pty from "node-pty";
import pack from "../package.json" assert { type: "json" };
import { appDataManager } from "./app-data.js";

// 安全获取用户主目录
const getSafeHomeDir = (): string => {
  try {
    // 优先使用 Electron 的 app.getPath
    if (process.versions?.electron) {
      const { app } = require('electron');
      return app.getPath('home');
    }
  } catch (error) {
    // Electron 不可用时的备用逻辑
  }

  // 备用方案：使用 os.homedir() 或 process.cwd()
  const homeDir = os.homedir();
  if (homeDir && homeDir !== '/') {
    return homeDir;
  }

  // 最后备用方案
  return process.cwd();
};

// Windows shell 配置
const getShellConfig = () => {
  if (os.platform() === "win32") {
    return {
      shell: "powershell.exe",
      args: ["-NoLogo", "-NoProfile"]  // 减少PowerShell启动输出
    };
  }
  return {
    shell: "bash",
    args: []
  };
};

const { shell, args: shellArgs } = getShellConfig();

// 开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';

// 开发环境日志配置
let logDirectory: string | null = null;
let terminalLogFile: string | null = null;

if (isDevelopment) {
  try {
    // 创建日志目录
    logDirectory = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }

    // 创建以时间戳命名的日志文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    terminalLogFile = path.join(logDirectory, `terminal-data-${timestamp}.log`);

    console.log(`🔧 开发模式已启用，终端数据将记录到: ${terminalLogFile}`);
  } catch (error) {
    console.warn('创建日志目录失败:', error);
  }
}

// 日志写入函数
function logTerminalData(terminalID: number, data: string, formatData: string, type: 'input' | 'output' = 'output') {
  if (!isDevelopment || !terminalLogFile) return;

  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      terminalID,
      type,
      data: formatData,
      rawData: data, // 保存原始数据用于调试
      length: data.length
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(terminalLogFile, logLine, 'utf8');
  } catch (error) {
    console.error('写入日志失败:', error);
  }
}

// 全局终端映射，用于在 Web 界面和 MCP 之间共享终端会话
export const globalTerminalMap = new Map<number, Context>();
export let globalLastTerminalID = 0;

// 更新活跃终端ID的函数
export function setActiveTerminalID(terminalID: number) {
  globalLastTerminalID = terminalID;
  console.log(`Updated active terminal ID to: ${terminalID}`);
}
console.log("start hyper-mcp-terminal!", pack.version);
// Create an MCP server
export const server = new McpServer({
  name: "hyper-mcp-terminal",
  version: pack.version,
});

export type Context = {
  terminal: pty.IPty;
  stdout: string;
  commandOutput: string;
  lastIndex: number;
};

// 使用全局终端映射
const terminalMap = globalTerminalMap;
let lastTerminalID = globalLastTerminalID;

// 基于Shell提示符的结束检测  
// 从应用数据获取终端配置
const getTerminalConfig = () => appDataManager.getSetting('terminal');

// 支持各种Shell的提示符模式
const promptPatterns = [
  // Oh-My-Zsh 主题支持 - 优先匹配，更宽松
  /➜.*$/,                               // 最宽松：任何以 ➜ 开头的行
  /.*git:\([^)]+\).*[✗✓].*$/,              // git 状态提示符（更宽松）
  /.*[%❯►].*$/,                         // 其他 zsh 主题常用符号（更宽松）

  // Bash/Zsh 常见格式
  /[\$#]\s*$/,                          // 简单的 $ 或 # 结尾
  /\w+@\w+.*[\$#]\s*$/,                 // user@host:path$ 格式
  /.*:.*[\$#]\s*$/,                     // path:$ 格式

  // Windows 命令行
  /[A-Z]:\\.*>\s*$/,                    // C:\path> 格式  

  // PowerShell 提示符（各种格式）
  /PS\s+[A-Z]:\\.*>\s*$/,               // PowerShell PS C:\path>
  /PS\s+[A-Z]:[^>]*>\s*$/,              // PowerShell PS C:\Users\username>
  /PS\s+[A-Za-z]:[\\\/][^>]*>\s*$/,     // PowerShell PS C:\path 或 PS c:/path>
  /PS\s+.*>\s*$/,                       // 任何包含 PS 的格式

  // Conda 环境
  /\([^)]+\)\s*PS\s+[A-Z]:\\.*>\s*$/,   // conda环境 (base) PS C:\path>
  /\([^)]+\)\s*[A-Z]:\\.*>\s*$/,        // conda环境 (base) C:\path>

  // Fish shell
  /\w+@\w+.*>\s*$/,                     // user@host path>

  // Conda environments (跨平台)
  /\([^)]+\).*[\$#>]\s*$/,              // (env_name) 前缀的提示符

  // 通用模式 - 更宽松的匹配
  /.*[\$#>]\s*$/,                       // 以 $, #, > 结尾
  /.*[:\]]\s*[\$#>]\s*$/,               // 带路径分隔符的提示符
];

function checkEndByPrompt(output: string): boolean {
  if (!output.trim()) return false;

  const lines = output.split('\n');
  
  // 从最后一行开始向前查找第一个非空行
  let lineToCheck = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i] || '';
    const cleanLine = strip(line).trim();
    
    if (cleanLine) {
      lineToCheck = cleanLine;
      break;
    }
  }
  
  // 如果没有找到非空行，返回 false
  if (!lineToCheck) {
    return false;
  }

  // 启发式过滤：避免把普通命令输出误判为提示符
  // 
  // 真实的Shell提示符通常具有以下特征：
  // 1. 长度相对较短（通常 < 100 字符，极端情况 < 200 字符）
  // 2. 单词数量有限（通常 < 10 个单词，极端情况 < 20 个单词）
  // 
  // 相比之下，普通命令输出可能：
  // - 包含长篇错误信息、帮助文档、日志输出等
  // - 包含大量连续的空格分隔的数据（如 ls -la 输出）
  // - 包含格式化的表格、JSON、XML 等结构化数据
  //
  // 示例场景：
  // ✅ 正常提示符: "➜  HyperChat git:(main) ✗" (35字符, 4个单词)
  // ✅ 复杂提示符: "user@long-hostname:/very/long/path/to/project$ " (50字符, 2个单词)
  // ❌ 误判风险: "error: failed to load config file /very/long/path/... details here" (>100字符)
  // ❌ 误判风险: "file1.txt file2.txt file3.txt ... file20.txt file21.txt" (>20个单词)
  //
  if (lineToCheck.length > 200 || lineToCheck.split(' ').length > 20) {
    console.log(`启发式过滤: 跳过可能的命令输出 (${lineToCheck.length}字符, ${lineToCheck.split(' ').length}个单词)`);
    return false;
  }

  // 检查是否匹配提示符模式
  const isPrompt = promptPatterns.some((pattern, index) => {
    const match = pattern.test(lineToCheck);
    return match;
  });

  return isPrompt;
}

// 创建终端会话的函数，供 Web 界面调用
export function createTerminalSession(): number {
  const terminalID = ++globalLastTerminalID;
  lastTerminalID = globalLastTerminalID;

  const terminal = pty.spawn(shell, shellArgs, {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: getSafeHomeDir(),
    env: process.env,
    // Windows特殊配置
    ...(os.platform() === "win32" ? {
      useConpty: true,  // 使用Windows ConPTY API
      conptyInheritCursor: false
    } : {})
  });

  const context: Context = {
    terminal,
    stdout: "",
    commandOutput: "",
    lastIndex: 0
  };

  terminal.onData((data) => {
    context.stdout += data;
    context.commandOutput += data;

    // 开发环境下记录终端数据到文件
    if (isDevelopment) {
      logTerminalData(terminalID, data, strip(data), 'output');

    }
  });

  globalTerminalMap.set(terminalID, context);
  console.log(`Terminal session created with ID: ${terminalID}`);

  return terminalID;
}

server.tool(
  "execute-command",
  `Execute a command on the currently active terminal.`,
  {
    command: z.string({
      description: "The command to execute",
    }),
  },
  async ({ command }) => {
    // 自动使用最近活跃的终端
    const terminalID = lastTerminalID;
    let c = terminalMap.get(terminalID);

    if (c == null) {
      throw new Error("No active terminal found. Please open a terminal first using the web interface at http://localhost:13000");
    }



    const startTime = Date.now();
    c.commandOutput = "";

    // 开发环境下记录输入的命令
    if (isDevelopment) {
      console.log(`📤 Terminal ${terminalID} 执行命令: "${command}"`);
    }

    c.terminal.write(`${command}\r`);

    // 使用基于提示符的检测，无超时限制
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (checkEndByPrompt(c.commandOutput)) {
        const duration = Date.now() - startTime;
        console.log(`Command "${command}" completed in ${duration}ms`);
        break;
      }
    }

    c.lastIndex = c.stdout.length;
    const terminalConfig = getTerminalConfig();
    const result = strip(c.commandOutput).slice(-terminalConfig.maxOutputTokens);
    console.log(`Executing command: "${command}" on active terminal ${terminalID}`);
    return {
      content: [
        { type: "text", text: result },
      ],
    };
  }
);

