---
head:
  - - meta
    - name: description
      content: Agent Application Protocol (AAP) HTTP endpoints reference — session management, turn submission, history, and authentication.
  - - meta
    - property: og:title
      content: Endpoints — Agent Application Protocol
  - - meta
    - property: og:description
      content: Agent Application Protocol (AAP) HTTP endpoints reference — session management, turn submission, history, and authentication.
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/endpoint
  - - meta
    - name: twitter:title
      content: Endpoints — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) HTTP endpoints reference — session management, turn submission, history, and authentication.
---

# Endpoints

Servers may host AAP under any base URL (e.g. `https://api.example.com/v1`). All endpoints below are relative to that base URL.

| Method   | Path                          | Description                                    |
| -------- | ----------------------------- | ---------------------------------------------- |
| `GET`    | `/meta`                       | Get available agents info                      |
| `GET`    | `/sessions`                   | List sessions                                  |
| `POST`   | `/sessions`                   | Create a new session                           |
| `GET`    | `/sessions/:id`               | Get a session by ID                            |
| `PATCH`  | `/sessions/:id`               | Update session configuration                   |
| `DELETE` | `/sessions/:id`               | Delete a session                               |
| `POST`   | `/sessions/:id/input`         | Publish input to the session inbox             |
| `GET`    | `/sessions/:id/events/stream` | Subscribe to the session event stream over SSE |
| `GET`    | `/sessions/:id/history`       | Get session history                            |

## Authentication

All endpoints accept an API key via the `Authorization` header:

```
Authorization: Bearer <api-key>
```

