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
      content: https://agentapplicationprotocol.com/endpoints
  - - meta
    - name: twitter:title
      content: Endpoints — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Agent Application Protocol (AAP) HTTP endpoints reference — session management, turn submission, history, and authentication.
---

# Endpoints

Servers may host AAP under any base URL (e.g. `https://api.example.com/v1`). All endpoints below are relative to that base URL.

| Method   | Path                    | Description                            |
| -------- | ----------------------- | -------------------------------------- |
| `GET`    | `/meta`                 | Get available agents info              |
| `GET`    | `/sessions`             | List sessions                          |
| `POST`   | `/sessions`             | Create a new session                   |
| `GET`    | `/sessions/:id`         | Get a session by ID                    |
| `PATCH`  | `/sessions/:id`         | Update session configuration           |
| `DELETE` | `/sessions/:id`         | Delete a session                       |
| `POST`   | `/sessions/:id/turns`   | Send a new turn to an existing session |
| `GET`    | `/sessions/:id/history` | Get session history                    |

## Authentication

All endpoints accept an API key via the `Authorization` header:

```
Authorization: Bearer <api-key>
```

Auth is optional on [`GET /meta`](/endpoints#get-meta) — servers may choose to expose it publicly for capability discovery.

## GET /meta

Returns the protocol version and the list of agents available on this server. The current protocol version is **3**.

### Response `200 OK`

```json
{
  "version": 3,
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
          "compacted": {},
          "full": {}
        },
        "stream": {
          "delta": {},
          "message": {},
          "none": {}
        },
        "application": {
          "tools": {}
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

- `version` — the AAP protocol version implemented by this server. The current protocol version is `3`.

**Agent fields:**

- `name` — unique identifier for the agent on this server.
- `title` — _(optional)_ human-readable display name.
- `version` — semantic version of the agent.
- `description` — _(optional)_ human-readable description of what the agent does.
- `tools` — server-side tools the agent chooses to expose to the client for configuration (enabling, disabling, or granting trust). Agents may also have unexposed tools that run inline without client involvement, so this is a subset of the agent's actual tools. When a `tool_call` or `tool_result` event references an unknown tool name, clients should handle it gracefully.
- `options` — configurable options the client may set per request.
- `capabilities` — _(optional)_ declares what the agent supports. Individual capability fields may be omitted; clients should treat missing fields as unsupported.
  - `history` — declares what history the agent can return in [`GET /sessions/:id/history`](/endpoints#get-sessions-id-history):
    - `history.compacted` — if present, the server can return compacted history in [`GET /sessions/:id/history`](/endpoints#get-sessions-id-history).
    - `history.full` — if present, the server can return full uncompacted history in [`GET /sessions/:id/history`](/endpoints#get-sessions-id-history).
  - `stream` — declares which stream modes the agent supports. If omitted, clients should assume only `"none"` is supported.
    - `stream.delta` — if present, the agent supports `"delta"` streaming.
    - `stream.message` — if present, the agent supports `"message"` streaming.
    - `stream.none` — if present, the agent supports non-streaming (`"none"`) responses.
  - `application` — declares what application-provided inputs the agent supports:
    - `application.tools` — if present, the agent accepts client-side tools in requests.
  - `image` — declares what image input the agent supports:
    - `image.http` — if present, the agent accepts `https://` image URLs.
    - `image.data` — if present, the agent accepts `data:` URI (base64) images.

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
      "active": false,
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

Creates a new session. Does not run the agent — use [`POST /sessions/:id/turns`](/endpoints#post-sessions-id-turns) to send the first message.

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
  - `agent.name` — agent name to invoke.
  - `agent.tools` — _(optional)_ server-side tools to enable. If omitted, all exposed server-side tools are disabled.
  - `agent.options` — _(optional)_ key-value pairs matching the agent's declared `options`. If omitted, all options use their default values. Individual omitted options also fall back to their default values.
- `messages` — _(optional)_ history to seed the session with (e.g. a system prompt or prior conversation).
- `tools` — _(optional)_ client-side tools with full schema.

**`agent.tools` object fields:**

- `name` — server tool name as declared in `/meta`.
- `trust` — _(optional)_ if `true`, the server may invoke this tool without requesting client permission. Defaults to `false`.

### Response `201 Created`

Servers must include a `Location` header pointing to the created session resource. The response body is empty.

```http
Location: /sessions/sess_abc123
```

### Retry Behavior

This endpoint does not define an idempotency key. If a client loses the response after creating a session, it should recover by listing known sessions with [`GET /sessions`](/endpoints#get-sessions), then continue with the matching session or delete abandoned sessions.

## GET /sessions/:id

Returns the session object for the given session ID.

### Response `200 OK`

```json
{
  "sessionId": "sess_abc123",
  "active": false,
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
```

**Fields:**

- `sessionId` — the session identifier.
- `active` — whether a turn is currently running for this session. When `true`, [`PATCH /sessions/:id`](/endpoints#patch-sessions-id) and [`POST /sessions/:id/turns`](/endpoints#post-sessions-id-turns) return `409 Conflict`.
- `agent` — the agent configuration for this session. `agent.options` of type `"secret"` must not be returned as plaintext; servers should return an opaque placeholder (e.g. `"***"`) instead.
- `tools` — client-side tools declared for this session.
- `pending` — tool calls waiting for client action. Tool names are unique across client-side and server-side tools, so clients can determine whether each call requires a `tool` result or a `tool_permission` by matching the tool name against the configured tools.

### Response `404 Not Found`

Returned when the session does not exist.

## PATCH /sessions/:id

Updates persisted session configuration. Use this endpoint to change server-side tool settings, agent options, or client-side tools outside of a turn. Agent `name` cannot be changed after session creation.

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
  - `agent.tools` — _(optional)_ server-side tools. Replaces the session's server-side tool settings.
  - `agent.options` — _(optional)_ key-value option updates. Options are merged by key: only provided keys are updated, omitted keys remain unchanged. To unset an option, send its default value.
- `tools` — _(optional)_ client-side tools. Replaces the client-side tools declared for the session.

### Response `200 OK`

Returns the updated session object, with the same shape as [`GET /sessions/:id`](/endpoints#get-sessions-id).

### Response `404 Not Found`

Returned when the session does not exist.

### Response `409 Conflict`

Returned when the session has an active turn. Finish the current turn before updating session configuration.

## DELETE /sessions/:id

Deletes a session and its associated history.

### Response `204 No Content`

Returned on successful deletion.

### Response `404 Not Found`

Returned when the session does not exist.

## POST /sessions/:id/turns

Send a new user turn or tool calling results to an existing session. The server appends the message to its history, runs the agent, and streams or returns the response.

### Request Body

```json
{
  "stream": "delta",
  "messages": [{ "role": "user", "content": "What about Osaka?" }]
}
```

**Fields:**

- `stream` — _(optional)_ response mode. See [Response](/response).
- `messages` — _(required)_ the new turn(s) to append. Typically a single `user` message, but may also be tool results or tool permissions when re-submitting after a `tool_use` stop.

### Response `200 OK`

See [Response](/response) for the response body shape.

### Response `400 Bad Request`

Returned when the submitted turn is invalid. If the session has pending tool calls, the request must include exactly one result or permission for each pending tool call; missing, unknown, or duplicate tool call IDs are invalid.

### Response `404 Not Found`

Returned when the session does not exist.

### Response `409 Conflict`

Returned when the session already has an active turn.

### Retry Behavior

This endpoint does not define an idempotency key. If a request fails or the connection drops, the client should recover by calling [`GET /sessions/:id`](/endpoints#get-sessions-id) to inspect `active` and `pending`, and may call [`GET /sessions/:id/history`](/endpoints#get-sessions-id-history) to restore display or execution state.

## GET /sessions/:id/history

Returns the conversation history for the given session. Only available if the agent declared history capabilities in [`GET /meta`](/endpoints#get-meta).

### Query Parameters

- `type` — _(required)_ which history to return. Accepted values: `compacted`, `full`.
- `start` — _(optional)_ zero-based start index, inclusive. Negative values count back from the end of the selected history.
- `end` — _(optional)_ zero-based end index, exclusive. Negative values count back from the end of the selected history.

If `start` is omitted, it defaults to `0`. If `end` is omitted, it defaults to the selected history length. Servers should clamp out-of-range values to the available history. For example, `start=-50` returns the last 50 messages. Ranges apply to the selected history representation after any compaction, so `type=compacted&start=-20` returns the last 20 messages from the compacted history.

### Response `200 OK`

```json
{
  "history": {
    "compacted": [...]
  }
}
```

**Fields:**

- `history` — conversation history. Contains either `history.compacted` or `history.full` depending on the requested `type`.

### Response `400 Bad Request`

Returned when `start` or `end` is not an integer, or when the normalized range is invalid.

### Response `404 Not Found`

Returned when the session does not exist, or when the requested history `type` is not supported by the agent (i.e. not declared in `capabilities.history`).
