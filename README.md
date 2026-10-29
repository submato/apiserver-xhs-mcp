# 小红书数据 MCP

这是一个只提供小红书 V2 数据能力的 MCP 服务。接入 Cursor、Claude 等支持 MCP 的 AI 工具后，可以直接：

- 搜索小红书笔记
- 获取笔记详情和完整详情
- 获取一级评论和子评论
- 获取用户资料
- 获取用户发布的笔记

本项目只调用 `/api/xhs/v2/*` 接口，不提供旧版或 V3 接口。

## 不需要提供小红书账号

使用时不需要提供小红书账号、密码、Cookie、验证码，也不需要在电脑上登录小红书。

数据由 DataFlow API 提供，可以避免本地自动化、频繁登录和账号抓取带来的小红书账号风控、掉线及封控问题。调用接口只需要配置自己的 DataFlow Token。

> DataFlow 是独立的第三方数据接口服务，与小红书没有隶属或官方合作关系。请依法合规使用数据。

## 如何使用

### 1. 获取 DataFlow Token

- [注册 DataFlow 账号](https://dataflowserver.org/register/)
- [登录并充值](https://dataflowserver.org/login/)
- [查看接口文档和最新价格](https://dataflow.apifox.cn/)

注册和充值的是 DataFlow 账号，不是小红书账号。

### 2. 启动 MCP 服务

需要 Node.js 20 或更高版本：

```bash
git clone https://github.com/submato/apiserver-xhs-mcp.git
cd apiserver-xhs-mcp
npm install
cp .env.example .env
npm run build
npm start
```

默认 MCP 地址：

```text
http://localhost:3000/mcp
```

### 3. 添加到 MCP 客户端

把下面配置加入 Cursor、Claude 或其他支持远程 MCP 的客户端：

```json
{
  "mcpServers": {
    "xiaohongshu": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer 你的_DataFlow_Token"
      }
    }
  }
}
```

重启 MCP 客户端后，就可以让 AI 搜索笔记、读取详情、分析评论或查询用户内容。

请勿把真实 Token 提交到公开仓库或发送给他人。

## 计费说明

每次 MCP 工具调用都会转发为一次 DataFlow V2 API 请求，并按照对应接口价格扣除 Token。充值入口和余额在 [DataFlow](https://dataflowserver.org/login/) 查看，具体接口参数与最新价格以 [Apifox 接口文档](https://dataflow.apifox.cn/) 为准。