Auth is optional on [`GET /meta`](/endpoints#get-meta) — servers may choose to expose it publicly for capability discovery.

## GET /meta

Returns the protocol version and the list of agents available on this server. The current protocol version is **4**.

### Response `200 OK`

```json
{
  "version": 4,
  "agents": [
    {
      "name": "research-agent",
      "title": "Research Agent",
      "version": "1.2.0",
      "description": "A research agent that can search the web and summarize information.",
      "tools": [
        {
          "name": "web_search",
          "title": "Web Search",
          "description": "Search the web for information",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "Search query" }
            },
            "required": ["query"]
          }
        }
      ],
      "options": [
        {
          "name": "model",
          "title": "Model",
          "description": "The LLM model to use for this agent.",
          "type": "select",
          "options": ["claude-sonnet-4-5", "claude-opus-4-5"],
          "default": "claude-sonnet-4-5"
        },
        {
          "name": "language",
          "title": "Response Language",
          "description": "The language the agent should respond in.",
          "type": "text",
          "default": "English"
        }
      ],
      "capabilities": {
        "history": {
          "tail": {}
        },
        "stream": {
          "delta": {},
          "message": {}
        },
        "image": {
          "http": {},
          "data": {}
        }
      }
    }
  ]
}
```

**Response fields:**

- `version` — the AAP protocol version implemented by this server. The current protocol version is `4`.

**Agent fields:**

- `name` — unique identifier for the agent on this server.
- `title` — _(optional)_ human-readable display name.
- `version` — semantic version of the agent.
- `description` — _(optional)_ human-readable description of what the agent does.
- `tools` — server-side tools the agent chooses to expose to the client for configuration (enabling, disabling, or granting trust). Agents may also have unexposed tools that run inline without client involvement, so this is a subset of the agent's actual tools. When a `tool_call` or `tool_result` event references an unknown tool name, clients should handle it gracefully.
- `options` — configurable options the client may set per request.
- `capabilities` — _(optional)_ declares what the agent supports. Individual capability fields may be omitted; clients should treat missing fields as unsupported.
  - `history` — if present, the agent supports history retrieval via [`GET /sessions/:id/history`](/endpoints#get-sessions-id-history). The sub-keys declare which query modes are supported.
    - `history.tail` — if present, the agent supports tail-based paging: no cursor returns the most recent messages, and the `before` cursor pages backward through older messages.
  - `stream` — declares which stream modes the agent supports. If absent, the client must treat the agent as supporting no streaming modes and any `stream` parameter on `GET /sessions/:id/events/stream` returns `400 Bad Request`.
    - `stream.delta` — if present, the agent supports streaming text as incremental `text_delta` and `thinking_delta` events.
    - `stream.message` — if present, the agent supports delivering complete `text` and `thinking` events.
  - `image` — declares what image input the agent supports:
    - `image.http` — if present, the agent accepts `https://` image URLs.
    - `image.data` — if present, the agent accepts `data:` URI (base64) images.

**Client-side tools** are a core part of the protocol. All agents must accept client-side tools. There is no capability flag for this — it is not optional.

**Option fields:**

- `name` — identifier used as the key in the request `options` object.
- `title` — _(optional)_ human-readable display name.
- `description` — _(optional)_ explains what this option does.
- `type` — `"text"` for free-form string input, `"select"` for a fixed list of choices, `"secret"` for sensitive values (e.g. API keys) that should be masked in the UI; servers may persist secret values in secure storage (e.g. AWS Secrets Manager).
- `options` — _(required for `select`)_ list of allowed values.
- `default` — default value used if the client omits this option.

## GET /sessions

Returns a paginated list of sessions.

### Query Parameters

- `after` — _(optional)_ pagination cursor. Pass the `next` value from the previous response to get the next page.

Servers choose the page size. Clients should follow `next` cursors until `next` is absent instead of assuming a fixed number of sessions per page.

### Response `200 OK`

```json
{
  "sessions": [
    {
      "sessionId": "sess_abc123",
      "agent": {
        "name": "research-agent",
        "tools": [{ "name": "web_search", "trust": true }],
        "options": {
          "model": "claude-opus-4-5",
          "language": "Japanese"
        }
      },
      "tools": [
        {
          "name": "get_weather",
          "description": "Get current weather for a location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": { "type": "string" }
            },
            "required": ["location"]
          }
        }
      ],
      "pending": []
    }
  ],
  "next": "dXNlcjoxMjM0NTY3ODk"
}
```

**Fields:**

- `sessions` — array of session objects. Each object has the same shape as [`GET /sessions/:id`](/endpoints#get-sessions-id).
- `next` — _(optional)_ opaque cursor string whose format is defined by the server; pass as `after` to retrieve the next page. Absent when there are no more results.

## POST /sessions

Creates a new session. When the agent worker starts is an implementation detail left to the server.

### Request Body

```json
{
  "agent": {
    "name": "research-agent",
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "model": "claude-opus-4-5",
      "language": "Japanese"
    }
  },
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What's the capital of France?" },
    { "role": "assistant", "content": "The capital of France is Paris." }
  ],
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ]
}
```

**Fields:**

- `agent` — _(required)_ agent configuration.
  - `agent.name` — agent name to invoke, as declared in `GET /meta`.
  - `agent.tools` — _(optional)_ server-side tools to enable. If omitted, all exposed server-side tools are disabled.
  - `agent.options` — _(optional)_ key-value pairs matching the agent's declared `options`. If omitted, all options use their default values. Individual omitted options also fall back to their default values.
- `messages` — _(optional)_ messages to seed the session with, such as a system prompt or a prior conversation to resume from.
- `tools` — _(optional)_ client-side tools with full schema.

**`agent.tools` object fields:**

- `name` — server tool name as declared in `/meta`.
- `trust` — _(optional)_ if `true`, the server may invoke this tool without requesting client permission. Defaults to `false`.

### Response `201 Created`

The `Location` header contains the absolute URL of the created session. The response body is empty.

```http
201 Created
Location: https://agent-1.example.com/sessions/sess_abc123
```

The client must use the URL returned in `Location` as the base for all subsequent requests on this session — including `/input`, `/events/stream`, and `/history`. In a distributed deployment, the session may be hosted on a different origin than the one used to create it.

This endpoint does not define an idempotency key. Creating a session only allocates a lightweight record and is safe to retry. If a client loses the response, it can recover by listing existing sessions with [`GET /sessions`](/endpoints#get-sessions) and continuing with the matching session, or by creating a new one.

### Response `400 Bad Request`

Returned when the request body fails validation, such as an unknown agent tool name, an option value that does not match the declared type, or malformed `messages` or `tools`.

### Response `404 Not Found`

Returned when the agent name specified in `agent.name` does not exist on this server.

## GET /sessions/:id

Returns the current configuration and pending tool calls for a session. The primary use case is reconnection — clients call this endpoint to reconcile pending tool calls after a disconnect.

### Response `200 OK`

```json
{
  "sessionId": "sess_abc123",
  "agent": {
    "name": "research-agent",
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "model": "claude-opus-4-5",
      "language": "Japanese",
      "apiKey": true
    }
  },
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ],
  "pending": []
}
```

**Fields:**

- `sessionId` — the session identifier.
- `agent` — the agent configuration for this session, as set at creation or last updated via `PATCH /sessions/:id`. Options of type `"secret"` are returned as a boolean — `true` if a value is stored, `false` if not — and must never be returned as plaintext.
- `tools` — client-side tools declared for this session.
- `pending` — tool calls waiting for client action. Clients can determine whether each call requires a `tool_result` or a `tool_permission` by matching the tool name against the configured tools.

### Response `404 Not Found`

Returned when the session does not exist.

## PATCH /sessions/:id

Updates persisted session configuration. Use this endpoint to replace client-side tools or update agent options. Agent `name` cannot be changed after session creation.

### Request Body

```json
{
  "agent": {
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "language": "English"
    }
  },
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }
  ]
}
```

**Fields:**

- `agent` — _(optional)_ session-level agent updates.
  - `agent.tools` — _(optional)_ server-side tool settings. Replaces the session's server-side tool settings entirely.
  - `agent.options` — _(optional)_ key-value option updates. Merged by key: only provided keys are updated, omitted keys remain unchanged. The server overwrites the stored value with whatever is provided. Clients must omit secret fields they do not intend to change.
- `tools` — _(optional)_ client-side tools. Replaces the full set of client-side tools declared for the session.

### Response `200 OK`

Returns the updated session object, with the same shape as [`GET /sessions/:id`](/endpoints#get-sessions-id).

### Response `400 Bad Request`

Returned when the request body fails validation, such as an unknown agent tool name, or an option value that does not match the declared type.

### Response `404 Not Found`

Returned when the session does not exist.

## DELETE /sessions/:id

Deletes a session and its associated history.

### Response `204 No Content`

Returned on successful deletion.

### Response `404 Not Found`

Returned when the session does not exist.

## POST /sessions/:id/input

All client-originated input goes through this endpoint. See [Input](/inputs) for the full list of input types and their schemas.

### Response `200 OK`

Empty body.

### Response `400 Bad Request`

Returned when the tool call referenced by `toolCallId` does not exist or has already been resolved.

### Response `404 Not Found`

Returned when the session does not exist.

## GET /sessions/:id/events/stream

Returns `Content-Type: text/event-stream`. Multiple subscribers can connect to the same session simultaneously. See [Event Stream](/events) for query parameters, event types, reconnection behavior, and idle close.

### Response `404 Not Found`

Returned when the session does not exist.

## GET /sessions/:id/history

Returns the persisted conversation history for the given session. Only available if the agent declared `history` in [`GET /meta`](/endpoints#get-meta) capabilities.

Clients use this endpoint to restore session context after a disconnect, or to page through earlier conversation history. History is returned in reverse chronological order — most recent messages first.

### Query Parameters

- `before` — _(optional)_ opaque cursor returned by a previous response. Returns messages older than the cursor. Omit to retrieve the most recent messages.

### Response `200 OK`

```json
{
  "history": [
    {
      "id": "msg_abc125",
      "timestamp": "2026-07-12T13:00:05Z",
      "role": "assistant",
      "content": "Let me check that for you."
    },
    {
      "id": "evt_001",
      "timestamp": "2026-07-12T13:00:00Z",
      "role": "user",
      "content": "What's the weather in Tokyo?"
    },
    {
      "id": "msg_abc124",
      "timestamp": "2026-07-12T12:59:50Z",
      "role": "system",
      "content": "You are a helpful assistant."
    }
  ],
  "before": "dXNlcjoxMjM0NTY3ODk"
}
```

**Fields:**

- `history` — array of messages in reverse chronological order (most recent first).
  - `id` — stable identifier for the message, useful for deduplication when merging local and remote history.
  - `timestamp` — ISO 8601 server timestamp of when the message was recorded.
  - `role` — `"system"`, `"user"`, or `"assistant"`.
  - `content` — message content.
- `before` — _(optional)_ opaque cursor; pass as `before` to retrieve older messages. Absent when there is no more history.

### Response `404 Not Found`

Returned when the session does not exist, or when the agent does not support history retrieval.
