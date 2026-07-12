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

以下 Schema 以 [TypeScript SDK](https://github.com/agentapplicationprotocol/typescript-sdk) 作为参考实现。类型名称仅供参考，实现时无需与此保持一致。

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
  /** 声明 Agent 是否支持通过 `GET /sessions/:id/history` 返回会话历史。子键声明支持的查询模式。 */
  history?: {
    /** 支持尾部分页：无游标时返回最新消息，`before` 游标向前翻页。 */
    tail?: Record<string, never>;
  };
  /** 声明 Agent 支持的流模式。 */
  stream?: Partial<Record<StreamMode, Record<string, never>>>;
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

interface ToolCallContentBlock extends ToolCall {
  type: "tool_call";
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
  | ToolCallContentBlock
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

/** 应用在 `tool_call` 块后返回的工具结果消息。 */
interface ToolMessage extends ToolResult {
  role: "tool";
}

/** 可以出现在对话历史中的消息。 */
type HistoryMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage;

/** Agent 生成的消息。 */
type AgentMessage = AssistantMessage | ToolMessage;

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

/** `PATCH /sessions/:id` 的请求体。 */
interface PatchSessionRequest {
  /** 会话级 Agent 更新。Agent 名称不能更改。选项按键合并。 */
  agent?: Omit<AgentConfig, "name">;
  /** 客户端工具。替换为会话声明的工具。 */
  tools?: ToolSpec[];
}

/** 发布到 `POST /sessions/:id/input` 的用户消息输入。 */
interface UserInput {
  type: "user";
  /** 纯字符串或混合内容块（文本和图片）。 */
  content: string | ContentBlock[];
}

/** 发布到 `POST /sessions/:id/input` 的工具结果输入。 */
interface ToolInput {
  type: "tool";
  toolCallId: string;
  content: string | ContentBlock[];
}

/** 发布到 `POST /sessions/:id/input` 的工具权限输入。 */
interface PermissionInput {
  type: "permission";
  toolCallId: string;
  /** 客户端是否授予工具调用权限。 */
  granted: boolean;
  /** 可选的人类可读说明，传递给 Agent。 */
  reason?: string;
}

/** 发布到 `POST /sessions/:id/input` 的取消输入。 */
interface CancelInput {
  type: "cancel";
}

/** `POST /sessions/:id/input` 的请求体。 */
type PublishInputRequest = UserInput | ToolInput | PermissionInput | CancelInput;
```

## Responses

```typescript
/** `GET /sessions/:id` 的响应体。 */
type GetSessionResponse = SessionInfo;

/** `PATCH /sessions/:id` 的响应体。 */
type PatchSessionResponse = SessionInfo;

/** 携带服务器分配的 id 和时间戳的历史消息。 */
interface HistoryEntry {
  id: string;
  timestamp: string; // ISO 8601
  role: "system" | "user" | "assistant";
  content: string | ContentBlock[];
}

/** `GET /sessions/:id/history` 的响应体。 */
interface GetSessionHistoryResponse {
  history: HistoryEntry[];
  /** 不透明游标；作为 `before` 传入以获取更早的消息。无更多历史时不存在。 */
  before?: string;
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
  version: 4;
  agents: AgentInfo[];
}
```

## Session

```typescript
type StreamMode = "delta" | "message";

/** 会话数据结构，用于 `GET /sessions/:id` 及 `GET /sessions` 中的条目。 */
interface SessionInfo {
  sessionId: string;
  /** `agent.options` 中的 secret 选项值以布尔值返回：`true` 表示已存储，`false` 表示未存储。 */
  agent: AgentConfig;
  /** 为此会话声明的客户端工具。 */
  tools?: ToolSpec[];
  /** 等待客户端操作的工具调用。 */
  pending?: ToolCall[];
}
```

## SSE

```typescript
/** 所有 SSE 事件均携带稳定的 id 和服务器时间戳。 */
interface BaseEvent {
  id: string;
  timestamp: string; // ISO 8601
}

/** 当服务器接受并入队客户端输入时发出。 */
interface InputEvent extends BaseEvent {
  event: "input";
  data: PublishInputRequest;
}

/** _（仅 delta 模式）_ 在新 Agent 消息开始时发出。 */
interface MessageStartEvent {
  event: "message_start";
  id: string;
}

/** _（仅 delta 模式）_ Agent 的增量文本。 */
interface TextDeltaEvent {
  event: "text_delta";
  delta: string;
}

/** _（仅 delta 模式）_ Agent 的增量思考/推理。 */
interface ThinkingDeltaEvent {
  event: "thinking_delta";
  delta: string;
}

/** _（仅 delta 模式）_ 在 Agent 消息完成时发出。 */
interface MessageEndEvent {
  event: "message_end";
  id: string;
  timestamp: string; // ISO 8601 —— 消息完成时的服务器时间
}

/** _（仅 message 模式）_ 单条 Agent 消息的完整文本。 */
interface TextEvent extends BaseEvent {
  event: "text";
  text: string;
}

/** _（仅 message 模式）_ 单条 Agent 消息的完整思考/推理。 */
interface ThinkingEvent extends BaseEvent {
  event: "thinking";
  thinking: string;
}

/** 当 Agent 请求工具调用时发出。 */
interface ToolCallEvent extends BaseEvent, ToolCall {
  event: "tool_call";
}

/** 当服务端工具结果可用时发出。 */
interface ToolResultEvent extends BaseEvent, ToolResult {
  event: "tool_result";
}

/** 会话级运行时错误时发出。 */
interface ErrorEvent extends BaseEvent {
  event: "error";
  code: string;
  message: string;
}

/** 当会话空闲一段时间后发出。服务器在此事件后关闭连接。 */
interface IdleEvent extends BaseEvent {
  event: "idle";
}

/** `stream: "delta"` 和 `stream: "message"` 响应的 SSE 事件数据。 */
type SSEEvent =
  | InputEvent
  | MessageStartEvent // 仅 delta 模式
  | TextDeltaEvent // 仅 delta 模式
  | ThinkingDeltaEvent // 仅 delta 模式
  | MessageEndEvent // 仅 delta 模式
  | TextEvent // 仅 message 模式
  | ThinkingEvent // 仅 message 模式
  | ToolCallEvent
  | ToolResultEvent // 仅服务端工具
  | ErrorEvent
  | IdleEvent;

/** `stream: "delta"` 模式中发出的事件。 */
type DeltaSSEEvent =
  | InputEvent
  | MessageStartEvent
  | TextDeltaEvent
  | ThinkingDeltaEvent
  | MessageEndEvent
  | ToolCallEvent
  | ToolResultEvent
  | ErrorEvent
  | IdleEvent;

/** `stream: "message"` 模式中发出的事件。 */
type MessageSSEEvent =
  | InputEvent
  | TextEvent
  | ThinkingEvent
  | ToolCallEvent
  | ToolResultEvent
  | ErrorEvent
  | IdleEvent;
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
