# Privacy

## Agent Privacy

AAP is designed to let agent providers keep their implementation details confidential. Agents may choose not to expose:

- **Agent loop implementation** — the internal reasoning, retry, and orchestration logic is never visible to the client.
- **Compacted history and compaction strategy** — agents may omit `compacted` from `GET /session/:id` responses to protect proprietary summarization or truncation logic.
- **Guardrail implementation** — safety and policy enforcement logic is opaque to the client; violations surface only as a `refusal` stop reason.
- **Model routing** — which underlying LLM or model version is used for a given request is not required to be disclosed.
- **Server-side tool results** — agents may redact or summarize tool results in `tool_result` events and returned messages, keeping sensitive data server-side.

The protocol intentionally exposes only what the application needs to render a response and continue the conversation.

## Application Data Privacy

AAP does not define how agent providers handle application data (user messages, tool inputs/outputs, session history, etc.). Applications sending sensitive data to an agent should review the agent provider's data handling policies — including retention, logging, and training use — through the provider's product documentation or terms of service. This negotiation happens outside the protocol.
