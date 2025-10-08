# Conversations: Reconnect Backoff, Resumable Cursors, and Telemetry

Date: 2025-09-30
Related work:
- Server routes updated: [messages.js](../../backend/routes/messages.js)
- Controller updated: [messagesController.js](../../backend/controllers/messagesController.js)
- Model sequencing support: [Message.js](../../backend/models/Message.js)

Overview
This document specifies and implements server-side semantics to support:
- Stable, ascending ordering of messages.
- Resumable cursors using serverSequence and/or createdAt.
- Telemetry hooks to validate ordering and inform client backoff behavior.
- Backward-compatible page/limit mode.

API: GET /api/messages/:conversationId
This endpoint now supports both legacy pagination and cursor-based retrieval. Cursor mode is enabled if any of the following query parameters are present.

Query Parameters (cursor mode)
- before: string (messageId)
  - Returns messages with createdAt < that message’s createdAt (oldest-first).
- after: string (messageId) [legacy]
  - Returns messages with createdAt > that message’s createdAt (oldest-first).
- afterId: string (messageId)
  - Preferred alias of after for clarity; createdAt > provided message’s createdAt.
- afterSeq: number
  - Uses serverSequence to return messages where serverSequence > afterSeq.
  - serverSequence is per-conversation monotonic if available.
- since: string (ISO date)
  - Returns messages with createdAt > since.
- limit: number (default 50)
  - Maximum number of messages to return.

Ordering
- Cursor mode: results are ordered ascending by createdAt, then _id for tie-breaking.
- Legacy page/limit mode: results are returned descending by createdAt and post-processed to ascending.

Response (cursor mode)
- success: boolean
- data:
  - messages: array of message documents (each with bodyHtmlSafe ensured)
  - conversation: metadata for client UX (participants, theme, etc.)
  - userStatuses: present if controller route used
  - hasMore: boolean
  - pageInfo:
    - mode: "cursor"
    - limit: number
    - hasMore: boolean
    - nextCursor: string | null
      - The _id of the last returned message (for convenience).
    - resumeCursor: number | null
      - The serverSequence of the last returned message (preferred resume point).
    - seqStart: number | null
    - seqEnd: number | null
    - recommendedBackoffMs: number
      - Client backoff hint (200ms if results returned; 1500ms if none).
  - telemetry:
    - sequenceMonotonic: boolean
      - Whether serverSequence values were non-decreasing across the page.
    - returned: number
      - Count of messages returned.

Response (page mode)
- success: boolean
- data:
  - messages: array
  - hasMore inferred from length === limit
  - pagination: page/limit/total/pages
  - pageInfo: { mode: "page", limit }

Client Guidance: Resumable Logic
- Preferred resume key: resumeCursor (serverSequence).
- Fallback: nextCursor (message _id) or createdAt+_id composite if needed.
- On empty result:
  - Wait recommendedBackoffMs then try since=lastSeenCreatedAt or afterSeq=lastSeq if available.
- On transient error (>=500):
  - Exponential backoff (e.g., 500ms, 1000ms, 2000ms...) capping at ~8–10s.
  - Resume using last known resumeCursor.

Examples

1) Initial load (latest ascending window):
curl -s "http://localhost:8000/api/messages/CONVO_ID?limit=50"

2) Resume from sequence:
curl -s "http://localhost:8000/api/messages/CONVO_ID?afterSeq=1234&limit=50"

3) Resume from message id:
curl -s "http://localhost:8000/api/messages/CONVO_ID?afterId=66f...abc&limit=50"

4) Window before a known message (older history):
curl -s "http://localhost:8000/api/messages/CONVO_ID?before=66f...abc&limit=50"

5) Poll for new messages since a timestamp:
curl -s "http://localhost:8000/api/messages/CONVO_ID?since=2025-09-30T00:00:00.000Z&limit=100"

Telemetry and Observability
- messages.fetch.cursor log event emitted (if logger is present) with:
  - conversationId, count, seqStart, seqEnd, sequenceMonotonic, hasMore.
- Clients should surface telemetry in debug builds to correlate gaps/duplicates.

Edge Cases and Fallbacks
- If serverSequence is absent for some records (legacy data), clients can:
  - Fall back to afterId/createdAt.
  - Continue ordering by createdAt then _id.
- Duplicate defense:
  - Client should de-dup by _id on merge.
- Missing or deleted messages:
  - Cursor gaps are acceptable; ordering and monotonic sequence mitigate resequencing.

Acceptance Criteria
- GETs with cursor parameters return ascending order, stable tie-breakers.
- Telemetry flags sequenceMonotonic correctly.
- recommendedBackoffMs aligns with result count.
- Legacy consumers using page/limit continue to work unchanged.

Notes
- Sequencing depends on conversation.messagesCount increment in [Message.js](../../backend/models/Message.js).
- New indexes to support cursor and resume paths in [Message.js](../../backend/models/Message.js).
- Client slice complement (already shipped): connectivity banners, stable ordering, refresh hook in [ThreadView.tsx](../../../src/app/conversations/_components/ThreadView.tsx).