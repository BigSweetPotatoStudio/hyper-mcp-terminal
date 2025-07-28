#!/usr/bin/env node
import { z } from "zod";

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import os from "os";
import strip from "strip-ansi";
import * as pty from "node-pty";
import pack from "../package.json" assert { type: "json" };
import { appDataManager } from "./app-data.js";

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
  // Bash/Zsh 常见格式
  /[\$#]\s*$/,                          // 简单的 $ 或 # 结尾
  /\w+@\w+.*[\$#]\s*$/,                 // user@host:path$ 格式
  /➜.*[\$#]\s*$/,                       // zsh arrow prompt
  /.*:.*[\$#]\s*$/,                     // path:$ 格式
  
  // Windows 命令行
  /[A-Z]:\\.*>\s*$/,                    // C:\path> 格式  
  /PS\s+[A-Z]:\\.*>\s*$/,               // PowerShell PS C:\path>
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
  const lastLine = lines[lines.length - 1] || '';
  
  // 移除ANSI颜色代码和控制字符
  const cleanLine = lastLine.replace(/\x1b\[[0-9;]*[mGKH]/g, '').trim();
  
  // 检查最后一行是否匹配提示符模式
  const isPrompt = promptPatterns.some(pattern => pattern.test(cleanLine));
  
  if (isPrompt) {
    console.log(`Command ended - detected prompt: "${cleanLine}"`);
  }
  
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
    cwd: process.env.HOME || process.cwd(),
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
    const normalizedData = (data);
    context.stdout += normalizedData;
    context.commandOutput += normalizedData;
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
    console.log(`Received command: "${command}"`);
    // 自动使用最近活跃的终端
    const terminalID = lastTerminalID;
    let c = terminalMap.get(terminalID);
    
    if (c == null) {
      throw new Error("No active terminal found. Please open a terminal first using the web interface at http://localhost:13000");
    }
    
    console.log(`Executing command: "${command}" on active terminal ${terminalID}`);
    
    const startTime = Date.now();
    c.commandOutput = "";
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
    
    return {
      content: [
        { type: "text", text: result },
      ],
    };
  }
);

