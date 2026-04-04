# Endpoints

Servers may host AAP under any base URL (e.g. `https://api.example.com/v1`). All endpoints below are relative to that base URL.

| Method   | Path                    | Description                            |
| -------- | ----------------------- | -------------------------------------- |
| `GET`    | `/meta`                 | Get available agents info              |
| `GET`    | `/sessions`             | List sessions                          |
| `POST`   | `/sessions`             | Create a new session                   |
| `GET`    | `/sessions/:id`         | Get a session by ID                    |
| `DELETE` | `/sessions/:id`         | Delete a session                       |
| `GET`    | `/sessions/:id/history` | Get session history                    |
| `POST`   | `/sessions/:id/turns`   | Send a new turn to an existing session |

## Authentication

All endpoints accept an API key via the `Authorization` header:

```
Authorization: Bearer <api-key>
```

Auth is optional on `GET /meta` — servers may choose to expose it publicly for capability discovery.

## GET /meta

Returns the protocol version and the list of agents available on this server.

### Response

```json
{
  "version": 2,
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
          "inputSchema": {
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

**Agent fields:**

- `name` — unique identifier for the agent on this server.
- `title` — _(optional)_ human-readable display name.
- `version` — semantic version of the agent.
- `description` — _(optional)_ human-readable description of what the agent does.
- `tools` — server-side tools the agent chooses to expose to the client for configuration (enabling, disabling, or granting trust). Agents may also have unexposed tools that run inline without client involvement, so this is a subset of the agent's actual tools. When a `tool_call` or `tool_result` event references an unknown tool name, clients should handle it gracefully.
- `options` — configurable options the client may set per request.
- `capabilities` — _(optional)_ declares what the agent supports. Individual capability fields may be omitted; clients should treat missing fields as unsupported.
  - `history` — declares what history the agent can return in `GET /sessions/:id/history`:
    - `history.compacted` — if present, the server can return compacted history in `GET /sessions/:id/history`.
    - `history.full` — if present, the server can return full uncompacted history in `GET /sessions/:id/history`.
  - `stream` — declares which stream modes the agent supports. If omitted, clients should assume only `"none"` is supported.
    - `stream.delta` — if present, the agent supports `"delta"` streaming.
    - `stream.message` — if present, the agent supports `"message"` streaming.
    - `stream.none` — if present, the agent supports non-streaming (`"none"`) responses.
  - `application` — declares what application-provided inputs the agent supports:
    - `application.tools` — if present, the agent accepts application-side tools in requests.
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

### Response

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
          "inputSchema": {
            "type": "object",
            "properties": {
              "location": { "type": "string" }
            },
            "required": ["location"]
          }
        }
      ]
    }
  ],
  "next": "dXNlcjoxMjM0NTY3ODk"
}
```

**Fields:**

- `sessions` — array of session objects. Each object has the same shape as `GET /sessions/:id`.
- `next` — _(optional)_ opaque cursor string whose format is defined by the server; pass as `after` to retrieve the next page. Absent when there are no more results.

## POST /sessions

Creates a new session and returns a `sessionId`. Does not run the agent — use `POST /sessions/:id/turns` to send the first message.

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
      "inputSchema": {
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
  - `agent.tools` — _(optional)_ server-side tools to enable. If omitted, all exposed agent tools are disabled.
  - `agent.options` — _(optional)_ key-value pairs matching the agent's declared `options`. If omitted, all options use their default values.
- `messages` — _(optional)_ history to seed the session with (e.g. a system prompt or prior conversation).
- `tools` — _(optional)_ application-side tools with full schema.

**`agent.tools` object fields:**

- `name` — server tool name as declared in `/meta`.
- `trust` — _(optional)_ if `true`, the server may invoke this tool without requesting client permission. Defaults to `false`.

### Response

```json
{ "sessionId": "sess_abc123" }
```

## GET /sessions/:id

Returns the session object for the given session ID.

### Response

```json
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
      "inputSchema": {
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

- `sessionId` — the session identifier.
- `agent` — the agent configuration for this session. `agent.options` of type `"secret"` must not be returned as plaintext; servers should return an opaque placeholder (e.g. `"***"`) instead.
- `tools` — application-side tools declared for this session.

## DELETE /sessions/:id

Deletes a session and its associated history.

### Response

`204 No Content`

## GET /sessions/:id/history

Returns the conversation history for the given session. Only available if the agent declared history capabilities in `GET /meta`.

### Query Parameters

- `type` — _(required)_ which history to return. Accepted values: `compacted`, `full`. If the requested type is not supported by the agent (i.e. not declared in `capabilities.history`), the server returns `404 Not Found`.

### Response

```json
{
  "history": {
    "compacted": [...]
  }
}
```

**Fields:**

- `history` — conversation history. Contains either `history.compacted` or `history.full` depending on the requested `type`.

## POST /sessions/:id/turns

Send a new user turn or tool calling results to an existing session. The server appends the message to its history, runs the agent, and streams or returns the response.

### Request Body

```json
{
  "agent": {
    "tools": [{ "name": "web_search", "trust": true }],
    "options": {
      "language": "English"
    }
  },
  "stream": "delta",
  "messages": [{ "role": "user", "content": "What about Osaka?" }],
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "inputSchema": {
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

- `agent` — _(optional)_ session-level agent overrides. The server must persist these for the lifetime of the session. Agent `name` cannot be changed after session creation.
  - `agent.tools` — _(optional)_ server-side tools. Overrides `agent.tools` declared at session creation.
  - `agent.options` — _(optional)_ key-value option overrides. Options are merged by key: only provided keys are updated, omitted keys remain unchanged. To unset an option, send its default value. The server must persist these for the lifetime of the session.
- `stream` — _(optional)_ response mode. See [Response Modes](/response).
- `messages` — _(required)_ the new turn(s) to append. Typically a single `user` message, but may also be tool results or tool permissions when re-submitting after a `tool_use` stop.
- `tools` — _(optional)_ application-side tools. Overrides tools declared at session creation. The server must persist these for the lifetime of the session.
