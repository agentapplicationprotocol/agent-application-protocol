---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) 对话历史管理 —— 服务端压缩、客户端持久化和历史能力。
  - - meta
    - property: og:title
      content: 历史记录管理 — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) 对话历史管理 —— 服务端压缩、客户端持久化和历史能力。
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/zh/history
  - - meta
    - name: twitter:title
      content: 历史记录管理 — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) 对话历史管理 —— 服务端压缩、客户端持久化和历史能力。
---

# 会话历史

## 目的

会话历史是一次完整对话的持久化记录。它在协议中的主要作用是**断线恢复**：当客户端断开并重新连接时，可以调用 `GET /sessions/:id/history` 来恢复不再存在于实时事件流中的早期对话上下文。

历史记录是实时事件流的补充，而非替代。重新连接时，服务器通过 `GET /sessions/:id/events/stream` 回放所有尚未持久化到历史记录的事件。客户端仅在需要已被折叠入持久化存储的早期上下文时才使用历史记录。

## 服务端职责

服务器拥有会话历史。服务器如何存储、压缩、摘要或保留会话记录属于实现细节 —— 协议不作规定。服务器可以将历史存储在 S3、数据库或任何其他持久化存储中，并可根据需要压缩或摘要内容以保持其对 LLM 的可处理性。

协议仅保证 `GET /sessions/:id/history` 的返回结果足以让客户端在断线后恢复对话上下文。

## 历史能力

Agent 通过 `GET /meta` 的 `capabilities` 中的 `history` 键来声明对历史记录的支持：

```json
{
  "capabilities": {
    "history": {
      "tail": {}
    }
  }
}
```

如果 `capabilities` 中不存在 `history`，则该 Agent 不支持历史记录检索。客户端不得为此类 Agent 调用 `GET /sessions/:id/history`。

子键声明支持的查询模式。若存在 `history.tail`，Agent 支持尾部分页：无游标时返回最新消息，`before` 游标向前翻页获取更早的消息。服务器如何存储、压缩或保留会话记录属于实现细节。

## 审计追踪

审计追踪、完整的未压缩消息日志以及其他记录保存需求均超出本协议的范围。需要审计能力的服务器和客户端应在 AAP 之外定义额外的端点或机制。

## 恢复流程

重新连接时，客户端通过合并两个来源来恢复会话上下文：

1. **实时事件回放** —— `GET /sessions/:id/events/stream` 回放所有尚未持久化到历史记录的事件，覆盖会话的活跃进行中部分。
2. **持久化历史** —— `GET /sessions/:id/history` 提供已完成工作的持久化记录。当实时流中不再存在早期上下文时调用此接口。

对于断线后的待处理工具调用，使用 `GET /sessions/:id` 获取 `pending` 列表并从中恢复。参见[工具调用恢复](/zh/tool-call#工具调用恢复)。
