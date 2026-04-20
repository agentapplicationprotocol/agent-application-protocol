---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) HTTP 端点参考 —— 会话管理、轮次提交、历史记录和认证。
  - - meta
    - property: og:title
      content: 端点 — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) HTTP 端点参考 —— 会话管理、轮次提交、历史记录和认证。
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/zh/endpoints
  - - meta
    - name: twitter:title
      content: 端点 — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) HTTP 端点参考 —— 会话管理、轮次提交、历史记录和认证。
---

# 端点

服务器可以在任意 Base URL 下托管 AAP 服务器（如 `https://api.example.com/v1`）。以下所有端点均相对于该 Base URL。

| 方法     | 路径                    | 描述                 |
| -------- | ----------------------- | -------------------- |
| `GET`    | `/meta`                 | 获取可用 Agent 信息  |
| `GET`    | `/sessions`             | 列出会话             |
| `POST`   | `/sessions`             | 创建新会话           |
| `GET`    | `/sessions/:id`         | 按 ID 获取会话       |
| `DELETE` | `/sessions/:id`         | 删除会话             |
| `GET`    | `/sessions/:id/history` | 获取会话历史         |
| `POST`   | `/sessions/:id/turns`   | 向现有会话发送新轮次 |

## 认证

所有端点通过 `Authorization` 请求头接受 API 密钥：

```
Authorization: Bearer <api-key>
```

`GET /meta` 上的认证是可选的 —— 服务器可以选择公开暴露它以供能力发现。

## GET /meta

返回协议版本和此服务器上可用的 Agent 列表。当前协议版本为 **3**。

### 响应 `200 OK`

```json
{
  "version": 3,
  "agents": [
    {
      "name": "research-agent",
      "title": "Research Agent",
      "version": "1.2.0",
      "description": "可以搜索网络并总结信息的研究 Agent。",
      "tools": [
        {
          "name": "web_search",
          "title": "Web Search",
          "description": "搜索网络信息",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "搜索查询" }
            },
            "required": ["query"]
          }
        }
      ],
      "options": [
        {
          "name": "model",
          "title": "模型",
          "description": "此 Agent 使用的 LLM 模型。",
          "type": "select",
          "options": ["claude-sonnet-4-5", "claude-opus-4-5"],
          "default": "claude-sonnet-4-5"
        },
        {
          "name": "language",
          "title": "响应语言",
          "description": "Agent 应使用的响应语言。",
          "type": "text",
          "default": "English"
        }
      ],
      "capabilities": {
        "history": {
          "compacted": {},
          "full": {}
        },
        "stream": {
          "delta": {},
          "message": {},
          "none": {}
        },
        "application": {
          "tools": {}
        },
        "image": {
          "http": {},
          "data": {}
        }
      }
    }
  ]
}
```

**响应字段：**

- `version` —— 此服务器实现的 AAP 协议版本。当前协议版本为 `3`。

**Agent 字段：**

- `name` —— 此服务器上 Agent 的唯一标识符。
- `title` —— _（可选）_ 人类可读的显示名称。
- `version` —— Agent 的语义版本。
- `description` —— _（可选）_ Agent 功能的人类可读描述。
- `tools` —— Agent 选择暴露给客户端配置的服务端工具（启用、禁用或授予信任）。Agent 也可能有未暴露的工具，这些工具内联运行无需客户端参与，因此这是 Agent 实际工具的子集。当 `tool_call` 或 `tool_result` 事件引用未知工具名称时，客户端应优雅处理。
- `options` —— 客户端可以在每次请求中设置的可配置选项。
- `capabilities` —— _（可选）_ 声明 Agent 支持的能力。可以省略各个能力字段，客户端应将缺失字段视为不支持。
  - `history` —— 声明 Agent 可以在 `GET /sessions/:id/history` 中返回的历史类型：
    - `history.compacted` —— 若存在，服务器可以在 `GET /sessions/:id/history` 中返回压缩历史。
    - `history.full` —— 若存在，服务器可以在 `GET /sessions/:id/history` 中返回完整未压缩历史。
  - `stream` —— 声明 Agent 支持的流模式。若省略，客户端应假设只支持 `"none"`。
    - `stream.delta` —— 若存在，Agent 支持 `"delta"` 流式传输。
    - `stream.message` —— 若存在，Agent 支持 `"message"` 流式传输。
    - `stream.none` —— 若存在，Agent 支持非流式（`"none"`）响应。
  - `application` —— 声明 Agent 支持的应用提供输入：
    - `application.tools` —— 若存在，Agent 接受请求中的客户端工具。
  - `image` —— 声明 Agent 支持的图片输入：
    - `image.http` —— 若存在，Agent 接受 `https://` 图片 URL。
    - `image.data` —— 若存在，Agent 接受 `data:` URI（base64）图片。

**选项字段：**

- `name` —— `options` 标识符。
- `title` —— _（可选）_ 人类可读的显示名称。
- `description` —— _（可选）_ 解释此选项的作用。
- `type` —— `"text"` 用于自由格式字符串输入，`"select"` 用于固定选项列表，`"secret"` 用于敏感值（如 API 密钥），应在 UI 中遮蔽；服务器可以将 secret 值持久化到安全存储（如 AWS Secrets Manager）。
- `options` —— _（`select` 必填）_ 允许值列表。
- `default` —— 客户端省略此选项时使用的默认值。

## GET /sessions

返回分页的会话列表。

### 查询参数

