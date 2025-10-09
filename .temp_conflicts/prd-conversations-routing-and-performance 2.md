# PRD: Conversations Routing and Performance Overhaul (Masquerade + iMessage-class UX)

Document version: 0.1 (Draft)  
Owners: Platform/Conversations Team  
Last updated: 2025-09-29

1. Summary

Upgrade the Conversations/Messages system across the Linkage ecosystem (E Systems “business” brand, Linkage VA, Linkage Admin) to:
- Implement Business→Admin masquerade routing and Admin↔VA direct messaging
- Enforce 80% business profile completion gating for messaging
- Render a default system message at /conversations with a clickable link to /dashboard
- Achieve iMessage-class UX and performance: real-time delivery, typing indicators, optimistic send, low latency, stable ordering, and resilient reconnect

This PRD is the required plan for Epic (Task 43) prior to implementation.

2. Goals and Non-Goals

2.1 Goals
- Correct and consistent routing:
  - Business→Admin messages go to Admin with appropriate visibility and auditability
  - Admin↔VA direct messaging without leaking context or violating permissions
  - Admin “masquerade” reply to VAs on behalf of a business (clearly labeled + fully audited)
- Profile gating:
  - If a business profile completeness < 80%, compose is disabled and users see a clear system message with a CTA to /dashboard
- Default system message:
  - At /conversations, when the inbox is empty or user is gated, show a default system message including a clickable /dashboard link
- Performance & UX:
  - Real-time delivery and typing indicators
  - Optimistic sends with retry and visible pending/sent/failed states
  - Ordering guaranteed under reconnects/duplicates
  - Resilient reconnect with offline queue/backoff

2.2 Non-Goals
- New external channel integrations (SMS, WhatsApp) beyond existing stack
- Overhauling RBAC across the entire platform (only what’s required for conversations)
- Redesigning global navigation outside the conversations feature

3. Personas and Roles

- Business User (E Systems brand):
  - Can message Admin
  - Must meet profile completion threshold (≥80%) to compose new messages
- Admin User (Linkage Admin):
  - Can directly message VAs
  - Can “masquerade” (act on behalf of a Business) when replying to VAs; all actions are labeled and audited
- VA User (Linkage VA):
  - Can message Admins and, when allowed, Businesses; respects visibility rules

4. Definitions

- Masquerade: Admin assumes Business identity within a conversation thread to communicate with a VA without exposing Admin identity to the Business or VA where appropriate. All masquerade actions are labeled and audited.
- Visibility: Which party can see which messages. Admin↔VA “private” threads must not leak to Business unless explicitly configured.
- Gating: Blocking compose/send if Business profile completeness < 80%, showing a system banner and default message with CTA.

5. Current State (High-Level)

- Conversations exist across multiple brand frontends (Next.js/React for E Systems and Linkage VA; Linkage Admin as applicable)
- Real-time may be in place but lacks consistent typing/optimistic behavior and robust reconnection semantics
- HTML rendering for messages is inconsistent (see Task 44 for sanitation/clickable links); the PRD references it but its implementation is tracked separately

6. Functional Requirements

6.1 Routing and Flows
- Business→Admin
  - From Business UX, “New Message” targets Admin (team inbox/queue)
  - Server routes messages to Admin inbox; Business cannot directly message a VA unless allowed by policy
  - Admin replies can be either:
    - Admin↔Business (normal)
    - Admin→VA (masquerading as the Business), see Masquerade below
- Admin↔VA Direct Messaging
  - Admin can DM a VA regarding a Business context:
    - Private Admin↔VA thread not visible to Business by default
    - Optionally, Admin can post a “Business-visible” note to keep Business informed (out of scope to fully design in v1; stub with simple “visible-to-business” toggle)
- Masquerade (Admin-on-behalf-of-Business)
  - Admin can reply to VA in a Business-context thread as “Business”
  - UI shows “Masquerading as BusinessName” with colored badge + tooltip
  - Server appends:
    - masquerade_actor_id (Admin user id)
    - masquerade_for_business_id (Business id)
    - actor_effective_role = business (effective sending identity)
  - All masquerade messages are:
    - Clearly labeled in Admin UI
    - Logged to audit trail (actor, effective role, timestamp, conversation id, message id)
  - Security checks:
    - Admin must have permission to act for that Business
- Visibility Rules
  - Define route_type with semantics:
    - BUSINESS_TO_ADMIN
    - ADMIN_TO_BUSINESS
    - ADMIN_TO_VA_PRIVATE
    - ADMIN_MASQUERADE_TO_VA_AS_BUSINESS
  - The UI enforces visibility:
    - Private Admin↔VA threads are not shown to Business
    - Masquerade messages appear to VA as if from Business; Admin UI displays the masquerade banner
