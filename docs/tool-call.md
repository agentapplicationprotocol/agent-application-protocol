# Tool Call Flow

## Application-side tool

```
1. Client  →  PUT /session or POST /session/:id
2. Server  →  SSE: tool_call  (toolCallId, name, input)
3. Server  →  SSE: turn_stop  (stopReason: "tool_use")
4. Client executes tool
5. Client  →  POST /session/:id  (messages: [tool result])
6. Server  →  SSE: text_delta, turn_stop  (stopReason: "end_turn")
```

## Server-side tool (trusted, inline)

```
1. Client  →  PUT /session or POST /session/:id
2. Server  →  SSE: tool_call  (toolCallId, name, input)
3. Server executes tool inline
4. Server  →  SSE: tool_result  (toolCallId, content)
5. Server  →  SSE: text_delta, turn_stop  (stopReason: "end_turn")
```

## Server-side tool (permission required)

```
1. Client  →  PUT /session or POST /session/:id
2. Server  →  SSE: tool_call  (toolCallId, name, input)
3. Server  →  SSE: turn_stop  (stopReason: "tool_use")
4. Client grants or denies permission
5. Client  →  POST /session/:id  (messages: [tool_permission])
6. Server executes tool (or informs LLM of denial), continues streaming
7. Server  →  SSE: text_delta, turn_stop  (stopReason: "end_turn")
```

## Parallel tool calls

The server may emit multiple `tool_call` events before `message_stop`. The client should handle all of them — execute application-side tools and respond to untrusted server tool permissions — then re-submit all results and permissions together in a single `POST /session/:id`. Trusted server-side tools are handled inline by the server and do not require client action.
