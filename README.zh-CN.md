# API Server 小红书 MCP — 面向 AI Agent 的付费数据工具

[English](README.md) · [工具列表](#mcp-工具) · [快速开始](#快速开始) · [安全说明](SECURITY.md)

![API Server 小红书 MCP：面向 AI Agent 的付费 RedNote 数据工具](assets/social-preview.png)

**API Server 小红书 MCP 是现有付费小红书 V2 数据接口的远程 Model Context Protocol 网关。** Cursor、Claude 和其他支持 MCP 的 AI Agent 可以直接搜索笔记、获取笔记详情与评论、读取用户资料以及用户作品，不需要用户自己编写 API 调用代码。

MCP 不会取代 API Server 的商业系统。每次调用都会把客户自己的 API Server Token 转发给现有接口，继续由 API Server 处理余额、套餐、扣费和 QPS。

> 本项目是独立开发者工具，与小红书/RedNote 没有隶属、赞助或官方合作关系。

## 为什么使用这个 MCP？

- 把现有付费 API 直接提供给 Cursor、Claude 等 AI 客户端。
- 继续复用现有账号、余额、订阅套餐和扣费逻辑。
- Token 位于 MCP HTTP 鉴权层，不作为工具参数暴露给模型。
- 使用无状态 Streamable HTTP，便于反向代理和横向扩容。
- 每个工具都明确展示单次调用价格。
- 内置参数校验、请求超时和响应大小限制。

## 适用场景

- 小红书热点和趋势研究
- 达人、博主和潜在合作对象发现
- 营销团队的内容调研
- AI 驱动的笔记与评论分析
- RedNote 市场情报工作流
- Cursor、Claude 或其他 Agent 的内部自动化

## MCP 工具

- `xhs_v2_search_notes`：搜索笔记，支持排序与筛选；60 Token
- `xhs_v2_get_note`：获取适配后的笔记详情；45 Token
- `xhs_v2_get_full_note`：获取全参笔记详情；60 Token
- `xhs_v2_get_comments`：获取一级评论，支持最新/最热排序；45 Token
- `xhs_v2_get_subcomments`：获取评论回复；45 Token
- `xhs_v2_get_user`：获取适配后的用户资料；45 Token
- `xhs_v2_get_full_user`：获取全参用户资料；60 Token
- `xhs_v2_list_user_notes`：获取用户发布的笔记；60 Token

MCP 只开放 `/api/xhs/v2/*` 业务接口，不提供旧版、V3、厂商余额和 X-S 通用签名接口。

## 扣费流程

1. 客户在 API Server 获取 Token 并充值。
2. 客户把 Token 配置在 MCP 的 `Authorization` 请求头。
3. MCP 把每次工具调用映射为一次付费 API Server 请求。
4. API Server 按现有规则扣除 Token，并执行套餐优先级与 QPS 限制。
5. MCP 将接口结果返回给客户的 AI Agent。

Token 不会出现在 MCP 工具参数中，因此模型无需读取或传递客户密钥。

## 快速开始

环境要求：

- Node.js 20+
- API Server 正式地址：`https://dataflowserver.org`
- 用于测试真实调用的 API Server Token

账号接入、接口参数和当前计费规则请查看 [XHS V2 在线接口文档](https://dataflowserver.org/api/docs/)。

```bash
git clone https://github.com/submato/apiserver-xhs-mcp.git
cd apiserver-xhs-mcp
npm install
cp .env.example .env
```

在 `.env` 中设置 `APISERVER_BASE_URL`，然后启动：

```bash
npm run dev
```

默认地址：

- MCP：`http://localhost:3000/mcp`
- 健康检查：`http://localhost:3000/health`

### 接入 MCP 客户端

在支持远程 MCP 的客户端中添加：

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

请替换为实际部署地址。不要把真实 Token 提交到 Git 仓库或共享配置文件。

## 生产部署

直接构建运行：

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

或使用 Docker：

```bash
docker build -t apiserver-xhs-mcp .
docker run --rm -p 3000:3000 \
  -e APISERVER_BASE_URL=https://apiserver.example \
  apiserver-xhs-mcp
```

公开提供远程 MCP 时：

- 在反向代理或负载均衡器终止 TLS。
- MCP 入口和上游 API 都必须使用有效的 HTTPS 证书。
- MCP 保持无状态，账号与扣费继续以 API Server 为准。
- 在现有客户 QPS 之外增加入口限流和滥用监控。
- 不要记录完整的 `Authorization` 请求头。
- 监控上游延迟、错误率、Token 扣费和异常调用模式。

## 环境变量

- `APISERVER_BASE_URL`：必填，上游 API Server 地址
- `HOST`：监听地址，默认 `0.0.0.0`
- `PORT`：监听端口，默认 `3000`
- `REQUEST_TIMEOUT_MS`：上游超时，默认 `30000`
- `MAX_RESPONSE_CHARS`：最大响应字符数，默认 `200000`
- `ALLOW_INSECURE_UPSTREAM`：设为 `true` 时允许生产环境使用 HTTP 上游

生产环境默认拒绝 HTTP 上游。只有 MCP 与 API Server 位于可信私有网络时才应开启例外。

## 技术栈

- [Model Context Protocol](https://modelcontextprotocol.io/) Streamable HTTP
- [MCP 官方 TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express](https://expressjs.com/)
- [Zod](https://zod.dev/)
- TypeScript 与 Node.js 20+

## 合规与数据责任

部署方需要自行遵守适用法律、平台条款、隐私要求和数据留存规定。避免采集不必要的个人数据，并提供滥用举报和数据删除流程。

## 参与贡献

欢迎提交 Issue 和范围明确的 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
