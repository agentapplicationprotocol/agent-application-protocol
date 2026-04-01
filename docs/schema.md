# Schema

## AgentConfig

```typescript
/** References a server-side tool to enable for a session. */
interface ServerToolRef {
  /** Server tool name as declared in `/meta`. */
  name: string;
  /** If `true`, the server may invoke this tool without requesting client permission. Defaults to `false`. */
  trust?: boolean;
}

/** Agent configuration supplied with a request. */
interface AgentConfig {
  /** Agent name to invoke. */
  name: string;
  /** Server-side tools to enable. If omitted, all exposed agent tools are disabled. */
  tools?: ServerToolRef[];
  /** Key-value pairs matching the agent's declared options. */
  options?: Record<string, string>;
}
```

## AgentInfo

```typescript
/** Describes an agent available on the server, as returned by `GET /meta`. */
interface AgentInfo {
  /** Unique identifier for the agent on this server. */
  name: string;
  /** Human-readable display name. */
  title?: string;
  /** Semantic version of the agent. */
  version: string;
  description?: string;
  /** Server-side tools the agent exposes to the client for configuration. */
  tools?: ToolSpec[];
  /** Configurable options the client may set per request. */
  options?: AgentOption[];
  /** Declares what the agent supports. Missing fields should be treated as unsupported. */
  capabilities?: {
    /** Declares what history the agent can return in `GET /session/:id`. */
    history?: {
      /** Server can return compacted history. */
      compacted?: Record<string, never>;
      /** Server can return full uncompacted history. */
      full?: Record<string, never>;
    };
    /** Declares which stream modes the agent supports. */
    stream?: {
      /** Agent supports `"delta"` streaming. */
      delta?: Record<string, never>;
      /** Agent supports `"message"` streaming. */
      message?: Record<string, never>;
      /** Agent supports non-streaming (`"none"`) responses. */
      none?: Record<string, never>;
    };
    /** Declares what application-provided inputs the agent supports. */
    application?: {
      /** Agent accepts application-side tools in requests. */
      tools?: Record<string, never>;
    };
    /** Declares what image input the agent supports. */
    image?: {
      /** Agent accepts `https://` image URLs. */
      http?: Record<string, never>;
      /** Agent accepts `data:` URI (base64) images. */
      data?: Record<string, never>;
    };
  };
}
```

## AgentOption

```typescript
interface TextAgentOption {
  type: "text";
  name: string;
  title?: string;
  description?: string;
  default: string;
}

interface SecretAgentOption {
  type: "secret";
  name: string;
  title?: string;
  description?: string;
  default: string;
}

interface SelectAgentOption {
  type: "select";
  name: string;
  title?: string;
  description?: string;
  options: string[];
  default: string;
}

/** A configurable option the client may set per request. */
type AgentOption = TextAgentOption | SecretAgentOption | SelectAgentOption;
```

## AgentResponse

```typescript
/** JSON response body for non-streaming (`stream: "none"`) requests. */
interface AgentResponse {
  stopReason: StopReason;
  messages: HistoryMessage[];
}
```

## ContentBlock

```typescript
interface TextContentBlock {
  type: "text";
  text: string;
}

interface ThinkingContentBlock {
  type: "thinking";
  thinking: string;
}

interface ToolUseContentBlock {
  type: "tool_use";
  toolCallId: string;
  name: string;
  input: Record<string, unknown>;
}

interface ImageContentBlock {
  type: "image";
  /** Supports `https://` URLs and `data:` URIs (base64). */
  url: string;
}

/** A single block of content within a message. */
type ContentBlock =
  | TextContentBlock
  | ThinkingContentBlock
  | ToolUseContentBlock
  | ImageContentBlock;
```

## CreateSessionRequest

```typescript
/** Request body for `PUT /session`. */
interface CreateSessionRequest {
  /** Agent configuration. `name` is required at session creation. */
  agent: AgentConfig;
  /** Response mode. Defaults to `"none"`. */
  stream?: StreamMode;
  /** Seed history. The last message must be a `user` message. */
  messages: HistoryMessage[];
  /** Application-side tools with full schema. */
  tools?: ToolSpec[];
}
```

## CreateSessionResponse

```typescript
interface CreateSessionResponse extends AgentResponse {
  sessionId: string;
}
```

## Message

```typescript
/** A system-role message providing instructions to the agent. */
interface SystemMessage {
  role: "system";
  content: string;
}

/** A user-role message. */
interface UserMessage {
  role: "user";
  content: string | ContentBlock[];
}

/** An assistant-role message. */
interface AssistantMessage {
  role: "assistant";
  content: string | ContentBlock[];
}

