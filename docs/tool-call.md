# Tool Call Flow

## Application-side tool

1. Client → Server: PUT /session or POST /session/:id
2. Client ← Server: SSE: tool_call (toolCallId, name, input)
3. Client ← Server: SSE: turn_stop (stopReason: "tool_use")
4. Client executes tool
5. Client → Server: POST /session/:id (messages: [tool result])
6. Client ← Server: SSE: text_delta, turn_stop (stopReason: "end_turn")

## Server-side tool (trusted, inline)

1. Client → Server: PUT /session or POST /session/:id
2. Client ← Server: SSE: tool_call (toolCallId, name, input)
3. Server executes tool inline
4. Client ← Server: SSE: tool_result (toolCallId, content)
5. Client ← Server: SSE: text_delta, turn_stop (stopReason: "end_turn")

## Server-side tool (permission required)

1. Client → Server: PUT /session or POST /session/:id
2. Client ← Server: SSE: tool_call (toolCallId, name, input)
3. Client ← Server: SSE: turn_stop (stopReason: "tool_use")
4. Client grants or denies permission
5. Client → Server: POST /session/:id (messages: [tool_permission])
6. Server executes tool (or informs LLM of denial), continues streaming
7. Client ← Server: SSE: tool_result (toolCallId, content)
8. Client ← Server: SSE: text_delta, turn_stop (stopReason: "end_turn")

## Parallel tool calls

The server may emit multiple `tool_call` events before `turn_stop`. The client should handle all of them — execute application-side tools and respond to untrusted server tool permissions — then re-submit all results and permissions together in a single `POST /session/:id`. Trusted server-side tools are handled inline by the server and do not require client action.

Example with two application-side tools, one trusted server tool, and one untrusted server tool — all called in parallel:

1. Client → Server: POST /session/:id (messages: [user message])
2. Client ← Server: SSE: tool_call (toolCallId: "call_001", name: "client_tool_1", input: {...})
3. Client ← Server: SSE: tool_call (toolCallId: "call_002", name: "client_tool_2", input: {...})
4. Client ← Server: SSE: tool_call (toolCallId: "call_003", name: "server_tool_trusted", input: {...})
5. Client ← Server: SSE: tool_call (toolCallId: "call_004", name: "server_tool_untrusted", input: {...})
6. Server executes server_tool_trusted inline
7. Client ← Server: SSE: tool_result (toolCallId: "call_003", content: "...")
8. Client ← Server: SSE: turn_stop (stopReason: "tool_use")
9. Client executes client_tool_1 and client_tool_2; grants or denies permission for server_tool_untrusted
10. Client → Server: POST /session/:id (messages: [tool result call_001, tool result call_002, tool_permission call_004])
11. Server executes server_tool_untrusted (or informs LLM of denial)
12. Client ← Server: SSE: tool_result (toolCallId: "call_004", content: "...")
13. Client ← Server: SSE: text_delta, turn_stop (stopReason: "end_turn")

## Tool call resolving

### Server

After the LLM emits tool calls, the server resolves each one:

1. For each `tool_call`, check if it is a trusted server-side tool — if so, execute it inline immediately and emit a `tool_result` event.
2. If any tool calls remain unexecuted, emit `turn_stop` with `stopReason: "tool_use"`.
3. When the client re-submits, append the client-provided tool result messages to history.
4. For each `tool_permission` in the submission, find the matching `tool_call` by `toolCallId` — execute the tool if granted, or record a denial to inform the LLM.
5. Append all `tool_result` events to history and continue the agent loop.

### Client

When the client receives `turn_stop` with `stopReason: "tool_use"`:

1. Collect all `tool_call` events from the current turn.
2. Ignore any whose `toolCallId` already has a matching `tool_result` — those were handled inline by the server.
3. For each remaining tool call, determine whether it is an application-side tool (by matching the name against tools declared in the request) or a server-side tool:
   - Application-side tool: execute it and collect the result.
   - Server-side tool: prompt the user or apply policy to grant or deny permission.
4. Submit all results and permissions together in a single `POST /session/:id`.

## Tool call resumption

If a client has no in-memory state (e.g. after a restart or recovery), it can call `GET /session/:id` to retrieve the session history and resume from where it left off:

1. Fetch session history via `GET /session/:id`.
2. Inspect the last assistant message in history — if it has unresolved tool calls (no matching `tool` message in history), the last turn ended with `stopReason: "tool_use"` and requires client action.
3. Apply the same client-side resolving logic: identify application-side tools to execute and server-side tools requiring permission.
4. Submit results and permissions via `POST /session/:id` to continue.