- `after` —— _（可选）_ 分页游标。传入上一响应的 `next` 值以获取下一页。

### 响应 `200 OK`

```json
{
  "sessions": [
    {
      "sessionId": "sess_abc123",
      "agent": {
        "name": "research-agent",
        "tools": [{ "name": "web_search", "trust": true }],
        "options": {
          "model": "claude-opus-4-5",
          "language": "Japanese"
        }
      },
      "tools": [
        {
          "name": "get_weather",
          "description": "获取某地点的当前天气",
          "parameters": {
            "type": "object",
            "properties": {
              "location": { "type": "string" }
            },
            "required": ["location"]
          }
        }
      ]
    }
  ],
  "next": "dXNlcjoxMjM0NTY3ODk"
}
```

**字段：**

- `sessions` —— 会话对象数组。每个对象与 `GET /sessions/:id` 的形状相同。
- `next` —— _（可选）_ 不透明游标字符串，格式由服务器定义；作为 `after` 传入以获取下一页。无更多结果时不存在。

## POST /sessions

创建新会话并返回 `sessionId`。不运行 Agent —— 使用 `POST /sessions/:id/turns` 发送第一条消息以运行 Agent。

### 请求体

```json
{
  "agent": {
    "name": "research-agent",
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "model": "claude-opus-4-5",
      "language": "Japanese"
    }
  },
  "messages": [
    { "role": "system", "content": "你是一个有帮助的助手。" },
    { "role": "user", "content": "法国的首都是哪里？" },
    { "role": "assistant", "content": "法国的首都是巴黎。" }
  ],
  "tools": [
    {
      "name": "get_weather",
      "description": "获取某地点的当前天气",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ]
}
```

**字段：**

- `agent` —— _（必填）_ Agent 配置。
  - `agent.name` —— 要调用的 Agent 名称。
  - `agent.tools` —— _（可选）_ 要启用的服务端工具。若省略，所有暴露的服务端工具均禁用。
  - `agent.options` —— _（可选）_ 与 Agent 声明的 `options` 匹配的键值对。若省略，所有选项使用默认值。单独省略的选项也回退到默认值。
- `messages` —— _（可选）_ 用于初始化会话的历史（如系统提示或先前对话）。
- `tools` —— _（可选）_ 带完整 schema 的客户端工具。

**`agent.tools` 对象字段：**

- `name` —— `/meta` 中声明的服务端工具名称。
- `trust` —— _（可选）_ 若为 `true`，服务器可以在不请求客户端权限的情况下调用此工具。默认为 `false`。

### 响应 `201 Created`

```json
{ "sessionId": "sess_abc123" }
```

## GET /sessions/:id

返回给定会话 ID 的会话对象。

### 响应 `200 OK`

```json
{
  "sessionId": "sess_abc123",
  "agent": {
    "name": "research-agent",
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "model": "claude-opus-4-5",
      "language": "Japanese"
    }
  },
  "tools": [
    {
      "name": "get_weather",
      "description": "获取某地点的当前天气",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ]
}
```

**字段：**

- `sessionId` —— 会话标识符。
- `agent` —— 此会话的 Agent 配置。`"secret"` 类型的 `agent.options` 不得以明文返回；服务器应返回不透明占位符（如 `"***"`）。
- `tools` —— 为此会话声明的客户端工具。

## DELETE /sessions/:id

删除会话及其关联历史。

### 响应

`204 No Content`

## GET /sessions/:id/history

返回给定会话的对话历史。仅当 Agent 在 `GET /meta` 中声明了历史能力时可用。

### 查询参数

- `type` —— _（必填）_ 要返回的历史类型。接受值：`compacted`、`full`。

### 响应 `200 OK`

```json
{
  "history": {
    "compacted": [...]
  }
}
```

**字段：**

- `history` —— 对话历史。根据请求的 `type` 包含 `history.compacted` 或 `history.full`。

### 响应 `404 Not Found`

当会话不存在，或请求的历史 `type` 不被 Agent 支持（即未在 `capabilities.history` 中声明）时返回。

## POST /sessions/:id/turns

向现有会话发送新用户轮次或工具调用结果。服务器将消息追加到历史，运行 Agent，并流式传输或返回响应。

### 请求体

```json
{
  "agent": {
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "language": "English"
    }
  },
  "stream": "delta",
  "messages": [{ "role": "user", "content": "大阪呢？" }],
  "tools": [
    {
      "name": "get_weather",
      "description": "获取某地点的当前天气",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ]
}
```

**字段：**

- `agent` —— _（可选）_ 会话级 Agent 覆盖。服务器必须在会话生命周期内持久化这些覆盖。会话创建后不能更改 Agent `name`。
  - `agent.tools` —— _（可选）_ 服务端工具。覆盖会话创建时声明的 `agent.tools`。
  - `agent.options` —— _（可选）_ 键值选项覆盖。选项按键合并：只更新提供的键，省略的键保持不变。要取消设置某选项，发送其默认值。服务器必须在会话生命周期内持久化这些覆盖。
- `stream` —— _（可选）_ 响应模式。见[响应模式](/zh/response)。
- `messages` —— _（必填）_ 要追加的新轮次。通常是单条 `user` 消息，但在 `tool_use` 停止后重新提交时也可以是工具结果或工具权限。
- `tools` —— _（可选）_ 客户端工具。覆盖会话创建时声明的工具。服务器必须在会话生命周期内持久化这些覆盖。

### 响应 `200 OK`

响应体格式见[响应模式](/zh/response)。
