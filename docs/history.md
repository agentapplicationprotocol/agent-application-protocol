# History Management

## Server History

The server owns the conversation history for each session. The client never re-sends prior messages — it only sends new turns via `POST /sessions/:id/turns`.

The server must persist at minimum a **compacted history**: a representation of the conversation sufficient for the LLM to continue coherently. The compaction strategy is agent-specific — the server may summarize, truncate, or drop content (e.g. old tool results) as it sees fit. The client is never notified of compaction. Agents may choose not to expose compacted history in `GET /sessions/:id/history` to protect proprietary compaction logic, or may return a redacted version suitable for client display only.

The server may additionally persist the **full uncompacted history** for use cases such as audit trails, history replay, or user-facing conversation display. This is optional and implementation-defined. If provided, the full history must be exact and unredacted — unlike compacted history, no content may be omitted or altered.

Each agent declares its history persistence capabilities in `GET /meta` via `capabilities.history`. History is retrieved via `GET /sessions/:id/history` and must be a `Message[]`-compatible array. The returned history may contain unresolved tool calls (i.e. tool calls without a matching tool result) — clients should be prepared to handle this for [tool call resumption](/tool-call#tool-call-resumption).

## Client History

The client may independently persist the full conversation history on its own side for display purposes. This is entirely client-managed and is never sent back to the server.
