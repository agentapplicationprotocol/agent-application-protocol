# Protocol Changelog

All notable changes to the AAP protocol are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Protocol versions are compatibility versions for the AAP wire protocol; additive capabilities may be documented here without changing the protocol version.

## [Unreleased]

### Added

- Added range-based history retrieval with `start` and `end` query parameters for `GET /sessions/:id/history`, including `range` metadata in the response.
- Added `PATCH /sessions/:id` for persisted session configuration updates.
- Added `active` and `pending` session state fields, with pending tool calls returned from session and turn responses.

### Changed

- Changed `GET /sessions` pagination to make page size server-selected and cursor-only.
- Refined session conflict semantics so `409 Conflict` applies to active turns, not pending tool calls.
- Removed per-turn configuration overrides from turn submission; persisted configuration changes now use `PATCH /sessions/:id`.
- Changed tool-call recovery to use `GET /sessions/:id` and resolve pending tool calls from session state.

### Removed

- Removed response bodies from `POST /sessions`; clients now recover the created session from the required `Location` header.

## [v3] - 2026-04-04

### Changed

- Bumped the AAP protocol version to `3`.
- Redesigned endpoints around REST-style session and turn resources.
- Split session creation from turn execution.
- Renamed application-side tools to client-side tools across the documentation.
- Renamed `inputSchema` to `parameters` in `ToolSpec`.
- Clarified server-side tool exposure, unknown tool names, tool denial format, and agent option fallback behavior.
- Expanded response and SSE event examples.

### Added

- Added `turn_start`, `turn_stop`, `tool_call`, `tool_result`, and message-mode SSE event examples.
- Added history consistency guidance.

## [v2] - 2026-04-01

### Changed

- Split history retrieval into a dedicated endpoint.
- Enriched session list responses.
- Expanded and reorganized schema definitions.

### Added

- Added expanded schema definitions for session and history responses.

## [v1] - 2026-04-01

### Added

- Added the initial tagged AAP protocol documentation.
- Added history querying for sessions.
- Added privacy guidance for agent state, application data, and full-history handling.
- Added client/server history guidance and tool-call resumption documentation.
- Added image input capability, secret agent options, and separate tool permission messages.
- Added opaque cursor pagination and agent configuration structure.
- Added `delta` streaming and `turn_start` / `turn_stop` events.

[unreleased]: https://github.com/agentapplicationprotocol/agent-application-protocol/compare/v3...HEAD
[v3]: https://github.com/agentapplicationprotocol/agent-application-protocol/compare/v2...v3
[v2]: https://github.com/agentapplicationprotocol/agent-application-protocol/compare/v1...v2
[v1]: https://github.com/agentapplicationprotocol/agent-application-protocol/releases/tag/v1
