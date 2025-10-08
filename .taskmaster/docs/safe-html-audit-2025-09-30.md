# Safe HTML Rendering Audit — Linkage VA Hub (e Systems + Linkage)
Date: 2025-09-30
Scope: Tasks 44.1 and 44.9

Summary
- All primary message-rendering surfaces and insertion points have been inventoried across the Next.js app and the Linkage VA Hub MERN stack.
- Internal “Dashboard” anchor is preserved and clickable through SPA routing in the Next app, and preserved as safe HTML on the MERN stack server responses and clients.
- A unified allowlist sanitizer is used server-side in the MERN stack and client-side in Next via a strict utility.
- Gaps noted and recommendations provided below.

Audited Surfaces (Next app)
- Component that sanitizes and routes internal anchors:
  - [src/components/SafeHtml.tsx](../../../src/components/SafeHtml.tsx)
  - [src/lib/sanitize-html.ts](../../../src/lib/sanitize-html.ts)
- Conversations root page using clickable system nudge:
  - [src/app/conversations/page.tsx](../../../src/app/conversations/page.tsx)
- Conversations thread view (system messages use SafeHtml):
  - [src/app/conversations/_components/ThreadView.tsx](../../../src/app/conversations/_components/ThreadView.tsx)
- Conversations list preview (uses SafeHtml for system last message preview):
  - [src/app/conversations/_components/ConversationList.tsx](../../../src/app/conversations/_components/ConversationList.tsx)
- Seeded default system HTML with internal anchor:
  - [src/lib/messengerMock.ts](../../../src/lib/messengerMock.ts)

Audited Surfaces (MERN stack — Backend)
- Canonical sanitizer (allowlist policy, contexts web/email):
  - [Linkage VA Hub MERN Stack/backend/utils/sanitizeHtml.js](../../backend/utils/sanitizeHtml.js)
- Routes and controllers attaching sanitized fields (bodyHtmlSafe/paramsSafe):
  - [Linkage VA Hub MERN Stack/backend/routes/messages.js](../../backend/routes/messages.js)
  - [Linkage VA Hub MERN Stack/backend/routes/conversations.js](../../backend/routes/conversations.js)
  - [Linkage VA Hub MERN Stack/backend/routes/notifications.js](../../backend/routes/notifications.js)
  - [Linkage VA Hub MERN Stack/backend/controllers/messagesController.js](../../backend/controllers/messagesController.js)
  - [Linkage VA Hub MERN Stack/backend/controllers/announcementController.js](../../backend/controllers/announcementController.js)
  - [Linkage VA Hub MERN Stack/backend/utils/notificationHelper.js](../../backend/utils/notificationHelper.js)
- Mongoose models compute sanitized variants on save:
  - [Linkage VA Hub MERN Stack/backend/models/Message.js](../../backend/models/Message.js)
  - [Linkage VA Hub MERN Stack/backend/models/Notification.js](../../backend/models/Notification.js)
- Email templates sanitize and rewrite relative anchors to absolute:
  - [Linkage VA Hub MERN Stack/backend/utils/email.js](../../backend/utils/email.js)
- Policy tests validating internal anchors and scheme blocking:
  - [Linkage VA Hub MERN Stack/backend/tests/sanitizeHtml.policy.spec.js](../../backend/tests/sanitizeHtml.policy.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/sanitizeHtml.spec.js](../../backend/tests/sanitizeHtml.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/messages.route.spec.js](../../backend/tests/messages.route.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/notifications.route.spec.js](../../backend/tests/notifications.route.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/conversations.route.spec.js](../../backend/tests/conversations.route.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/onboarding.test.js](../../backend/tests/onboarding.test.js)

Audited Surfaces (MERN stack — Frontend)
- SPA-safe HTML wrapper (intercepts internal anchors) and usage in Conversations:
  - [Linkage VA Hub MERN Stack/frontend/src/components/SafeHtml.jsx](../../frontend/src/components/SafeHtml.jsx)
  - [Linkage VA Hub MERN Stack/frontend/src/pages/Conversations/index.js](../../frontend/src/pages/Conversations/index.js)
  - [Linkage VA Hub MERN Stack/frontend/src/pages/Conversations/Detail.js](../../frontend/src/pages/Conversations/Detail.js)
