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

# 历史记录管理

## 服务端历史

服务器拥有每个会话的对话历史。客户端永远不会重新发送之前的消息 —— 它只通过 `POST /sessions/:id/turns` 发送新轮次。

服务器必须至少持久化**压缩历史**：足以让 LLM 连贯继续对话的表示。压缩策略因 Agent 而异 —— 服务器可以根据需要总结、截断或丢弃内容（如旧的工具结果）。客户端不会收到压缩通知。Agent 可以选择不在 `GET /sessions/:id/history` 中暴露压缩历史以保护专有压缩逻辑，或返回仅适合客户端显示的删减版本。

服务器还可以额外持久化**完整未压缩历史**，用于审计跟踪、历史回放或面向用户的对话显示等场景。这是可选的，由实现定义。若提供，完整历史必须精确且未删减 —— 与压缩历史不同，不得省略或修改任何内容。

每个 Agent 在 `GET /meta` 中通过 `capabilities.history` 声明其历史持久化能力。历史通过 `GET /sessions/:id/history` 获取，必须是兼容 `Message[]` 的数组。返回的历史可能包含未解决的工具调用（即没有匹配工具结果的工具调用）—— 客户端应准备好处理这种情况以进行[工具调用恢复](/zh/tool-call#工具调用恢复)。

## 客户端历史

客户端可以在自己这侧独立持久化完整对话历史用于显示目的。这完全由客户端管理，永远不会发送回服务器。

## 历史一致性

客户端和服务端历史可能彼此不一致 —— 这是设计上的有意为之。双方都不会将自己的历史发送给对方。

- 客户端历史仅用于显示目的。
- 服务端完整历史用于审计和记录保存。
- 服务端压缩历史是 Agent 提供给 LLM 进行推理的内容。注意，即使服务器返回的压缩历史也可能不完全反映发送给 LLM 的内容。
