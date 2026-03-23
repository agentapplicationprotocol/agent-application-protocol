# Agent Application Protocol — Protocol Specification

## Overview

The Agent Application Protocol (AAP) defines how Applications and Agents communicate over HTTP.

- **Application** acts as the client: owns the UI, accepts user input, provides tools.
- **Agent** acts as the server: runs the agent loop, manages LLM interaction and history.

Communication uses HTTP with Server-Sent Events (SSE) for streaming responses, modeled after streaming LLM APIs.

There are two kinds of tools:

- **Application-side tools**: owned and executed by the Application. Declared in the request with full schema. When the LLM requests one, the agent emits a `tool_call` event and stops; the client executes it and re-submits with the result.
- **Server-side tools**: owned and executed by the Agent (e.g. web search, code execution). Declared by the server in `GET /meta`. The client references them by name only in requests. If `trust: true`, the server invokes the tool inline and streams the result back without stopping.

---

## Authentication

Both endpoints accept an API key via the `Authorization` header:

```
Authorization: Bearer <api-key>
```

Auth is optional on `GET /meta` — servers may choose to expose it publicly for capability discovery.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meta` | Get available agents and their tools |
| `POST` | `/agent` | Invoke the agent; streams SSE response |

---

## GET /meta

Returns the protocol version and the list of agents available on this server.

### Response

```json
{
  "version": 1,
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
      ]
    }
  ]
}
```

**Agent fields:**

- `name` — unique identifier for the agent on this server.
- `title` — *(optional)* human-readable display name.
- `version` — semantic version of the agent.
- `description` — human-readable description of what the agent does.
- `tools` — server-side tools this agent can invoke. The client references them by name in requests.
- `options` — configurable options the client may set per request.

**Option fields:**

- `name` — identifier used as the key in the request `options` object.
- `title` — *(optional)* human-readable display name.
- `description` — explains what this option does.
- `type` — `"text"` for free-form string input, `"select"` for a fixed list of choices.
- `options` — *(required for `select`)* list of allowed values.
- `default` — default value used if the client omits this option.

---

## POST /agent

Invoke the agent. The response format depends on the `stream` field in the request body.

### Request Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |

### Request Body

```json
{
  "agent": "research-agent",
  "stream": "chunk",
  "messages": [
    { "role": "user", "content": "What's the weather in Tokyo?" }
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
  ],
  "serverTools": [
    { "name": "web_search", "trust": false }
  ],
  "options": {
    "model": "claude-opus-4-5",
    "language": "Japanese"
  }
}
```

**Fields:**

- `agent` — *(required)* agent name to invoke.
- `stream` — *(optional)* response mode: `"chunk"`, `"message"`, or `"none"` (default). See [Response Modes](#response-modes).
- `messages` — *(required)* conversation history. See [Message Format](#message-format).
- `tools` — *(optional)* application-side tools with full schema.
- `serverTools` — *(optional)* server-side tools to enable.
- `options` — *(optional)* key-value pairs matching the agent's declared `options`.

**`serverTools` object fields:**

- `name` — server tool name as declared in `/meta`.
- `trust` — if `true`, the server may invoke this tool without requesting client permission.

### Response Modes

#### `stream: "chunk"`

`Content-Type: text/event-stream`. The server streams SSE events as they are produced. Text is sent as incremental `text_delta` chunks; thinking is sent as incremental `thinking_delta` chunks.

#### `stream: "message"`

`Content-Type: text/event-stream`. The server streams SSE events, but text is sent as a single complete `text` event per message rather than incremental chunks. Tool call events still arrive as they happen.

#### `stream: "none"` (default)

`Content-Type: application/json`. The server returns a single JSON response after the agent finishes. If the agent needs a client-side tool result, it returns a `tool_use` stop reason in the JSON body and the client re-submits with results — same flow as SSE, just without streaming.

### Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | `text/event-stream` for `chunk`/`message` modes; `application/json` for `none` |

### SSE Events (`stream: "chunk"` and `stream: "message"`)

Each event is a JSON object on the `data:` field.

#### `message_start`

Emitted at the beginning of the stream.

```
event: message_start
data: {}
```

#### `text_delta`

*(chunk mode only)* An incremental chunk of the agent's text response.

```
event: text_delta
data: {"delta": "The weather in Tokyo is..."}
```

#### `thinking_delta`

*(chunk mode only)* An incremental chunk of the agent's thinking/reasoning.

```
event: thinking_delta
data: {"delta": "The user is asking about Tokyo weather, I should..."}
```

#### `text`

*(message mode only)* The complete agent text response.

```
event: text
data: {"text": "The weather in Tokyo is 18°C, partly cloudy."}
```

#### `thinking`

*(message mode only)* The complete agent thinking/reasoning.

```
event: thinking
data: {"thinking": "The user is asking about Tokyo weather, I should use the weather tool..."}
```

#### `tool_call`

The agent wants to invoke a tool. Multiple `tool_call` events may be emitted before `message_stop` — the client should collect all of them and handle in parallel.

For **application-side tools**, the client executes the tool and re-submits with results.

For **server-side tools** where `trust: true`, the server invokes the tool inline and emits a `tool_result` event with the result — no client round-trip needed. The agent continues streaming without stopping.

For **server-side tools** where `trust: false`, the server stops and the client responds with a permission decision. The agent continues regardless — if denied, the LLM is informed the tool was not permitted.

The agent only emits `message_stop` with `stopReason: "tool_use"` if there is at least one application-side tool call or one untrusted server-side tool call that requires client action. If all tool calls are trusted server-side tools, the agent handles them inline and continues without stopping.

```
event: tool_call
data: {"toolCallId": "call_001", "name": "get_weather", "input": {"location": "Tokyo"}}
```

Tool names must be unique across `tools` and `serverTools` in a single request. The client identifies whether a tool call is application-side or server-side by matching the name against its request.

#### `tool_result`

*(server-side trusted tools only)* Emitted after the server executes a trusted tool inline. The agent continues streaming after this event.

```
event: tool_result
data: {"toolCallId": "call_001", "content": "Tokyo: 18°C, partly cloudy"}
```

#### `message_stop`

Emitted at the end of the stream.

```
event: message_stop
data: {"stopReason": "end_turn"}
```

**Stop reasons:**

| `stopReason` | Meaning |
|---|---|
| `end_turn` | Agent finished normally |
| `tool_use` | Agent emitted one or more `tool_call` events requiring client action (application-side tool or untrusted server-side tool) |
| `max_tokens` | Hit token limit |
| `refusal` | LLM refused to respond (e.g. safety policy) |
| `error` | Server encountered an error mid-stream |
| `cancelled` | Client closed the connection |

### JSON Response (`stream: "none"`)

Normal response:

```json
{
  "stopReason": "end_turn",
  "messages": [
    { "role": "assistant", "content": "The weather in Tokyo is 18°C, partly cloudy." }
  ]
}
```

With thinking:

```json
{
  "stopReason": "end_turn",
  "messages": [
    {
      "role": "assistant",
      "content": [
        { "type": "thinking", "thinking": "The user wants Tokyo weather. I should use the get_weather tool." },
        { "type": "text", "text": "The weather in Tokyo is 18°C, partly cloudy." }
      ]
    }
  ]
}
```

When an application-side tool is needed, or an untrusted server-side tool requires permission:

```json
{
  "stopReason": "tool_use",
  "messages": [
    {
      "role": "assistant",
      "content": [
        { "type": "tool_use", "toolCallId": "call_001", "name": "get_weather", "input": { "location": "Tokyo" } }
      ]
    }
  ]
}
```

The client appends the tool result (or `tool_permission` for server-side tools) to its history and re-submits.

When a trusted server-side tool was called inline, the full exchange is included in the returned messages:

```json
{
  "stopReason": "end_turn",
  "messages": [
    {
      "role": "assistant",
      "content": [
        { "type": "tool_use", "toolCallId": "call_002", "name": "web_search", "input": { "query": "Tokyo weather today" } }
      ]
    },
    {
      "role": "tool",
      "toolCallId": "call_002",
      "content": "Tokyo: 18°C, partly cloudy"
    },
    {
      "role": "assistant",
      "content": "The weather in Tokyo is 18°C, partly cloudy."
    }
  ]
}
```

---

## Message Format

Messages follow OpenAI-compatible roles.

### User message

```json
{ "role": "user", "content": "What's the weather in Tokyo?" }
```

`content` may be a string or an array of content blocks.

### Assistant message

```json
{
  "role": "assistant",
  "content": [
    { "type": "thinking", "thinking": "The user wants the weather in Tokyo. I should use the get_weather tool." },
    { "type": "text", "text": "Let me check that for you." },
    { "type": "tool_use", "toolCallId": "call_001", "name": "get_weather", "input": { "location": "Tokyo" } }
  ]
}
```

### Tool result message

```json
{ "role": "tool", "toolCallId": "call_001", "content": "Tokyo: 18°C, partly cloudy" }
```

`content` may be a string or an array of content blocks.

### Tool permission message

Used to respond to a server-side `tool_call`. The agent continues and informs the LLM of the decision.

Once the server has processed the permission request, the client must remove these messages from its history before subsequent requests — they are transient and not part of the persistent conversation history.

When `granted: false`, the client may include an optional `reason` string that the agent will relay to the LLM.

```json
{ "role": "tool_permission", "toolCallId": "call_002", "granted": true }
```

```json
{ "role": "tool_permission", "toolCallId": "call_002", "granted": false, "reason": "User declined" }
```

---

## Tool Call Flow

### Application-side tool

```
1. Client  →  POST /agent  (messages: [...history])
2. Server  →  SSE: tool_call  (toolCallId, name, input)
3. Server  →  SSE: message_stop  (stopReason: "tool_use")
4. Client executes tool
5. Client  →  POST /agent  (messages: [...history, assistant tool_use, tool result])
6. Server  →  SSE: delta, message_stop  (stopReason: "end_turn")
```

### Server-side tool (trusted, inline)

```
1. Client  →  POST /agent  (messages: [...history])
2. Server  →  SSE: tool_call  (toolCallId, name, input)
3. Server executes tool inline
4. Server  →  SSE: tool_result  (toolCallId, content)
5. Server  →  SSE: text_delta / message_stop  (stopReason: "end_turn")
```

### Server-side tool (permission required)

```
1. Client  →  POST /agent  (messages: [...history])
2. Server  →  SSE: tool_call  (toolCallId, name, input)
3. Server  →  SSE: message_stop  (stopReason: "tool_use")
4. Client grants or denies permission
5. Client  →  POST /agent  (messages: [...history, tool_permission])
6. Server executes tool (or informs LLM of denial), continues streaming
7. Server  →  SSE: delta, message_stop  (stopReason: "end_turn")
```

### Parallel tool calls

The server may emit multiple `tool_call` events before `message_stop`. The client should handle all of them — execute application-side tools and respond to untrusted server tool permissions — then re-submit all results and permissions together in a single request. Trusted server-side tools are handled inline by the server and do not require client action.

---

## Sequence Diagram

```mermaid
sequenceDiagram
    participant App as Application (Client)
    participant Agent as Agent (Server)

    App->>Agent: GET /meta
    Agent-->>App: agents, tools, options

    loop Conversation turn
        App->>Agent: POST /agent (messages, tools, serverTools)
        Agent-->>App: SSE: message_start
        Agent-->>App: SSE: text_delta (repeats)
        opt Trusted server tool call
            Agent-->>App: SSE: tool_call
            Note right of Agent: Server executes tool inline
            Agent-->>App: SSE: tool_result
            Agent-->>App: SSE: text_delta (repeats)
        end
        opt Application-side or untrusted server tool call
            Agent-->>App: SSE: tool_call
            Agent-->>App: SSE: message_stop (stopReason: tool_use)
            Note right of App: App executes tool / grants permission
            App->>Agent: POST /agent (messages with tool result / permission)
            Agent-->>App: SSE: message_start
            Agent-->>App: SSE: text_delta (repeats)
        end
        Agent-->>App: SSE: message_stop (stopReason: end_turn)
    end
