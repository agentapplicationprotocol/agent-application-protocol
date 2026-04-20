---
head:
  - - meta
    - name: description
      content: Full Agent Application Protocol (AAP) schema reference — TypeScript interfaces for AgentConfig, Message, Tool, and all protocol types.
  - - meta
    - property: og:title
      content: Schema — Agent Application Protocol
  - - meta
    - property: og:description
      content: Full Agent Application Protocol (AAP) schema reference — TypeScript interfaces for AgentConfig, Message, Tool, and all protocol types.
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/schema
  - - meta
    - name: twitter:title
      content: Schema — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Full Agent Application Protocol (AAP) schema reference — TypeScript interfaces for AgentConfig, Message, Tool, and all protocol types.
---

# Schema

## Agent

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

/** History type for `GET /sessions/:id/history`. */
type HistoryType = "compacted" | "full";

/** Agent configuration supplied with a request. */
interface AgentConfig {
  /** Agent name to invoke. */
  name: string;
  /** Server-side tools to enable. If omitted, all exposed agent tools are disabled. */
  tools?: ServerToolRef[];
  /** Key-value pairs matching the agent's declared options. */
  options?: Record<string, string>;
}

/** Declares what an agent supports. Missing fields should be treated as unsupported. */
interface AgentCapabilities {
  /** Declares what history the agent can return in `GET /session/:id`. */
  history?: Partial<Record<HistoryType, Record<string, never>>>;
  /** Declares which stream modes the agent supports. */
  stream?: Partial<Record<StreamMode, Record<string, never>>>;
  /** Declares what application-provided inputs the agent supports. */
  application?: {
    /** Agent accepts client-side tools in requests. */
    tools?: Record<string, never>;
  };
  /** Declares what image input the agent supports. */
  image?: {
    /** Agent accepts `https://` image URLs. */
    http?: Record<string, never>;
    /** Agent accepts `data:` URI (base64) images. */
    data?: Record<string, never>;
  };
}
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
  capabilities?: AgentCapabilities;
}
```

## Content Block

```typescript
interface TextContentBlock {
  type: "text";
  text: string;
}

interface ThinkingContentBlock {
  type: "thinking";
  thinking: string;
}

interface ToolUseContentBlock extends ToolCall {
  type: "tool_use";
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

## Messages

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
interface ToolMessage extends ToolResult {
  role: "tool";
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

## Requests

```typescript
/** Request body for `POST /sessions`. */
interface PostSessionsRequest {
  /** Agent configuration. `name` is required at session creation. */
  agent: AgentConfig;
  /** Optional seed history (e.g. system prompt or prior conversation). */
  messages?: HistoryMessage[];
  /** Client-side tools with full schema. */
  tools?: ToolSpec[];
}

/** Request body for `POST /sessions/:id/turns`. */
interface PostSessionTurnRequest {
  /** Session-level agent overrides. Agent name cannot be changed. Options merged by key. */
  agent?: Omit<AgentConfig, "name">;
  /** Response mode. Defaults to `"none"`. */
  stream?: StreamMode;
  /** A single user message, or a mixed list of tool results and tool permissions. */
  messages: (UserMessage | ToolMessage | ToolPermissionMessage)[];
  /** Client-side tools. Overrides tools declared at session creation. */
  tools?: ToolSpec[];
}
```

## Responses

```typescript
/** JSON response body for non-streaming (`stream: "none"`) requests. */
interface PostSessionTurnResponse {
  stopReason: StopReason;
  messages: HistoryMessage[];
}

/** Response body for `POST /sessions`. */
interface PostSessionsResponse {
  sessionId: string;
}

/** Response body for `GET /sessions/:id`. */
type GetSessionResponse = SessionInfo;

/** Response body for `GET /sessions/:id/history`. */
interface GetSessionHistoryResponse {
  history: Partial<Record<HistoryType, HistoryMessage[]>>;
}

/** Response body for `GET /sessions`. */
interface GetSessionsResponse {
  /** Array of session objects. Each object has the same shape as `GetSessionResponse`. */
  sessions: SessionInfo[];
  /** Pagination cursor; absent when there are no more results. Pass as `after` to get the next page. */
  next?: string;
}

/** Response body for `GET /meta`. */
interface GetMetaResponse {
  /** AAP protocol version. */
  version: 3;
  agents: AgentInfo[];
}
```

## Session

```typescript
type StreamMode = "delta" | "message" | "none";
type StopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error";

/** Session data shape, used in `GET /sessions/:id` and items in `GET /sessions`. */
interface SessionInfo {
  sessionId: string;
  /** Secret option values in `agent.options` are redacted (e.g. `"***"`). */
  agent: AgentConfig;
  /** Client-side tools declared for this session. */
  tools?: ToolSpec[];
}
```

## SSE

```typescript
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

interface ToolCallEvent extends ToolCall {
  event: "tool_call";
}

interface ToolResultEvent extends ToolResult {
  event: "tool_result";
}

interface TurnStopEvent {
  event: "turn_stop";
  stopReason: StopReason;
}

/** SSE event data for `stream: "delta"` and `stream: "message"` responses. */
type SSEEvent =
  | TurnStartEvent
  | TextDeltaEvent // delta mode only
  | ThinkingDeltaEvent // delta mode only
  | TextEvent // message mode only
  | ThinkingEvent // message mode only
  | ToolCallEvent
  | ToolResultEvent // server-side tools only
  | TurnStopEvent;

/** Events emitted in `stream: "delta"` mode. */
type DeltaSSEEvent =
  | TurnStartEvent
  | TextDeltaEvent
  | ThinkingDeltaEvent
  | ToolCallEvent
  | ToolResultEvent
  | TurnStopEvent;

/** Events emitted in `stream: "message"` mode. */
type MessageSSEEvent =
  | TurnStartEvent
  | TextEvent
  | ThinkingEvent
  | ToolCallEvent
  | ToolResultEvent
  | TurnStopEvent;
```

## Tools

```typescript
/** Input arguments for a tool call. */
type ToolCallInput = Record<string, unknown>;

/** A tool call emitted by the agent. */
interface ToolCall {
  toolCallId: string;
  name: string;
  input: ToolCallInput;
}

/** The result of a tool call. */
interface ToolResult {
  toolCallId: string;
  content: string | ContentBlock[];
}

/** Declares a tool (client-side in requests; server-side in `/meta`). */
interface ToolSpec {
  name: string;
  title?: string;
  description: string;
  parameters: JSONSchema;
}

/** References a server-side tool to enable for a session. */
interface ServerToolRef {
  /** Server tool name as declared in `/meta`. */
  name: string;
  /** If `true`, the server may invoke this tool without requesting client permission. Defaults to `false`. */
  trust?: boolean;
}
```
