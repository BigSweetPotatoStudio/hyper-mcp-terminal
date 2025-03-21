#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./index.mjs";

const transport = new StdioServerTransport();
console.log("Server start");
await server.connect(transport);