- Message Targeting and Threading
  - All sends must include: conversation_id (or thread_id), route_type, effective_actor, and visibility
  - Server validates target and route_type combinations

6.2 Profile Gating (80% Rule)
- Profile completeness (%) computed server-side and exposed in session/profile payloads
- If < 80%:
  - Disable compose input and send button
  - Display system banner and default system message
  - Show CTA/button linking to /dashboard
- When reaching ≥ 80%:
  - Compose is enabled without refresh if possible (react to real-time profile updates or polling)

6.3 Default System Message at /conversations
- At /conversations (e.g., http://localhost:3002/conversations/) show a default system message when:
  - No existing threads OR
  - User is gated by profile < 80%
- Message copy (initial draft):
  - Title: “Welcome to Messages”
  - Body: “To get started, complete your business profile, then start a conversation with Admin. You can manage your account on the Dashboard.”
  - Link: an HTML anchor <a href="/dashboard">Dashboard</a> that must be clickable and route to /dashboard
- The message is rendered as sanitized HTML (see Task 44); ensure internal links are clickable

6.4 Performance and UX Requirements (iMessage-class)
- Real-time Delivery
  - Use existing real-time transport (WebSocket/Realtime) to deliver new messages and typing events
  - p50 delivery latency ≤ 300ms, p95 ≤ 800ms within the same region
- Typing Indicators
  - Ephemeral events per conversation (start/stop typing)
  - Debounce to reduce noise; suppress display after short inactivity
- Optimistic Sends
  - Client generates a temporary id (e.g., UUID v4)
  - Show a “pending” bubble immediately
  - On server ack, replace with canonical message id, set state=“sent”
  - On failure (network/server), set state=“failed” with retry UI
- Ordering and Idempotency
  - Ordering is by server-assigned created_at and a monotonic id/snowflake to resolve ties
  - Client sends idempotency keys to avoid dupes on retry (see code: src/lib/idempotency.ts for reference)
  - On reconnect, client requests messages since last_known_id (or time), merges without duplicates, repairs order
- Resilient Reconnect
  - Detect offline/online; queue outgoing while offline
  - Exponential backoff for socket reconnects
  - On reconnect, resync pending state and fetch deltas
- Read Receipts (optional v1.1)
  - Track last_read_message_id per user; not required for v1.0

7. Data Model Additions (Illustrative)

Messages
- id: string (snowflake)
- conversation_id: string
- sender_user_id: string
- effective_role: enum(“business”, “admin”, “va”)
- route_type: enum(“BUSINESS_TO_ADMIN”, “ADMIN_TO_BUSINESS”, “ADMIN_TO_VA_PRIVATE”, “ADMIN_MASQUERADE_TO_VA_AS_BUSINESS”)
- masquerade_actor_id?: string (when Admin masquerades)
- masquerade_for_business_id?: string
- body_html_sanitized: text (server-sanitized)
- body_text: text (optional, derived)
- idempotency_key: string
- created_at: timestamp (server)
- ordering_key: bigint (snowflake)
- state: enum(“sent”, “edited”, “deleted”) — optimistic states are client-only

Conversations
- id: string
- business_id: string
- participants: [user_id]
- visibility_policy: JSON (private vs business-visible flags for threads)
- last_message_id: string
- updated_at: timestamp

TypingEvents (ephemeral, not persisted long-term)
- conversation_id: string
- user_id: string
- started_at: timestamp
- stopped_at: timestamp

AuditLogs
- id, actor_user_id, effective_role, action, conversation_id, message_id?, details JSON, created_at

8. APIs (Illustrative)

POST /api/conversations/:id/messages
- Body: { idempotencyKey, routeType, masqueradeForBusinessId?, bodyHtml }
- Validates permissions, applies route_type visibility, sanitizes HTML (Task 44 policy), assigns id + ordering key
- Returns canonical message

GET /api/conversations/:id/messages?sinceId=…&limit=…
- Returns ordered messages and allows resync after reconnect

POST /api/conversations/:id/typing
- Body: { typing: true|false }
- Emits ephemeral event to other participants

GET /api/profile
- Includes profileCompleteness and gating flags to drive UI state

9. Security, Privacy, Compliance

- RBAC/Permission checks:
  - Admin masquerade requires explicit permission to act for Business
  - Admin↔VA private threads never leak to Business without opt-in
- Auditability:
  - All masquerade sends are recorded with actor, effective role, conversation, message
- Data protection:
  - Server-side sanitization (Task 44) for message HTML; CSP enforced on clients
- Do not expose internal actor ids or masquerade metadata to clients that shouldn’t see it

10. Observability & SLOs

Metrics
- real_time_delivery_latency_ms (p50/p95)
- message_send_error_rate
- reconnect_attempts_count and success_rate
- optimistic_send_duration_to_ack_ms
- ordering_repair_events_count

SLOs (initial)
- Delivery: p50 ≤ 300ms, p95 ≤ 800ms
- Error rate: < 0.5% over 1h rolling window for send API
- Reconnect success: ≥ 99% within 30s

Logs/Tracing
- Tag conversation_id, message_id, route_type, actor_role, masquerade flags
- Sample traces for send → ack → deliver

11. UX Requirements

- Message bubbles: pending/sending/failed states with clear indicators and retry affordance
- Typing indicators show avatar/name “X is typing…”
- Masquerade badge for Admin UI when composing/sending on behalf of a Business
- Default system message at /conversations with clickable <a href="/dashboard">Dashboard</a>
- Gating banner with CTA to /dashboard if profile < 80%

12. Rollout Plan

- Feature Flags
  - ff_conversations_overhaul: gates new routing and performance behaviors
  - ff_masquerade: admin masquerade capability
  - ff_typing_indicators: typing on/off
  - ff_optimistic_send: per-brand rollout of optimistic behavior
- Migration
  - Backfill route_type for recent messages where possible
  - Initialize audit trail structures
- Phases
  1) Dev/QA environments with synthetic load
  2) Internal Admin and VA dogfood
  3) Limited Business cohort with gating and default system message enabled
  4) Gradual 100% rollout
