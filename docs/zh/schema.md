---
head:
  - - meta
    - name: description
      content: 完整的 Agent Application Protocol (AAP) Schema 参考 —— AgentConfig、Message、Tool 及所有协议类型的 TypeScript 接口。
  - - meta
    - property: og:title
      content: Schema — Agent Application Protocol
  - - meta
    - property: og:description
      content: 完整的 Agent Application Protocol (AAP) Schema 参考 —— AgentConfig、Message、Tool 及所有协议类型的 TypeScript 接口。
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/zh/schema
  - - meta
    - name: twitter:title
      content: Schema — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: 完整的 Agent Application Protocol (AAP) Schema 参考 —— AgentConfig、Message、Tool 及所有协议类型的 TypeScript 接口。
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

/** 客户端可以在每次请求中设置的可配置选项。 */
type AgentOption = TextAgentOption | SecretAgentOption | SelectAgentOption;

/** `GET /sessions/:id/history` 的历史类型。 */
type HistoryType = "compacted" | "full";

/** 随请求提供的 Agent 配置。 */
interface AgentConfig {
  /** 要调用的 Agent 名称。 */
  name: string;
  /** 要启用的服务端工具。若省略，所有暴露的 Agent 工具均禁用。 */
  tools?: ServerToolRef[];
  /** 与 Agent 声明的选项匹配的键值对。 */
  options?: Record<string, string>;
}

/** 声明 Agent 支持的功能。缺失字段应视为不支持。 */
interface AgentCapabilities {
  /** 声明 Agent 可以在 `GET /sessions/:id/history` 中返回的历史类型。 */
  history?: Partial<Record<HistoryType, Record<string, never>>>;
  /** 声明 Agent 支持的流模式。 */
  stream?: Partial<Record<StreamMode, Record<string, never>>>;
  /** 声明 Agent 支持的应用提供输入。 */
  application?: {
    /** Agent 接受请求中的客户端工具。 */
    tools?: Record<string, never>;
  };
  /** 声明 Agent 支持的图片输入。 */
  image?: {
    /** Agent 接受 `https://` 图片 URL。 */
    http?: Record<string, never>;
    /** Agent 接受 `data:` URI（base64）图片。 */
    data?: Record<string, never>;
  };
}
interface AgentInfo {
  /** 此服务器上 Agent 的唯一标识符。 */
  name: string;
  /** 人类可读的显示名称。 */
  title?: string;
  /** Agent 的语义版本。 */
  version: string;
  description?: string;
  /** Agent 暴露给客户端配置的服务端工具。 */
  tools?: ToolSpec[];
  /** 客户端可以在每次请求中设置的可配置选项。 */
  options?: AgentOption[];
  /** 声明 Agent 支持的功能。缺失字段应视为不支持。 */
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
  /** 支持 `https://` URL 和 `data:` URI（base64）。 */
  url: string;
}

/** 消息中的单个内容块。 */
type ContentBlock =
  | TextContentBlock
  | ThinkingContentBlock
  | ToolUseContentBlock
  | ImageContentBlock;
```

## Messages

```typescript
/** 向 Agent 提供指令的系统角色消息。 */
interface SystemMessage {
  role: "system";
  content: string;
}

/** 用户角色消息。 */
interface UserMessage {
  role: "user";
  content: string | ContentBlock[];
}

/** 助手角色消息。 */
interface AssistantMessage {
  role: "assistant";
  content: string | ContentBlock[];
}

/** 应用在 `tool_use` 块后返回的工具结果消息。 */
interface ToolMessage extends ToolResult {
  role: "tool";
}

/** 可以出现在对话历史中的消息。 */
type HistoryMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

/** 授予或拒绝服务器代表客户端调用工具的权限。 */
interface ToolPermissionMessage {
  role: "tool_permission";
  toolCallId: string;
  /** 客户端是否授予工具调用权限。 */
  granted: boolean;
  /** 可选说明，在 `granted` 为 `false` 时尤其有用。 */
  reason?: string;
}
```

## Requests

```typescript
/** `POST /sessions` 的请求体。 */
interface PostSessionsRequest {
  /** Agent 配置。会话创建时 `name` 必填。 */
  agent: AgentConfig;
  /** 可选的种子历史（如系统提示或先前对话）。 */
  messages?: HistoryMessage[];
  /** 带完整 schema 的客户端工具。 */
  tools?: ToolSpec[];
}

