# Schema

## AgentConfig

```typescript
interface AgentConfig {
  name: string;
  tools?: ServerToolRef[];
  options?: Record<string, string>;
}
```

## AgentInfo

```typescript
interface AgentInfo {
  name: string;
  title?: string;
  version: string; // semantic version
  description?: string;
  tools?: ToolSpec[];
  options?: AgentOption[];
  capabilities?: {
    history?: {
      compacted?: Record<string, never>; // server can return compacted history in GET /session/:id
      full?: Record<string, never>; // server can return full history in GET /session/:id
    };
    stream?: {
      delta?: Record<string, never>; // agent supports delta streaming
      message?: Record<string, never>; // agent supports message streaming
      none?: Record<string, never>; // agent supports non-streaming responses
    };
    application?: {
      tools?: Record<string, never>; // agent accepts application-side tools
    };
    image?: {
      http?: Record<string, never>; // agent accepts https:// image URLs
      data?: Record<string, never>; // agent accepts data: URI (base64) images
    };
  };
}
```

## AgentOption

```typescript
type AgentOption =
  | {
      type: "text";
      name: string;
      title?: string;
      description?: string;
      default: string;
    }
  | {
      type: "secret";
      name: string;
      title?: string;
      description?: string;
      default: string;
    }
  | {
      type: "select";
      name: string;
      title?: string;
      description?: string;
      options: string[];
      default: string;
    };
```

## AgentResponse

```typescript
// JSON response body (stream: "none")
interface AgentResponse {
  sessionId?: string; // present in PUT /session response only
  stopReason: StopReason;
  messages: HistoryMessage[];
}
```

## ContentBlock

```typescript
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | {
      type: "tool_use";
      toolCallId: string;
      name: string;
      input: Record<string, unknown>;
    }
  | { type: "image"; url: string }; // supports https:// and data: URIs
```

## CreateSessionRequest

```typescript
// PUT /session request
interface CreateSessionRequest {
  agent: AgentConfig; // name required at session creation
  stream?: "delta" | "message" | "none"; // default: "none"
  messages: HistoryMessage[]; // seed history; last message must be a user message
  tools?: ToolSpec[];
}
```

## Message

```typescript
interface SystemMessage {
  role: "system";
  content: string;
}

interface UserMessage {
  role: "user";
  content: string | ContentBlock[];
}

interface AssistantMessage {
  role: "assistant";
  content: string | ContentBlock[];
}

interface ToolMessage {
  role: "tool";
  toolCallId: string;
  content: string | ContentBlock[];
}

type HistoryMessage =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolMessage;

interface ToolPermissionMessage {
  role: "tool_permission";
  toolCallId: string;
  granted: boolean;
  reason?: string;
}
```

## MetaResponse

```typescript
// GET /meta response
interface MetaResponse {
  version: number;
  agents: AgentInfo[];
}
```

## SSEEvent

```typescript
// SSE event data (stream: "delta" and stream: "message")
type SSEEvent =
  | { event: "session_start"; sessionId: string } // PUT /session only
  | { event: "turn_start" }
  | { event: "text_delta"; delta: string } // delta mode only
  | { event: "thinking_delta"; delta: string } // delta mode only
  | { event: "text"; text: string } // message mode only
  | { event: "thinking"; thinking: string } // message mode only
  | {
      event: "tool_call";
      toolCallId: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      event: "tool_result";
      toolCallId: string;
      content: string | ContentBlock[];
    } // server-side tools only
  | { event: "turn_stop"; stopReason: StopReason };
```

## ServerToolRef

```typescript
interface ServerToolRef {
  name: string;
  trust?: boolean; // default: false
}
```

## SessionListResponse

```typescript
// GET /sessions response
interface SessionListResponse {
  sessions: string[]; // array of sessionIds
  next?: string; // absent when no more results
}
```

## SessionResponse

```typescript
// GET /session/:id response
// history is only present when the ?history=compacted|full query param is provided
interface SessionResponse {
  sessionId: string;
  agent: AgentConfig; // secret option values in agent.options must be redacted (e.g. "***")
  tools?: ToolSpec[];
  history?: {
    compacted?: HistoryMessage[]; // present when ?history=compacted
    full?: HistoryMessage[];      // present when ?history=full
  };
}
```

## SessionTurnRequest

```typescript
// POST /session/:id request
interface SessionTurnRequest {
  agent?: Omit<AgentConfig, "name">; // session-level overrides; agent name cannot be changed; agent.options merged by key
  stream?: "delta" | "message" | "none"; // default: "none"
  messages: (UserMessage | ToolMessage | ToolPermissionMessage)[]; // a single user message, or a mixed list of tool results and tool permissions
  tools?: ToolSpec[]; // overrides session tools
}
```

## StopReason

```typescript
type StopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error";
```

## ToolSpec

```typescript
// Tool spec (application-side, declared in request; server-side, declared in /meta)
interface ToolSpec {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
}
```
