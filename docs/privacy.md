---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) privacy model — how agents keep implementation details confidential, including context engineering, memory, and guardrails.
  - - meta
    - property: og:title
      content: Privacy — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) privacy model — how agents keep implementation details confidential, including context engineering, memory, and guardrails.
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/privacy
  - - meta
    - name: twitter:title
      content: Privacy — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) privacy model — how agents keep implementation details confidential, including context engineering, memory, and guardrails.
---

# Privacy

## Agent Privacy

AAP is designed to let agent providers keep their implementation details confidential. Agents may choose not to expose:

- **Agent loop implementation** — the internal reasoning, retry, and orchestration logic is never visible to the client.
- **Context engineering** — how the agent constructs, orders, or transforms the prompt sent to the LLM is not exposed to the client.
- **Persistent memory** — the existence, structure, and retrieval strategy of any long-term memory store is opaque to the application.
- **Private state** — agents may persist additional state (e.g. user profiles, preferences, internal context) that is never exchanged with the application.
- **Compacted history and compaction strategy** — agents may omit or redact `compacted` history from `GET /sessions/:id/history` responses to protect proprietary summarization or truncation logic.
- **Guardrail implementation** — safety and policy enforcement logic is opaque to the client; violations surface only as a `refusal` stop reason.
- **Model routing** — which underlying LLM or model version is used for a given request is not required to be disclosed.
- **Server-side tool results** — agents may redact or summarize tool results in `tool_result` events and returned messages, keeping sensitive data server-side.

The protocol intentionally exposes only what the application needs to render a response and continue the conversation.

## Application Privacy

Applications may also persist their own private state (e.g. UI state, local user data, business logic context) that is never sent to the agent.

AAP does not define how agent providers handle application data (user messages, tool inputs/outputs, session history, etc.). Applications sending sensitive data to an agent should review the agent provider's data handling policies — including retention, logging, and training use — through the provider's product documentation or terms of service. This negotiation happens outside the protocol.
