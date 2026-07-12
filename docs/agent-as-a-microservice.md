---
head:
  - - meta
    - name: description
      content: Use Agent Application Protocol (AAP) agents as internal microservices — delegate reasoning and decision-making to agents over HTTP from any backend service.
  - - meta
    - property: og:title
      content: Agent as a Microservice — Agent Application Protocol
  - - meta
    - property: og:description
      content: Use Agent Application Protocol (AAP) agents as internal microservices — delegate reasoning and decision-making to agents over HTTP from any backend service.
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/agent-as-a-microservice
  - - meta
    - name: twitter:title
      content: Agent as a Microservice — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: Use Agent Application Protocol (AAP) agents as internal microservices — delegate reasoning and decision-making to agents over HTTP from any backend service.
---

# Agent as a Microservice

AAP agents can be used as internal services within your own system — not just in user-facing apps. Any backend service can act as an AAP client and delegate reasoning or decision-making to an agent over HTTP.

This lets your organization separate agent capabilities from business logic. Your agent team maintains general-purpose agents; your product teams consume them by name with a few config options, without knowing anything about the agent implementation.

## Responsibilities

| Responsibility        | Your service (AAP client) | AAP agent |
| --------------------- | ------------------------- | --------- |
| Business logic        | ✅                        |           |
| Domain-specific tools | ✅                        |           |
| Session management    | ✅                        |           |
| Agent loop & LLM      |                           | ✅        |
| General-purpose tools |                           | ✅        |
| Conversation history  |                           | ✅        |

## Architecture

```mermaid
sequenceDiagram
    actor User
    participant Service as Your Service (AAP client)
    participant Agent as AAP Agent

    Service->>Agent: POST /sessions (agent options, tool configs, client-side tools)
    Agent-->>Service: Location: /sessions/:id
    Service->>Agent: GET /sessions/:id/events/stream
    loop Requests
        User->>Service: Input prompt
        Service->>Agent: POST /sessions/:id/input (type: user)
        Agent-->>Service: Streamed events (text_delta, tool_call, …)
        alt Tool calls
            Note over Service: Execute tools programmatically
            Service->>Agent: POST /sessions/:id/input (type: tool, one per result)
            Agent-->>Service: Streamed events continue
        end
        Service-->>User: Response
    end
```

There is no user in the loop — tool calls are handled programmatically and results submitted immediately, no permission prompts needed.

## Step 1: Configure your agent

Decide upfront:

- Which AAP agent to use and its options
- Which server-side tools to enable and trust
- Which client-side tools your service provides (domain-specific, e.g. querying your database or internal APIs)

## Step 2: Create a session

Create a session with your preconfigured agent options, server tool configs, and client-side tools:

```http
POST /sessions
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "agent": {
    "name": "company-agent",
    "tools": [{ "name": "web_search", "trust": true }],
    "options": { "language": "English" }
  },
  "tools": [
    {
      "name": "get_policy_document",
      "description": "Retrieve an HR policy document by name.",
      "parameters": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Policy document name" }
        },
        "required": ["name"]
      }
    }
  ]
}
```

## Step 3: Subscribe to the event stream and send input

Subscribe to the event stream before sending input:

```http
GET /sessions/sess_abc123/events/stream?stream=delta
Authorization: Bearer <api-key>
```

Then send the user prompt:

```http
POST /sessions/sess_abc123/input
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "type": "user",
  "content": "What is the parental leave policy?"
}
```

Agent output arrives over the SSE stream as `text_delta`, `tool_call`, and other events.

## Step 4: Handle tool calls programmatically

When the agent emits a `tool_call` event, execute the tool immediately in your service — no permission prompts needed. Submit each result individually:

```http
POST /sessions/sess_abc123/input
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "type": "tool",
  "toolCallId": "call_001",
  "content": "Parental leave policy: 16 weeks fully paid..."
}
```

Submit each result as soon as it is ready — do not batch them. The agent processes results as they arrive and continues. For server-side tools, set `trust: true` so the agent runs them inline without stopping.

See [Tool Calls](/tool-call) for the full resolving flow.

## Step 5: Manage sessions

After a request is complete, decide whether to delete the session immediately or keep it for a period to allow follow-up turns. Delete it when it's no longer needed to free up resources on the agent server:

```http
DELETE /sessions/sess_abc123
Authorization: Bearer <api-key>
```

See [Endpoints](/endpoints) for full details.
