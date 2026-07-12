---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) input types — user messages, tool results, tool permissions, and cancellation.
  - - meta
    - property: og:title
      content: Input — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) input types — user messages, tool results, tool permissions, and cancellation.
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/input
  - - meta
    - name: twitter:title
      content: Input — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) input types — user messages, tool results, tool permissions, and cancellation.
---

# User Input

All client-originated input is submitted via [`POST /sessions/:id/input`](/endpoints#post-sessions-id-input). The server persists the input, assigns a session sequence, emits an `input` event to all subscribers, and delivers the input to the active session worker if one exists.

Input types:

- user messages
- tool results
- tool permissions
- cancellation requests

## `type: "user"` — User Message

```json
{
  "type": "user",
  "content": "What's the weather in Tokyo?"
}
```

`content` can be a plain string or an array of content blocks for mixed content such as text and images:

```json
{
  "type": "user",
  "content": [
    { "type": "text", "text": "What's in this image?" },
    { "type": "image", "url": "https://example.com/photo.jpg" }
  ]
}
```

Content block types:

- `{ "type": "text", "text": "..." }` — plain text
- `{ "type": "image", "url": "..." }` — image as an `https://` URL or `data:` URI (e.g. `data:image/png;base64,...`). The server must support the image format as declared in `GET /meta` capabilities.

How the server handles a user message while the worker is active (interrupt or queue) is left to the server implementation.

## `type: "tool"` — Tool Result

```json
{
  "type": "tool",
  "toolCallId": "call_001",
  "content": "Tokyo: 18°C, partly cloudy"
}
```

Each tool result is submitted individually. The client does not need to batch pending tool results into a single request.

## `type: "permission"` — Tool Permission

```json
{
  "type": "permission",
  "toolCallId": "call_002",
  "granted": false,
  "reason": "User denied file system access."
}
```

- `granted` — whether the client allows the server to execute the tool call.
- `reason` — _(optional)_ human-readable explanation, passed to the agent.

Permission input is control input. It is delivered to the worker but is not necessarily appended to model-visible history.

## `type: "cancel"` — Cancellation

```json
{
  "type": "cancel"
}
```

Cancellation is delivered through the same inbox. The agent observes it at the next interruptible boundary.
