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
console.log("start hyper-mcp-terminal!", pack.version);
// Create an MCP server
export const server = new McpServer({
  name: "hyper-mcp-terminal",
  version: pack.version,
});

type Context = {
  terminal: pty.IPty;
  stdout: string;
  commamdOutput: string;
  lastIndex: number;
  timer: NodeJS.Timeout;
};
const terminalMap = new Map<number, Context>();

let lastTerminalID = 0;

// const promptPattern = /\$\s*$|\>\s*$|#\s*$/m;
const checkCount = parseInt(process.env.Terminal_End_CheckCount) || 15;
const maxToken = parseInt(process.env.Terminal_Output_MaxToken) || 10000;
const timeout = parseInt(process.env.Terminal_Timeout) || 5 * 60 * 1000;
const arr = [];
function checkEnd(str: string) {
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

// Add an addition tool
server.tool(
  "open-terminal",
  `open-terminal on ${os.platform} OS.`,
  {},
  async ({}) => {
    const terminal = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env,
    });

    let c = {
      terminal: terminal,
      commamdOutput: "",
      stdout: "",
      lastIndex: 0,
      timer: setTimeout(() => {
        terminal.kill();
        terminalMap.delete(c.terminal.pid);
      }, timeout),
    };
    terminal.onData((data) => {
      c.stdout += data;
      c.commamdOutput += data;
      // logger.info("mcp out:\n", data);
    });
    // terminal.write(`ssh ldh@ubuntu\r`);
    while (1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (checkEnd(c.stdout)) {
        break;
      }
    }

    terminalMap.set(terminal.pid, c);
    lastTerminalID = terminal.pid;
    c.lastIndex = c.stdout.length;
    return {
      content: [
        {
          type: "text",
          text: `success created terminalID: ${terminal.pid}\n${strip(
            c.stdout
          ).slice(-maxToken)}`,
        },
      ],
    };
  }
);

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
      throw new Error("terminalID not found, please create terminal first");
    }
    // logger.info(`execute-command: ${command}`);

    c.commamdOutput = "";
    c.terminal.write(`${command}\r`);
    clearTimeout(c.timer);
    c.timer = setTimeout(() => {
      c.terminal.kill();
      terminalMap.delete(c.terminal.pid);
    }, timeout);

    while (1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (checkEnd(c.commamdOutput)) {
        break;
      }
    }
    c.lastIndex = c.stdout.length;
    return {
      content: [
        { type: "text", text: strip(c.commamdOutput).slice(-maxToken) },
      ],
    };
  }
);

server.tool(
  "view-terminal-latest-output",
  `View the current terminal latest output(manual call)`,
  {
    terminalID: z.number({ description: "terminalID" }),
  },
  async ({ terminalID }) => {
    if (terminalID === -1) {
      terminalID = lastTerminalID;
    }
    let c = terminalMap.get(terminalID);
    if (c == null) {
      throw new Error("terminalID not found, please create terminal first");
    }

    return {
      content: [
        {
          type: "text",
          text: strip(c.stdout.slice(c.lastIndex)).slice(-maxToken),
        },
      ],
    };
  }
);

server.tool(
  "sigint-current-command",
  `sigint the current command. Ctrl+C`,
  {
    terminalID: z.number({ description: "terminalID" }),
  },
  async ({ terminalID }) => {
    if (terminalID === -1) {
      terminalID = lastTerminalID;
    }
    let c = terminalMap.get(terminalID);
    if (c == null) {
      throw new Error("terminalID not found, please create terminal first");
    }

    c.commamdOutput = "";
    c.terminal.write(``);

    while (1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (checkEnd(c.commamdOutput)) {
        break;
      }
    }

    return {
      content: [
        { type: "text", text: strip(c.commamdOutput).slice(-maxToken) },
      ],
    };
  }
);