```

---

## Schema

```typescript
// GET /meta response
interface MetaResponse {
  version: number;
  agents: AgentInfo[];
}

interface AgentInfo {
  name: string;
  title?: string;
  version: string;                      // semantic version
  description: string;
  tools: ToolSpec[];
  options: AgentOption[];
}

type AgentOption =
  | { name: string; title?: string; description: string; type: "text"; default: string }
  | { name: string; title?: string; description: string; type: "select"; options: string[]; default: string };

// POST /agent request
interface AgentRequest {
  agent: string;
  stream?: "chunk" | "message" | "none"; // default: "none"
  messages: Message[];
  tools?: ToolSpec[];
  serverTools?: ServerToolRef[];
  options?: Record<string, string>;
}

interface ServerToolRef {
  name: string;
  trust: boolean;
}

// Tool spec (application-side, declared in request; server-side, declared in /meta)
interface ToolSpec {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
}

// Messages
type Message =
  | { role: "user"; content: string | ContentBlock[] }
  | { role: "assistant"; content: string | ContentBlock[] }
  | { role: "tool"; toolCallId: string; content: string | ContentBlock[] }
  | { role: "tool_permission"; toolCallId: string; granted: boolean; reason?: string };

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; toolCallId: string; name: string; input: Record<string, unknown> }
  | { type: "image"; mimeType: string; data: string };

// SSE event data (stream: "chunk" and stream: "message")
type SSEEvent =
  | { event: "message_start" }
  | { event: "text_delta"; delta: string }           // chunk mode only
  | { event: "thinking_delta"; delta: string }       // chunk mode only
  | { event: "text"; text: string }                  // message mode only
  | { event: "thinking"; thinking: string }          // message mode only
  | { event: "tool_call"; toolCallId: string; name: string; input: Record<string, unknown> }
  | { event: "tool_result"; toolCallId: string; content: string | ContentBlock[] } // trusted server tools only
  | { event: "message_stop"; stopReason: StopReason };

// JSON response body (stream: "none")
interface AgentResponse {
  stopReason: StopReason;
  messages: Message[];
}

type StopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error" | "cancelled";
```

---

## Extensibility

- Add custom fields via `_meta` on any object.
