---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) 隐私模型 —— Agent 如何保持实现细节的保密性，包括上下文工程、记忆和护栏。
  - - meta
    - property: og:title
      content: 隐私 — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) 隐私模型 —— Agent 如何保持实现细节的保密性，包括上下文工程、记忆和护栏。
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/zh/privacy
  - - meta
    - name: twitter:title
      content: 隐私 — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) 隐私模型 —— Agent 如何保持实现细节的保密性，包括上下文工程、记忆和护栏。
---

# 隐私

## Agent 隐私

AAP 旨在让 Agent 提供商保持其实现细节的保密性。Agent 可以选择不暴露：

- **Agent 循环实现** —— 内部推理、重试和编排逻辑对客户端不可见。
- **上下文工程** —— Agent 如何构建、排序或转换发送给 LLM 的提示词不对客户端暴露。
- **持久化记忆** —— 任何长期记忆存储的存在、结构和检索策略对应用不透明。
- **私有状态** —— Agent 可以持久化额外状态（如用户画像、偏好、内部上下文），这些状态永远不会与应用交换。
- **压缩历史和压缩策略** —— Agent 可以在 `GET /sessions/:id/history` 响应中省略或删减 `compacted` 历史，以保护专有的总结或截断逻辑。
- **护栏实现** —— 安全和策略执行逻辑对客户端不透明；违规仅以 `refusal` 停止原因呈现。
- **模型路由** —— 给定请求使用哪个底层 LLM 或模型版本不需要披露。
- **服务端工具结果** —— Agent 可以在 `tool_result` 事件和返回的消息中删减或总结工具结果，将敏感数据保留在服务端。

协议有意只暴露应用渲染响应和继续对话所需的内容。

## 应用隐私

应用也可以持久化自己的私有状态（如 UI 状态、本地用户数据、业务逻辑上下文），这些状态永远不会发送给 Agent。

AAP 不定义 Agent 提供商如何处理应用数据（用户消息、工具输入/输出、会话历史等）。向 Agent 发送敏感数据的应用应通过Agent提供商的产品文档或服务条款审查 Agent 提供商的数据处理政策 —— 包括数据保留、日志记录和训练使用。这种协商发生在本协议之外。
