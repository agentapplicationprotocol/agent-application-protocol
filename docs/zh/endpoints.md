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
      content: https://agentapplicationprotocol.com/zh/endpoint
  - - meta
    - name: twitter:title
      content: 端点 — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) HTTP 端点参考 —— 会话管理、轮次提交、历史记录和认证。
---

# 端点

服务器可以在任意 Base URL 下托管 AAP（如 `https://api.example.com/v1`）。以下所有端点均相对于该 Base URL。

| 方法     | 路径                          | 描述                    |
| -------- | ----------------------------- | ----------------------- |
| `GET`    | `/meta`                       | 获取可用 Agent 信息     |
| `GET`    | `/sessions`                   | 列出会话                |
| `POST`   | `/sessions`                   | 创建新会话              |
| `GET`    | `/sessions/:id`               | 按 ID 获取会话          |
| `PATCH`  | `/sessions/:id`               | 更新会话配置            |
| `DELETE` | `/sessions/:id`               | 删除会话                |
| `POST`   | `/sessions/:id/input`         | 向会话收件箱发布输入    |
| `GET`    | `/sessions/:id/events/stream` | 通过 SSE 订阅会话事件流 |
| `GET`    | `/sessions/:id/history`       | 获取会话历史            |

## 认证

所有端点通过 `Authorization` 请求头接受 API 密钥：

```
Authorization: Bearer <api-key>
```

