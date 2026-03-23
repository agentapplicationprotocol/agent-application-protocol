# Agent Application Protocol

A protocol for connecting any application to any agent.

Remote-first, agent as a service. Decouple the agent loop from application-specific tools.

## Architecture

Two entities: **Agent** and **Application**.

**Agent** is responsible for:
- Agent loop and LLM interaction
- Conversation history management
- Server-side tools and MCP configuration

**Application** is responsible for:
- Application-side tools and MCP configuration
- UI/UX: accepting prompts and displaying responses

## Why AAP

Today, agents are tightly coupled to the applications that host them. AAP separates the two:

- **Agent builders** can focus on building capable, general-purpose agents — remote, multi-tenant, usage-billed — without knowing anything about the application.
- **Application builders** can focus on domain knowledge and user experience, plugging in any compatible agent without managing an agent loop.

This separation enables a marketplace of interoperable agents and applications.

## Specification

See [docs/protocol.md](docs/protocol.md) for the full protocol specification.

## Credits

Inspired by [Agent Client Protocol (ACP)](https://agentclientprotocol.com), [Model Context Protocol (MCP)](https://modelcontextprotocol.io), and the Claude Agent SDK.