/** A tool result message returned by the application after a `tool_use` block. */
interface ToolMessage {
  role: "tool";
  toolCallId: string;
  content: string | ContentBlock[];
}

/** A message that can appear in conversation history. */
type HistoryMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

/** Grants or denies permission for the server to invoke a tool on the client's behalf. */
interface ToolPermissionMessage {
  role: "tool_permission";
  toolCallId: string;
  /** Whether the client grants permission for the tool call. */
  granted: boolean;
  /** Optional explanation, especially useful when `granted` is `false`. */
  reason?: string;
}
```

## MetaResponse

```typescript
/** Response body for `GET /meta`. */
interface MetaResponse {
  /** AAP protocol version. */
  version: number;
  agents: AgentInfo[];
}
```

## SessionHistoryResponse

```typescript
/** Response body for `GET /session/:id/history`. */
interface SessionHistoryResponse {
  history: {
    /** Present when `?type=compacted` */
    compacted?: HistoryMessage[];
    /** Present when `?type=full` */
    full?: HistoryMessage[];
  };
}
```

## SessionListResponse

```typescript
/** Response body for `GET /sessions`. */
interface SessionListResponse {
  /** Array of session objects. Each object has the same shape as `SessionResponse`. */
  sessions: SessionResponse[];
  /** Pagination cursor; absent when there are no more results. Pass as `after` to get the next page. */
  next?: string;
}
```

## SessionResponse

```typescript
/** Response body for `GET /session/:id` and items in `GET /sessions`. */
interface SessionResponse {
  sessionId: string;
  /** Secret option values in `agent.options` are redacted (e.g. `"***"`). */
  agent: AgentConfig;
  /** Application-side tools declared for this session. */
  tools?: ToolSpec[];
}
```

## SessionTurnRequest

```typescript
/** Request body for `POST /session/:id`. */
interface SessionTurnRequest {
  /** Session-level agent overrides. Agent name cannot be changed. Options merged by key. */
  agent?: Omit<AgentConfig, "name">;
  /** Response mode. Defaults to `"none"`. */
  stream?: StreamMode;
  /** A single user message, or a mixed list of tool results and tool permissions. */
  messages: (UserMessage | ToolMessage | ToolPermissionMessage)[];
  /** Application-side tools. Overrides tools declared at session creation. */
  tools?: ToolSpec[];
}
```

## SSEEvent

```typescript
/** A tool call emitted by the agent during a streaming turn. */
interface ToolCallEvent {
  toolCallId: string;
  name: string;
  input: Record<string, unknown>;
}

interface SessionStartEvent {
  event: "session_start";
  sessionId: string;
}

interface TurnStartEvent {
  event: "turn_start";
}

interface TextDeltaEvent {
  event: "text_delta";
  delta: string;
}

interface ThinkingDeltaEvent {
  event: "thinking_delta";
  delta: string;
}

interface TextEvent {
  event: "text";
  text: string;
}

interface ThinkingEvent {
  event: "thinking";
  thinking: string;
}

interface ToolCallSSEEvent extends ToolCallEvent {
  event: "tool_call";
}

interface ToolResultEvent {
  event: "tool_result";
  toolCallId: string;
  content: string | ContentBlock[];
}

interface TurnStopEvent {
  event: "turn_stop";
  stopReason: StopReason;
}

/** SSE event data for `stream: "delta"` and `stream: "message"` responses. */
type SSEEvent =
  | SessionStartEvent // PUT /session only
  | TurnStartEvent
  | TextDeltaEvent // delta mode only
  | ThinkingDeltaEvent // delta mode only
  | TextEvent // message mode only
  | ThinkingEvent // message mode only
  | ToolCallSSEEvent
  | ToolResultEvent // server-side tools only
  | TurnStopEvent;

/** Events emitted in `stream: "delta"` mode. */
type DeltaSSEEvent =
  | TurnStartEvent
  | TextDeltaEvent
  | ThinkingDeltaEvent
  | ToolCallSSEEvent
  | ToolResultEvent
  | TurnStopEvent;

/** Events emitted in `stream: "message"` mode. */
type MessageSSEEvent =
  | TurnStartEvent
  | TextEvent
  | ThinkingEvent
  | ToolCallSSEEvent
  | ToolResultEvent
  | TurnStopEvent;
```

## StopReason

```typescript
type StopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error";
```

## StreamMode

```typescript
type StreamMode = "delta" | "message" | "none";
```

## ToolSpec

```typescript
/** Declares a tool (application-side in requests; server-side in `/meta`). */
interface ToolSpec {
  name: string;
  title?: string;
  description: string;
  inputSchema: JSONSchema;
}
```
