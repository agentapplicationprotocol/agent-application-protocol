---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) 输入类型 —— 用户消息、工具结果、工具权限和取消请求。
  - - meta
    - property: og:title
      content: 输入 — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) 输入类型 —— 用户消息、工具结果、工具权限和取消请求。
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/zh/input
  - - meta
    - name: twitter:title
      content: 输入 — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) 输入类型 —— 用户消息、工具结果、工具权限和取消请求。
---

# 用户输入

所有客户端发起的输入均通过 [`POST /sessions/:id/input`](/zh/endpoints#post-sessions-id-input) 提交。服务器持久化输入，分配会话序列号，向所有订阅者发出 `input` 事件，并将输入传递给活跃的会话工作进程（如果存在）。

输入类型：

- 用户消息
- 工具结果
- 工具权限
- 取消请求

## `type: "user"` —— 用户消息

```json
{
  "type": "user",
  "content": "What's the weather in Tokyo?"
}
```

`content` 可以是纯字符串，也可以是用于混合内容（如文本和图片）的内容块数组：

```json
{
  "type": "user",
  "content": [
    { "type": "text", "text": "What's in this image?" },
    { "type": "image", "url": "https://example.com/photo.jpg" }
  ]
}
```

内容块类型：

- `{ "type": "text", "text": "..." }` —— 纯文本
- `{ "type": "image", "url": "..." }` —— 图片，为 `https://` URL 或 `data:` URI（如 `data:image/png;base64,...`）。服务器必须支持 `GET /meta` 能力中声明的图片格式。

服务器在工作进程活跃时如何处理用户消息（中断或排队）由服务器实现决定。

## `type: "tool"` —— 工具结果

```json
{
  "type": "tool",
  "toolCallId": "call_001",
  "content": "Tokyo: 18°C, partly cloudy"
}
```

每个工具结果单独提交。客户端无需将待处理的工具结果批量合并到单个请求中。

## `type: "permission"` —— 工具权限

```json
{
  "type": "permission",
  "toolCallId": "call_002",
  "granted": false,
  "reason": "User denied file system access."
}
```

- `granted` —— 客户端是否允许服务器执行该工具调用。
- `reason` —— _（可选）_ 人类可读的说明，传递给 Agent。

权限输入是控制输入。它被传递给工作进程，但不一定追加到模型可见的历史中。

## `type: "cancel"` —— 取消

```json
{
  "type": "cancel"
}
```

取消通过同一收件箱传递。Agent 在下一个可中断边界处观察到它。
