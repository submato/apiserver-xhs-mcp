# API Server Xiaohongshu MCP — RedNote Data Tools for AI Agents

[简体中文](README.zh-CN.md) · [Tools](#available-mcp-tools) · [Quick start](#quick-start) · [Security](SECURITY.md)

[![MCP](https://img.shields.io/badge/MCP-Streamable_HTTP-5A45FF)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![API Server Xiaohongshu MCP — paid RedNote data tools for AI agents](assets/social-preview.png)

**API Server Xiaohongshu MCP is a remote Model Context Protocol gateway for paid Xiaohongshu (RedNote) V2 data APIs.** It lets Cursor, Claude, and other MCP-compatible AI agents search notes, read note details and comments, inspect creators, and list user posts without custom API integration code.

The gateway does not replace API Server billing. Every request forwards the customer's API Server token to the existing API, so balances, subscriptions, token charges, and rate limits remain under API Server control.

> This is an independent developer tool and is not affiliated with, endorsed by, or sponsored by Xiaohongshu/RedNote.

## Why use this MCP server?

- Give AI agents structured Xiaohongshu research tools in minutes.
- Keep the existing paid API, account, balance, and subscription system.
- Authenticate each customer at the MCP transport layer instead of exposing tokens to the model.
- Run stateless Streamable HTTP behind a reverse proxy and scale horizontally.
- Show the token cost in every tool description before an agent calls it.
- Validate all tool inputs with Zod and enforce upstream timeouts and response-size limits.

## Use cases

- Social listening and Xiaohongshu trend research
- Creator and influencer discovery
- Content research for marketing teams
- Note and comment analysis by AI agents
- RedNote market intelligence workflows
- Internal automation built with Cursor, Claude, or another MCP client

## Available MCP tools

- `xhs_v2_search_notes` — search notes with sorting and filters; 60 tokens
- `xhs_v2_get_note` — fetch an adapted note detail response; 45 tokens
- `xhs_v2_get_full_note` — fetch the complete note detail response; 60 tokens
- `xhs_v2_get_comments` — fetch and sort top-level comments; 45 tokens
- `xhs_v2_get_subcomments` — fetch replies to a comment; 45 tokens
- `xhs_v2_get_user` — fetch an adapted user profile; 45 tokens
- `xhs_v2_get_full_user` — fetch the complete user profile; 60 tokens
- `xhs_v2_list_user_notes` — list notes published by a user; 60 tokens

Only `/api/xhs/v2/*` business endpoints are exposed. Legacy, V3, vendor-balance, and unrestricted X-S signing endpoints are intentionally excluded.

## How billing works

1. A customer obtains an API Server token and balance.
2. The customer configures that token as the MCP `Authorization` header.
3. The MCP gateway maps one tool call to one paid API Server request.
4. API Server applies the existing token charge, plan priority, and QPS policy.
5. The tool returns the upstream result to the customer's AI agent.

The token is read from the HTTP header and is never part of a tool's arguments, so the language model does not need to see it.

## Quick start

### Requirements

- Node.js 20 or newer
- The production API Server base URL: `https://dataflowserver.org`
- A customer API Server token for testing tool calls

See the [XHS V2 API documentation](https://dataflowserver.org/api/docs/) for account access, endpoint details, and current billing behavior.

```bash
git clone https://github.com/submato/apiserver-xhs-mcp.git
cd apiserver-xhs-mcp
npm install
cp .env.example .env
```

Set `APISERVER_BASE_URL` in `.env`, then start the server:

```bash
npm run dev
```

The default endpoints are:

- MCP: `http://localhost:3000/mcp`
- Health: `http://localhost:3000/health`

### Connect an MCP client

Add a remote MCP server using the URL and an HTTP authorization header:

```json
{
  "mcpServers": {
    "apiserver-xhs": {
      "url": "https://mcp.your-domain.example/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_APISERVER_TOKEN"
      }
    }
  }
}
```

Replace the URL with your deployed gateway. Do not commit a real customer token to a repository or shared configuration file.

## Production deployment

Build and run directly:

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

Or use Docker:

```bash
docker build -t apiserver-xhs-mcp .
docker run --rm -p 3000:3000 \
  -e APISERVER_BASE_URL=https://apiserver.example \
  apiserver-xhs-mcp
```

For a public hosted MCP service:

- Terminate TLS at a reverse proxy or managed load balancer.
- Use a valid HTTPS certificate on both the public MCP endpoint and upstream API.
- Keep this service stateless; API Server remains the source of truth for accounts and billing.
- Apply edge rate limits in addition to the existing per-customer API limits.
- Never log complete `Authorization` headers.
- Monitor upstream latency, error rate, token deductions, and abuse patterns.

## Configuration

- `APISERVER_BASE_URL` — required upstream API Server origin
- `HOST` — listening host; default `0.0.0.0`
- `PORT` — listening port; default `3000`
- `REQUEST_TIMEOUT_MS` — upstream timeout; default `30000`
- `MAX_RESPONSE_CHARS` — maximum accepted upstream body size; default `200000`
- `ALLOW_INSECURE_UPSTREAM` — permits HTTP in production only when explicitly set to `true`

Production refuses a plain HTTP upstream unless `ALLOW_INSECURE_UPSTREAM=true`. Only use that override on a trusted private network.

## Tech stack

- [Model Context Protocol](https://modelcontextprotocol.io/) Streamable HTTP transport
- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express](https://expressjs.com/) for the HTTP service
- [Zod](https://zod.dev/) for MCP tool input validation
- TypeScript and Node.js 20+

## Project structure

```text
src/
  client.ts   API Server HTTP client and authorization handling
  config.ts   validated environment configuration
  server.ts   stateless Streamable HTTP MCP endpoint
  tools.ts    Xiaohongshu MCP tool definitions
tests/
  client.test.ts
```

## API and data responsibility

Operators are responsible for complying with applicable laws, platform terms, privacy requirements, and data-retention rules. Avoid collecting unnecessary personal data. Restrict access, log usage safely, and provide a process for abuse reports and deletion requests.

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities and deployment guidance.

## Contributing

Issues and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change.

## License

[MIT](LICENSE)