[`GET /meta`](/zh/endpoints#get-meta) 上的认证是可选的 —— 服务器可以选择公开暴露它以供能力发现。

## GET /meta

返回协议版本和此服务器上可用的 Agent 列表。当前协议版本为 **4**。

### 响应 `200 OK`

```json
{
  "version": 4,
  "agents": [
    {
      "name": "research-agent",
      "title": "Research Agent",
      "version": "1.2.0",
      "description": "A research agent that can search the web and summarize information.",
      "tools": [
        {
          "name": "web_search",
          "title": "Web Search",
          "description": "Search the web for information",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "Search query" }
            },
            "required": ["query"]
          }
        }
      ],
      "options": [
        {
          "name": "model",
          "title": "Model",
          "description": "The LLM model to use for this agent.",
          "type": "select",
          "options": ["claude-sonnet-4-5", "claude-opus-4-5"],
          "default": "claude-sonnet-4-5"
        },
        {
          "name": "language",
          "title": "Response Language",
          "description": "The language the agent should respond in.",
          "type": "text",
          "default": "English"
        }
      ],
      "capabilities": {
        "history": {
          "tail": {}
        },
        "stream": {
          "delta": {},
          "message": {}
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

- `version` —— 此服务器实现的 AAP 协议版本。当前协议版本为 `4`。

**Agent 字段：**

- `name` —— 此服务器上 Agent 的唯一标识符。
- `title` —— _（可选）_ 人类可读的显示名称。
- `version` —— Agent 的语义版本。
- `description` —— _（可选）_ Agent 功能的人类可读描述。
- `tools` —— Agent 选择暴露给客户端配置的服务端工具（启用、禁用或授予信任）。Agent 也可能有未暴露的工具，这些工具内联运行无需客户端参与，因此这是 Agent 实际工具的子集。当 `tool_call` 或 `tool_result` 事件引用未知工具名称时，客户端应优雅处理。
- `options` —— 客户端可以在每次请求中设置的可配置选项。
- `capabilities` —— _（可选）_ 声明 Agent 支持的能力。可以省略各个能力字段，客户端应将缺失字段视为不支持。
  - `history` —— 若存在，Agent 支持通过 [`GET /sessions/:id/history`](/zh/endpoints#get-sessions-id-history) 检索历史。子键声明支持的查询模式。
    - `history.tail` —— 若存在，Agent 支持尾部分页：无游标时返回最新消息，`before` 游标向前翻页获取更早的消息。
  - `stream` —— 声明 Agent 支持的流模式。若不存在，客户端必须将该 Agent 视为不支持任何流模式，对 `GET /sessions/:id/events/stream` 的任何 `stream` 参数均返回 `400 Bad Request`。
    - `stream.delta` —— 若存在，Agent 支持以增量 `text_delta` 和 `thinking_delta` 事件流式传输文本。
    - `stream.message` —— 若存在，Agent 支持传送完整的 `text` 和 `thinking` 事件。
  - `image` —— 声明 Agent 支持的图片输入：
    - `image.http` —— 若存在，Agent 接受 `https://` 图片 URL。
    - `image.data` —— 若存在，Agent 接受 `data:` URI（base64）图片。

**客户端工具**是协议的核心部分。所有 Agent 必须接受客户端工具。此处没有能力标志 —— 这不是可选的。

**选项字段：**

- `name` —— 在请求 `options` 对象中用作键的标识符。
- `title` —— _（可选）_ 人类可读的显示名称。
- `description` —— _（可选）_ 解释此选项的作用。
- `type` —— `"text"` 用于自由格式字符串输入，`"select"` 用于固定选项列表，`"secret"` 用于敏感值（如 API 密钥），应在 UI 中遮蔽；服务器可以将 secret 值持久化到安全存储（如 AWS Secrets Manager）。
- `options` —— _（`select` 必填）_ 允许值列表。
- `default` —— 客户端省略此选项时使用的默认值。

## GET /sessions

返回分页的会话列表。

### 查询参数

- `after` —— _（可选）_ 分页游标。传入上一响应的 `next` 值以获取下一页。

服务器选择分页大小。客户端应持续跟随 `next` 游标直到 `next` 不存在，而不是假设每页固定的会话数量。

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
          "description": "Get current weather for a location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": { "type": "string" }
            },
            "required": ["location"]
          }
        }
      ],
      "pending": []
    }
  ],
  "next": "dXNlcjoxMjM0NTY3ODk"
}
```

**字段：**

- `sessions` —— 会话对象数组。每个对象与 [`GET /sessions/:id`](/zh/endpoints#get-sessions-id) 的形状相同。
- `next` —— _（可选）_ 不透明游标字符串，格式由服务器定义；作为 `after` 传入以获取下一页。无更多结果时不存在。

## POST /sessions

创建新会话。Agent 工作进程何时启动属于服务器实现细节。

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
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What's the capital of France?" },
    { "role": "assistant", "content": "The capital of France is Paris." }
  ],
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
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
  - `agent.name` —— 要调用的 Agent 名称，如 `GET /meta` 中声明的。
  - `agent.tools` —— _（可选）_ 要启用的服务端工具。若省略，所有暴露的服务端工具均禁用。
  - `agent.options` —— _（可选）_ 与 Agent 声明的 `options` 匹配的键值对。若省略，所有选项使用默认值。单独省略的选项也回退到默认值。
- `messages` —— _（可选）_ 用于初始化会话的消息，如系统提示或要恢复的先前对话。
- `tools` —— _（可选）_ 带完整 schema 的客户端工具。

**`agent.tools` 对象字段：**

- `name` —— `/meta` 中声明的服务端工具名称。
- `trust` —— _（可选）_ 若为 `true`，服务器可以在不请求客户端权限的情况下调用此工具。默认为 `false`。

### 响应 `201 Created`

`Location` 头包含已创建会话的绝对 URL。响应体为空。

```http
201 Created
Location: https://agent-1.example.com/sessions/sess_abc123
```

客户端必须使用 `Location` 中返回的 URL 作为该会话所有后续请求的基础 —— 包括 `/input`、`/events/stream` 和 `/history`。在分布式部署中，会话可能托管在与创建它时不同的源上。

此端点不定义幂等键。创建会话只分配一个轻量级记录，重试是安全的。若客户端丢失了响应，可以通过 [`GET /sessions`](/zh/endpoints#get-sessions) 列出已有会话并继续使用匹配的会话，或创建新会话来恢复。

### 响应 `400 Bad Request`

当请求体校验失败时返回，例如未知的 Agent 工具名称、选项值与声明类型不符，或 `messages`、`tools` 格式有误。

### 响应 `404 Not Found`

当 `agent.name` 指定的 Agent 名称在此服务器上不存在时返回。

## GET /sessions/:id

返回会话的当前配置和待处理的工具调用。主要用途是重连 —— 客户端调用此端点在断线后处理待处理的工具调用。

### 响应 `200 OK`

```json
{
  "sessionId": "sess_abc123",
  "agent": {
    "name": "research-agent",
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "model": "claude-opus-4-5",
      "language": "Japanese",
      "apiKey": true
    }
  },
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ],
  "pending": []
}
```

**字段：**

- `sessionId` —— 会话标识符。
- `agent` —— 此会话的 Agent 配置，如创建时设置或通过 `PATCH /sessions/:id` 最后更新的。`"secret"` 类型的选项以布尔值返回 —— 若已存储值则为 `true`，否则为 `false` —— 绝不能以明文返回。
- `tools` —— 为此会话声明的客户端工具。
- `pending` —— 等待客户端操作的工具调用。客户端可以通过将工具名称与已配置工具匹配，判断每个调用需要 `tool_result` 还是 `tool_permission`。

### 响应 `404 Not Found`

当会话不存在时返回。

## PATCH /sessions/:id

更新持久化的会话配置。使用此端点替换客户端工具或更新 Agent 选项。会话创建后不能更改 Agent `name`。

### 请求体

```json
{
  "agent": {
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "language": "English"
    }
  },
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
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

