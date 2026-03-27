# Schema

## TypeScript

```typescript
// GET /session/:id response
interface SessionResponse {
  sessionId: string;
  agent: AgentConfig;
  tools?: ToolSpec[];
  history?: {
    compacted?: Message[]; // omitted if server chooses not to expose
    full?: Message[]; // omitted if server chooses not to expose
  };
}

// GET /sessions response
interface SessionListResponse {
  sessions: string[]; // array of sessionIds
  nextCursor?: string; // absent when no more results
}

// GET /meta response
interface MetaResponse {
  version: number;
  agents: AgentInfo[];
}

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
  };
}

type AgentOption =
  | {
      name: string;
      title?: string;
      description?: string;
      type: "text";
      default: string;
    }
  | {
      name: string;
      title?: string;
      description?: string;
      type: "secret";
      default: string;
    }
  | {
      name: string;
      title?: string;
      description?: string;
      type: "select";
      options: string[];
      default: string;
    };

// PUT /session request
interface CreateSessionRequest {
  agent: AgentConfig; // name required at session creation
  stream?: "delta" | "message" | "none"; // default: "none"
  messages: Message[]; // seed history; last message must be a user message
  tools?: ToolSpec[];
}

// POST /session/:id request
interface SessionTurnRequest {
  agent?: Omit<AgentConfig, "name">; // session-level overrides; agent name cannot be changed
  stream?: "delta" | "message" | "none"; // default: "none"
  messages: (Message | ToolPermissionMessage)[]; // new turn(s); typically a single user message
  tools?: ToolSpec[]; // overrides session tools
}

interface AgentConfig {
  name: string;
  tools?: ServerToolRef[];
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
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentBlock[] }
  | { role: "assistant"; content: string | ContentBlock[] }
  | { role: "tool"; toolCallId: string; content: string | ContentBlock[] };

type ToolPermissionMessage = {
  role: "tool_permission";
  toolCallId: string;
  granted: boolean;
  reason?: string;
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | {
      type: "tool_use";
      toolCallId: string;
      name: string;
      input: Record<string, unknown>;
    }
  | { type: "image"; mimeType: string; data: string };

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
    } // trusted server tools only
  | { event: "turn_stop"; stopReason: StopReason };

// JSON response body (stream: "none")
interface AgentResponse {
  sessionId?: string; // present in PUT /session response only
  stopReason: StopReason;
  messages: Message[];
}

type StopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error";
```

## Extensibility

- Add custom fields via `_meta` on any object.