- Kill Switches
  - Ability to disable optimistic sends or typing if regressions observed

13. Testing Strategy

- Unit Tests
  - Routing resolver, permission checks, masquerade labeling, idempotency key handling
- Integration/API
  - End-to-end send → save → ack → deliver
  - Reconnect and delta fetch (sinceId)
- Frontend
  - Optimistic UI states, retry flows, typing indicator debounce, default system message rendering
- E2E
  - Business→Admin flows including gating OFF/ON
  - Admin↔VA private threads
  - Admin masquerade to VA with proper audit logs
- Load/Soak
  - Simulate high message throughput; verify latency SLOs and ordering repair
- Security
  - Verify no leakage from private Admin↔VA threads
  - Verify masquerade permissions and audit records

14. Risks and Mitigations

- Risk: Ordering drift under heavy reconnects
  - Mitigation: server-assigned ordering key and idempotent merges
- Risk: Gating confuses users
  - Mitigation: clear banner copy + CTA; track conversion from banner to /dashboard
- Risk: Masquerade misuse
  - Mitigation: explicit permission checks, audit trail, prominent UI labeling
- Risk: Real-time instability
  - Mitigation: exponential backoff, offline queue, kill switches per capability

15. Implementation Plan (High-Level Work Breakdown)

Backend
- Add route_type, masquerade fields, audit logs
- Enforce permission checks and visibility
- Expose profileCompleteness for gating
- Sanitize HTML server-side (aligned with Task 44)

Frontend (E Systems, Linkage VA, Linkage Admin)
- Gating banner + disable compose when profile < 80%
- Default system message at /conversations with clickable /dashboard link
- Optimistic send, typing indicators, reconnect/resync, retry UI
- Masquerade badge and compose context for Admin

Real-time
- Typing event channels per conversation
- Reconnect/resubscribe handling

Observability
- Metrics, logs, tracing, dashboards, alerts

Feature Flags
- Gate rollout per brand and capability

16. Acceptance Criteria

- Business→Admin messages are correctly routed and visible to Admin
- Admin↔VA DMs function; private threads do not appear to Business
- Admin can masquerade as Business in VA threads; audit records exist and UI displays “Masquerading as BusinessName”
- Business profile < 80% disables compose and shows gating banner + default system message; clicking /dashboard opens the dashboard
- /conversations shows default system message when empty/gated, and the Dashboard link is clickable and navigates to /dashboard
- Real-time delivery metrics: p50 ≤ 300ms, p95 ≤ 800ms on test data
- Typing indicators appear and debounce properly
- Optimistic sends show pending state, then resolve to sent or failed with retry
- Reconnect repairs ordering and resumes delivery without dupes
- All sanitized HTML renders safely (Task 44 implementation provides the sanitizer)

17. Open Questions

- Should Business be able to DM a VA directly or always triage via Admin?
- Should Admin↔VA private threads optionally surface summaries or decisions to Business automatically?
- Do we need read receipts in v1.0 or defer to v1.1?
- Are there cross-region latency expectations requiring global presence or edge pub/sub?

Appendix A: Related Work

- Task 44: Safe HTML rendering, unified sanitization policy, and fixing non-clickable Dashboard links
- Idempotency utility reference: src/lib/idempotency.ts (client/server idempotent send alignment)