- `agent` —— _（可选）_ 会话级 Agent 更新。
  - `agent.tools` —— _（可选）_ 服务端工具设置。完全替换会话的服务端工具设置。
  - `agent.options` —— _（可选）_ 键值选项更新。按键合并：只更新提供的键，省略的键保持不变。服务器用提供的值覆盖存储值。客户端必须省略不打算更改的 secret 字段。
- `tools` —— _（可选）_ 客户端工具。替换为会话声明的完整客户端工具集。

### 响应 `200 OK`

返回更新后的会话对象，形状与 [`GET /sessions/:id`](/zh/endpoints#get-sessions-id) 相同。

### 响应 `400 Bad Request`

当请求体校验失败时返回，例如未知的 Agent 工具名称，或选项值与声明类型不符。

### 响应 `404 Not Found`

当会话不存在时返回。

## DELETE /sessions/:id

删除会话及其关联历史。

### 响应 `204 No Content`

删除成功时返回。

### 响应 `404 Not Found`

当会话不存在时返回。

## POST /sessions/:id/input

所有客户端发起的输入都通过此端点。完整的输入类型及其结构请参阅[输入](/zh/inputs)。

### 响应 `200 OK`

响应体为空。

### 响应 `400 Bad Request`

当 `toolCallId` 引用的工具调用不存在或已被解析时返回。

### 响应 `404 Not Found`

当会话不存在时返回。

## GET /sessions/:id/events/stream

返回 `Content-Type: text/event-stream`。多个订阅者可以同时连接到同一会话。查询参数、事件类型、重连行为和空闲关闭详见[事件流](/zh/events)。

### 响应 `404 Not Found`

当会话不存在时返回。

## GET /sessions/:id/history

返回给定会话的持久化对话历史。仅当 Agent 在 [`GET /meta`](/zh/endpoints#get-meta) 能力中声明了 `history` 时可用。

客户端使用此端点在断线后恢复会话上下文，或逐页浏览更早的对话历史。历史以逆序返回 —— 最新消息在前。

### 查询参数

- `before` —— _（可选）_ 上一响应返回的不透明游标。返回早于该游标的消息。省略则获取最新消息。

### 响应 `200 OK`

```json
{
  "history": [
    {
      "id": "msg_abc125",
      "timestamp": "2026-07-12T13:00:05Z",
      "role": "assistant",
      "content": "Let me check that for you."
    },
    {
      "id": "evt_001",
      "timestamp": "2026-07-12T13:00:00Z",
      "role": "user",
      "content": "What's the weather in Tokyo?"
    },
    {
      "id": "msg_abc124",
      "timestamp": "2026-07-12T12:59:50Z",
      "role": "system",
      "content": "You are a helpful assistant."
    }
  ],
  "before": "dXNlcjoxMjM0NTY3ODk"
}
```

**字段：**

- `history` —— 逆序消息数组（最新消息在前）。
  - `id` —— 消息的稳定标识符，用于合并本地与远端历史时的去重。
  - `timestamp` —— 消息记录时的服务器 ISO 8601 时间戳。
  - `role` —— `"system"`、`"user"` 或 `"assistant"`。
  - `content` —— 消息内容。
- `before` —— _（可选）_ 不透明游标；作为 `before` 传入以获取更早的消息。无更多历史时不存在。

### 响应 `404 Not Found`

当会话不存在，或 Agent 不支持历史检索时返回。
