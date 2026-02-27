#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getModels } from "./pricing.js";
import { executeTool, tools } from "./tools.js";

function createServer(): Server {
  const server = new Server(
    {
      name: "tokencost-dev",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return executeTool(name, args);
  });

  return server;
}

/** Smithery sandbox: returns a server instance for capability scanning */
export function createSandboxServer() {
  return createServer();
}

async function main() {
  const server = createServer();

  // Pre-warm the cache in background
  getModels().catch(() => {
    // Non-fatal — tools will retry on first call
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("tokencost MCP server started");
}

// Only start stdio transport when executed directly (not imported for scanning)
const isDirectExecution =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/tokencost-dev") ||
  process.argv[1]?.endsWith("dist/index.js");

if (isDirectExecution) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
