---
head:
  - - meta
    - name: description
      content: How Agent Application Protocol (AAP) manages conversation history — server-side compaction, client-side persistence, and history capabilities.
  - - meta
    - property: og:title
      content: History Management — Agent Application Protocol
  - - meta
    - property: og:description
      content: How Agent Application Protocol (AAP) manages conversation history — server-side compaction, client-side persistence, and history capabilities.
  - - meta
    - property: og:url
      content: https://agentapplicationprotocol.com/history
  - - meta
    - name: twitter:title
      content: History Management — Agent Application Protocol
  - - meta
    - name: twitter:description
      content: How Agent Application Protocol (AAP) manages conversation history — server-side compaction, client-side persistence, and history capabilities.
---

# Session History

## Purpose

Session history is the durable record of a completed conversation. Its primary role in the protocol is **reconnection recovery**: when a client disconnects and reconnects, it can call `GET /sessions/:id/history` to restore earlier conversational context that is no longer present in the live event stream.

History is a complement to the live event stream, not a replacement for it. On reconnect, the server replays all events not yet persisted into history via `GET /sessions/:id/events/stream`. The client uses history only when it needs earlier context that has already been folded into durable storage.

## Server Responsibility

The server owns session history. How the server stores, compacts, summarizes, or retains session records is an implementation detail — the protocol does not prescribe it. A server may store history in S3, a database, or any other durable store, and may compact or summarize content as needed to keep it tractable for the LLM.

The protocol only guarantees that what `GET /sessions/:id/history` returns is sufficient for the client to restore conversational context after a disconnect.

## History Capability

An agent declares history support via the `history` key in `capabilities` from `GET /meta`:

```json
{
  "capabilities": {
    "history": {
      "tail": {}
    }
  }
}
```

If `history` is absent from `capabilities`, the agent does not support history retrieval. Clients must not call `GET /sessions/:id/history` for such agents.

Sub-keys declare which query modes are supported. If `history.tail` is present, the agent supports tail-based paging: no cursor returns the most recent messages, and the `before` cursor pages backward through older messages. How the server stores, compacts, or retains session records is an implementation detail.

## Audit Trails

Audit trails, full uncompacted message logs, and other record-keeping requirements are outside the scope of this protocol. Servers and clients that need audit capabilities should define additional endpoints or mechanisms outside of AAP.

## Recovery Flow

On reconnect, a client restores session context by combining two sources:

1. **Live event replay** — `GET /sessions/:id/events/stream` replays all events not yet persisted into history. This covers the active, in-progress portion of the session.
2. **Durable history** — `GET /sessions/:id/history` provides the persisted record of completed work. Call this when earlier context is needed that is no longer present in the live stream.

For pending tool calls after a disconnect, use `GET /sessions/:id` to retrieve the `pending` list and resume from there. See [tool call resumption](/tool-call#tool-call-resumption).
