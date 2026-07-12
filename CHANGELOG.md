# Protocol Changelog

All notable changes to the AAP protocol are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Protocol versions are compatibility versions for the AAP wire protocol; additive capabilities may be documented here without changing the protocol version.

## [Unreleased]

### Added

- Added `message_start` and `message_end` SSE events for delta mode, carrying message `id` and server-side finish `timestamp`.
- Added `id` and `timestamp` fields to all SSE events (`input`, `text`, `thinking`, `tool_call`, `tool_result`, `error`, `idle`) for stateless client tracking and deduplication.
- Added `id` and `timestamp` fields to history messages returned from `GET /sessions/:id/history`.
- Added `history.tail` sub-key to the `history` capability, declaring support for tail-based cursor pagination. Clients should check `history.tail` before calling `GET /sessions/:id/history`.
- Added `User Input` page (`/inputs`) documenting all input types (`user`, `tool`, `permission`, `cancel`) extracted from the endpoints reference.
- Added `Event Stream` page (`/events`) with full event type reference and sequence diagram, extracted from the endpoints reference.
- Added `400 Bad Request` and `404 Not Found` responses to `POST /sessions` for validation failures and unknown agent name.
- Added `400 Bad Request` to `PATCH /sessions/:id` for validation failures.
- Added `400 Bad Request` to `POST /sessions/:id/input` for unknown or already-resolved tool call IDs.
- Added multiple-subscriber guidance to tool call documentation: clients must dismiss pending tool permission UI when another subscriber resolves the same tool call.

### Changed

- Changed `GET /sessions/:id/history` pagination from index-based (`start`/`end`) to cursor-based (`before`). No cursor returns the most recent messages; pass `before` to page backward. History is returned in reverse chronological order.
- Changed secret option values in session responses from the literal string `"[redacted]"` to a boolean (`true` if stored, `false` if not).
- Changed `ToolUseContentBlock` type discriminant from `"tool_use"` to `"tool_call"` for naming consistency.
- Renamed `response.md` to `events.md` and `endpoints.md` sidebar label updated to "Endpoints".
- Updated `history` capability schema from opaque `{}` to `{ tail?: {} }` to support future query mode extensibility.
- Simplified `POST /sessions` retry behavior note, folding it into the `201 Created` response section.
- Removed hardcoded `message` field from error response examples; `message` is now documented as optional and implementation-defined.
- Updated `GET /sessions/:id/history` response shape to include `before` cursor and per-message `id` and `timestamp`.

### Removed

- Removed `Event Types` section from `endpoints.md`; superseded by the dedicated `events.md` page.
- Removed `Get Session History` section from `history.md`; HTTP reference now lives exclusively in `endpoints.md`.
- Removed index-based `start` and `end` query parameters from `GET /sessions/:id/history`.

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