/** `POST /sessions/:id/turns` 的请求体。 */
interface PostSessionTurnRequest {
  /** 会话级 Agent 覆盖。Agent 名称不能更改。选项按键合并。 */
  agent?: Omit<AgentConfig, "name">;
  /** 响应模式。默认为 `"none"`。 */
  stream?: StreamMode;
  /** 单条用户消息，或工具结果和工具权限的混合列表。 */
  messages: (UserMessage | ToolMessage | ToolPermissionMessage)[];
  /** 客户端工具。覆盖会话创建时声明的工具。 */
  tools?: ToolSpec[];
}
```

## Responses

```typescript
/** 非流式（`stream: "none"`）请求的 JSON 响应体。 */
interface PostSessionTurnResponse {
  stopReason: StopReason;
  messages: HistoryMessage[];
}

/** `POST /sessions` 的响应体。 */
interface PostSessionsResponse {
  sessionId: string;
}

/** `GET /sessions/:id` 的响应体。 */
type GetSessionResponse = SessionInfo;

/** `GET /sessions/:id/history` 的响应体。 */
interface GetSessionHistoryResponse {
  history: Partial<Record<HistoryType, HistoryMessage[]>>;
}

/** `GET /sessions` 的响应体。 */
interface GetSessionsResponse {
  /** 会话对象数组。每个对象与 `GetSessionResponse` 形状相同。 */
  sessions: SessionInfo[];
  /** 分页游标；无更多结果时不存在。作为 `after` 传入以获取下一页。 */
  next?: string;
}

/** `GET /meta` 的响应体。 */
interface GetMetaResponse {
  /** AAP 协议版本。 */
  version: 3;
  agents: AgentInfo[];
}
```

## Session

```typescript
type StreamMode = "delta" | "message" | "none";
type StopReason = "end_turn" | "tool_use" | "max_tokens" | "refusal" | "error";

/** 会话数据结构，用于 `GET /sessions/:id` 及 `GET /sessions` 中的条目。 */
interface SessionInfo {
  sessionId: string;
  /** `agent.options` 中的 secret 选项值已删减（如 `"***"`）。 */
  agent: AgentConfig;
  /** 为此会话声明的客户端工具。 */
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

/** `stream: "delta"` 和 `stream: "message"` 响应的 SSE 事件数据。 */
type SSEEvent =
  | TurnStartEvent
  | TextDeltaEvent // 仅 delta 模式
  | ThinkingDeltaEvent // 仅 delta 模式
  | TextEvent // 仅 message 模式
  | ThinkingEvent // 仅 message 模式
  | ToolCallEvent
  | ToolResultEvent // 仅服务端工具
  | TurnStopEvent;

/** `stream: "delta"` 模式中发出的事件。 */
type DeltaSSEEvent =
  | TurnStartEvent
  | TextDeltaEvent
  | ThinkingDeltaEvent
  | ToolCallEvent
  | ToolResultEvent
  | TurnStopEvent;

/** `stream: "message"` 模式中发出的事件。 */
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
/** 工具调用的输入参数。 */
type ToolCallInput = Record<string, unknown>;

/** Agent 发出的工具调用。 */
interface ToolCall {
  toolCallId: string;
  name: string;
  input: ToolCallInput;
}

/** 工具调用的结果。 */
interface ToolResult {
  toolCallId: string;
  content: string | ContentBlock[];
}

/** 声明工具（请求中的客户端工具；`/meta` 中的服务端工具）。 */
interface ToolSpec {
  name: string;
  title?: string;
  description: string;
  parameters: JSONSchema;
}

/** 引用要为会话启用的服务端工具。 */
interface ServerToolRef {
  /** `/meta` 中声明的服务端工具名称。 */
  name: string;
  /** 若为 `true`，服务器可以在不请求客户端权限的情况下调用此工具。默认为 `false`。 */
  trust?: boolean;
}
```
