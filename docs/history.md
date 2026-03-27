# History Management

The server owns the conversation history for each session. The client never re-sends prior messages — it only sends new turns via `POST /session/:id`.

The server must persist at minimum a **compacted history**: a representation of the conversation sufficient for the LLM to continue coherently. The compaction strategy is agent-specific — the server may summarize, truncate, or drop content (e.g. old tool results) as it sees fit. The client is never notified of compaction. Agents may choose not to expose compacted history in `GET /session/:id` to protect proprietary compaction logic.

The server may additionally persist the **full uncompacted history** for use cases such as audit trails, history replay, or user-facing conversation display. This is optional and implementation-defined.

Each agent declares its history persistence capabilities in `GET /meta` via `capabilities.history`.
