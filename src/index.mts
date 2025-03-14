#!/usr/bin/env node
import { z } from "zod";

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import os from "os";
import fs from "fs";
import uuid from "uuid";
import { execSync } from "child_process";
import strip from "strip-ansi";
import * as pty from "node-pty";

import log4js from "log4js";
import dayjs from "dayjs";
log4js.configure({
  appenders: {
    log: {
      type: "file",
      filename: `${dayjs().format("YYYY-MM-DD")}.log`,
    },
  },
  categories: { default: { appenders: ["log"], level: "trace" } },
});
const logger = log4js.getLogger();

// let binds = ["log", "trace", "debug", "info", "warn", "error", "fatal"];

// for (let level of binds) {
//   console["o_" + level] = console[level];
//   console[level] = function (...args) {
//     console["o_" + level].apply(console, args);
//     log[level](...args);
//   };
// }
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
console.log("start hyper-mcp-terminal!");
// Create an MCP server
const server = new McpServer({
  name: "hyper-mcp-terminal",
  version: "1.0.0",
});

type Context = {
  terminal: pty.IPty;
  stdout: string;
};
const terminalMap = new Map<number, Context>();

let lastTerminalID = 0;
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
      stdout: "",
    };
    terminal.onData((data) => {
      c.stdout += data;
      logger.info("mcp out:\n", data);
    });
    // terminal.write(`ssh ldh@ubuntu\r`);
    while (1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (promptPattern.test(c.stdout)) {
        break;
      }
    }

    terminalMap.set(terminal.pid, c);
    lastTerminalID = terminal.pid;
    return {
      content: [
        {
          type: "text",
          text: `success created terminalID: ${terminal.pid}\n${strip(
            c.stdout
          )}`,
        },
      ],
    };
  }
);

const promptPattern = /\$\s*$|\>\s*$|#\s*$/m;
server.tool(
  "execute-command",
  `execute-command`,
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
    logger.info(`execute-command: ${command}`);

    c.stdout = "";
    c.terminal.write(`${command}\r`);

    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, 5000)),
      new Promise(async (resolve) => {
        while (1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (promptPattern.test(c.stdout)) {
            break;
          }
        }
        resolve(1);
      }),
    ]);

    return {
      content: [{ type: "text", text: strip(c.stdout) }],
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