- Announcement/Dashboard surfaces rendering sanitized HTML:
  - [Linkage VA Hub MERN Stack/frontend/src/pages/Announcements.js](../../frontend/src/pages/Announcements.js)
  - [Linkage VA Hub MERN Stack/frontend/src/pages/Dashboard.js](../../frontend/src/pages/Dashboard.js)
  - [Linkage VA Hub MERN Stack/frontend/src/components/AnnouncementBanner.js](../../frontend/src/components/AnnouncementBanner.js)
  - [Linkage VA Hub MERN Stack/frontend/src/pages/Notifications.js](../../frontend/src/pages/Notifications.js)
- Default system HTML (internal anchor reference):
  - [Linkage VA Hub MERN Stack/frontend/src/constants/systemHtml.js](../../frontend/src/constants/systemHtml.js)

Root Causes Identified
- Internal anchor not navigating via SPA in Next app unless clicks are intercepted. Resolved by SafeHtml component which sanitizes content and intercepts clicks on site-relative anchors to push via the router.
- Legacy client areas that used dangerouslySetInnerHTML without consistent policy now rely on server-provided sanitized fields (bodyHtmlSafe/paramsSafe) or a SafeHtml wrapper.
- Consistency gaps between server-side sanitization (MERN) and client-side sanitization (Next) addressed through allowlist policies aligning on allowed tags, attributes, and safe URI schemes.

Fixes Implemented or Confirmed
- Next app:
  - Centralized SafeHtml component and strict client-side sanitizer:
    - [src/components/SafeHtml.tsx](../../../src/components/SafeHtml.tsx)
    - [src/lib/sanitize-html.ts](../../../src/lib/sanitize-html.ts)
  - Conversations root nudge and thread list previews render sanitized HTML with working internal navigation:
    - [src/app/conversations/page.tsx](../../../src/app/conversations/page.tsx)
    - [src/app/conversations/_components/ConversationList.tsx](../../../src/app/conversations/_components/ConversationList.tsx)
    - [src/app/conversations/_components/ThreadView.tsx](../../../src/app/conversations/_components/ThreadView.tsx)
- MERN backend:
  - All message/notification/announcement surfaces attach sanitized HTML fields; tests assert internal anchors are preserved and dangerous schemes removed:
    - [Linkage VA Hub MERN Stack/backend/utils/sanitizeHtml.js](../../backend/utils/sanitizeHtml.js)
    - [Linkage VA Hub MERN Stack/backend/tests/sanitizeHtml.policy.spec.js](../../backend/tests/sanitizeHtml.policy.spec.js)
    - [Linkage VA Hub MERN Stack/backend/tests/sanitizeHtml.spec.js](../../backend/tests/sanitizeHtml.spec.js)
    - [Linkage VA Hub MERN Stack/backend/tests/messages.route.spec.js](../../backend/tests/messages.route.spec.js)
    - [Linkage VA Hub MERN Stack/backend/tests/notifications.route.spec.js](../../backend/tests/notifications.route.spec.js)
    - [Linkage VA Hub MERN Stack/backend/tests/conversations.route.spec.js](../../backend/tests/conversations.route.spec.js)

Gaps and Recommendations
- Align default class styling for anchors across clients for consistent UX (e.g., underline/brand color) to match server policy expectations.
- Keep “data:” URIs blocked by default on web (permit only if explicitly required and constrained to allowed media types).
- Ensure all client surfaces use a sanitized source (server-provided bodyHtmlSafe/paramsSafe) or SafeHtml component; avoid raw dangerouslySetInnerHTML without allowlist sanitization.
- Maintain CSP and monitoring for any injection regressions; extend E2E coverage to click internal anchors rendered via sanitized HTML from multiple app surfaces.

Proposed Status
- Task 44.1 “Audit message-rendering surfaces and root causes …” — Ready for Review
- Task 44.9 “Audit all message-rendering surfaces and insertion points” — Ready for Review

Evidence (Representative)
- Internal anchor preserved in sanitized output (server tests):
  - [Linkage VA Hub MERN Stack/backend/tests/sanitizeHtml.policy.spec.js](../../backend/tests/sanitizeHtml.policy.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/messages.route.spec.js](../../backend/tests/messages.route.spec.js)
  - [Linkage VA Hub MERN Stack/backend/tests/notifications.route.spec.js](../../backend/tests/notifications.route.spec.js)