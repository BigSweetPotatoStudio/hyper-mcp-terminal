#!/usr/bin/env node
import { z } from "zod";

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import os from "os";
import fs from "fs";
import uuid from "uuid";
import { execSync } from "child_process";
import strip from "strip-ansi";
import * as pty from "node-pty";
import pack from "../package.json";

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

// 全局终端映射，用于在 Web 界面和 MCP 之间共享终端会话
export const globalTerminalMap = new Map<number, Context>();
export let globalLastTerminalID = 0;
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

// const promptPattern = /\$\s*$|\>\s*$|#\s*$/m;
const checkCount = parseInt(process.env.Terminal_End_CheckCount || '15');
const maxToken = parseInt(process.env.Terminal_Output_MaxToken || '10000');
const arr: string[] = [];
function checkEnd(str: string): boolean {
  if (arr.length < checkCount) {
    arr.push(str);
    return false;
  } else {
    arr.shift();
    arr.push(str);
    if (arr.every((v) => v === str)) {
      return true;
    }
    return false;
  }
}

// 创建终端会话的函数，供 Web 界面调用
export function createTerminalSession(): number {
  const terminalID = ++globalLastTerminalID;
  lastTerminalID = globalLastTerminalID;
  
  const terminal = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || process.cwd(),
    env: process.env,
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
  });

  globalTerminalMap.set(terminalID, context);
  console.log(`Terminal session created with ID: ${terminalID}`);
  
  return terminalID;
}

server.tool(
  "execute-command",
  `execute-command on terminal.`,
  {
    terminalID: z.number({ description: "terminalID" }),
    command: z.string({
      description: "The command to execute",
    }),
  },
  async ({ terminalID, command }) => {
    if (terminalID === -1) {
      terminalID = lastTerminalID;
    }
    let c = terminalMap.get(terminalID);
    if (c == null) {
      throw new Error("Terminal not found. Please open a terminal first using the web interface at http://localhost:3000");
    }
    // logger.info(`execute-command: ${command}`);

    c.commandOutput = "";
    c.terminal.write(`${command}\r`);

    while (1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (checkEnd(c.commandOutput)) {
        break;
      }
    }
    c.lastIndex = c.stdout.length;
    return {
      content: [
        { type: "text", text: strip(c.commandOutput).slice(-maxToken) },
      ],
    };
  }
);

