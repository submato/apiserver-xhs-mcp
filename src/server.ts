import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";

import { createApiClient, normalizeClientToken } from "./client.js";
import { config } from "./config.js";
import { registerXhsTools } from "./tools.js";

const app = createMcpExpressApp();
app.disable("x-powered-by");

app.get("/", (_request: Request, response: Response) => {
  response.json({
    name: "API Server Xiaohongshu MCP",
    protocol: "Model Context Protocol",
    transport: "Streamable HTTP",
    endpoint: "/mcp",
    health: "/health",
  });
});

app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.post("/mcp", async (request: Request, response: Response) => {
  const token = normalizeClientToken(request.headers.authorization);
  if (!token) {
    response.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Missing Authorization header. Use Bearer <APISERVER_TOKEN>.",
      },
      id: request.body?.id ?? null,
    });
    return;
  }

  const api = createApiClient({
    baseUrl: config.apiServerBaseUrl,
    token,
    timeoutMs: config.requestTimeoutMs,
    maxResponseChars: config.maxResponseChars,
  });
  const server = new McpServer({
    name: "apiserver-xhs-mcp",
    version: "0.2.1",
  });
  registerXhsTools(server, api);

  const transport = new StreamableHTTPServerTransport();

  try {
    await server.connect(transport);
    response.on("close", () => {
      void transport.close();
      void server.close();
    });
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!response.headersSent) {
      response.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: request.body?.id ?? null,
      });
    }
  }
});

function methodNotAllowed(request: Request, response: Response): void {
  response.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: `Method ${request.method} is not allowed on the stateless MCP endpoint.`,
    },
    id: null,
  });
}

app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);
app.put("/mcp", methodNotAllowed);
app.patch("/mcp", methodNotAllowed);

const httpServer = app.listen(config.port, config.host, () => {
  console.log(
    `API Server Xiaohongshu MCP listening on http://${config.host}:${config.port}/mcp`,
  );
});

httpServer.on("error", (error) => {
  console.error("Failed to start MCP server", error);
  process.exit(1);
});

function shutdown(): void {
  httpServer.close((error) => {
    if (error) {
      console.error("Failed to stop MCP server cleanly", error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
