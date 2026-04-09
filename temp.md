Now I have a complete picture. Here's the full analysis:

Vibes — Architecture Deep Dive
What This Project Is
Vibes is a video-sharing platform (think mini-YouTube) where users upload videos, which get automatically transcoded into adaptive HLS streams, and other users can watch, like, comment, and subscribe.

Architecture Overview

┌─────────────┐     SAS URL      ┌──────────────────┐
│  React SPA   │──── upload ─────▶│  Azure Blob      │
│  (Vite)      │                  │  (tempbucket)     │
│              │                  └────────┬─────────┘
│              │                           │ Blob Trigger
│              │                  ┌────────▼─────────┐
│              │                  │  Azure Function   │
│              │                  │  (startTranscoding)│
│              │                  └────────┬─────────┘
│              │                           │ Spawns
│              │                  ┌────────▼─────────┐
│              │                  │  Docker Container │
│              │                  │  (Go + FFmpeg)    │
│              │                  │  on Azure ACI     │
│              │                  └────────┬─────────┘
│              │                           │ Uploads HLS
│              │    REST API      ┌────────▼─────────┐
│              │◀──────────────▶ │  Express Server   │
│              │                  │  (main-server)    │
└─────────────┘                  └────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                                 │  MongoDB Atlas    │
                                 └──────────────────┘
The 4 independent services:

Service	Tech	Deployed On	Role
client/	React 19 + Vite + TailwindCSS	Vercel	SPA frontend
main-server/	Express + TypeScript	Vercel Serverless	REST API, auth, CRUD
TempBlobTriggerApp/	Azure Functions (TS)	Azure	Blob event → spawn container
transcoder/	Go + FFmpeg	Azure Container Instances	Download → transcode → upload HLS
Data Flow (the clever part)
Upload flow — the client never sends the video through your server:

Client requests SAS URLs from Express → video.ts:10-59
Client uploads directly to Azure Blob using the SAS URL (browser → Azure)
Azure Blob trigger fires the Azure Function → startTranscoding.ts:34-38
Azure Function spins up a Docker container (Go) → startTranscoding.ts:46-152
Go transcoder: downloads raw video → FFmpeg HLS (1080p/720p/480p) → uploads segments to permanent bucket → updates MongoDB → self-destructs → main.go
Auth flow — cookie-based JWT:

Signup/signin → bcrypt hash → JWT in httpOnly cookie (sameSite: none, secure: true) → user.ts
Middleware extracts auth_token cookie → verifies JWT → injects req.userId → validateAuth.ts
Like/Dislike — uses MongoDB transactions for atomicity (update Like doc + Video counter in one session) → video.ts:142-336

Drawbacks (Ranked by Severity)
1. Security Issues (Critical)
a. No input validation on the server

user.ts:9: req.body is trusted directly. No length limits, no email format validation, no password strength checks. An attacker can create users with absurdly long usernames or inject garbage.
video.ts:13: Video metadata (title, description, tags) is stored as-is with zero sanitization. Potential stored XSS if any field is rendered raw.
b. Secrets leaked in container environment variables

startTranscoding.ts:76-102: MONGODB_URI, AZURE_CLIENT_SECRET are passed as plain-text env vars to ACI containers. Anyone with Azure portal access or container logs can see them. Azure Container Instances env vars are not secret by default.
c. No authorization checks

Any authenticated user can like/delete/comment on any video. There's no ownership check on video operations. The delete comment check is only on the controller level — no middleware for it.
video.ts:97: getVideoById increments views on every request, even bot refreshes. No rate limiting, no dedup.
d. Transcoderd video URLs are public

video.ts:117-118: The TODO comment confirms transcoded video URLs have no auth. Anyone with the URL can stream any video forever.
e. Error objects sent to client

user.ts:43: msg: error sends the raw error object (potentially including stack traces, DB details) to the frontend.
2. Architectural Issues (High)
a. No failure handling in the transcoding pipeline

If the Go transcoder crashes, the video stays PENDING forever. There is no retry mechanism, no dead-letter queue, no timeout monitor. The Azure Function is fire-and-forget — startTranscoding.ts:148-151 catches the error but just logs it.
The transcoder's defer block to self-delete can panic → main.go:48-71, which means the container could be left running (and billing).
b. No pagination

video.ts:64: VideoModel.find({}).limit(30) — hardcoded limit, no offset, no cursor. Once you have 100+ videos, users can only see the first 30.
c. View count is trivially inflatable

video.ts:97-98: Every GET /video/:videoId increments views by 1. No deduplication per user/session/IP. A curl loop could inflate any video to millions of views.
d. Dead code / unused infrastructure

S3 utilities (main-server/src/utils/s3/): fully written but never used.
Redis client + atomic counter (main-server/src/utils/redis/): configured but never called from any route.
Rate limiter utility exists but is never applied to any route.
e. Tight coupling between transcoder and MongoDB

The Go transcoder directly writes to MongoDB → main.go:167-201. If you ever change your DB schema, you need to redeploy the transcoder Docker image. This is a cross-service coupling that should go through an API or message queue.
3. Reliability Issues (Medium)
a. No health checks or monitoring

No /health endpoint on the Express server.
No way to monitor transcoding pipeline status other than manually checking MongoDB.
No alerting if transcoding jobs pile up in PENDING state.
b. Bcrypt cost factor is too low

createHash uses 7 rounds. Industry standard is 12+. This makes brute-forcing passwords significantly easier.
c. CORS preflight is inconsistent

index.ts:14-19 allows 4 origins, but the OPTIONS handler at index.ts:27-33 only allows localhost:5173. Preflight in production would fail.
d. No graceful shutdown

Express server has no signal handlers. On Vercel this is less critical, but there's no drain period for in-flight MongoDB transactions.
e. FFmpeg scale filter assumes 16:9

transcoder.go:122-124: Hardcoded 1920:1080, 1280:720, 854:480. A portrait video (9:16) gets force-stretched/squashed. Should use scale=w=1280:h=720:force_original_aspect_ratio=decrease.
4. Code Quality Issues (Low-Medium)
a. Massive duplication in like/dislike

video.ts:142-237 and video.ts:239-336 are nearly identical (~200 lines each) with LIKED/DISLIKED swapped.
b. console.log everywhere instead of structured logging

Winston logger exists at main-server/src/utils/server/logger.ts but controllers use console.log/console.error throughout.
c. No tests anywhere

Zero unit tests, zero integration tests, zero E2E tests across all 4 services.
d. No route protection on frontend

Any route is accessible without auth. /video-upload renders the form for unauthenticated users — it just fails when they try to submit.
What To Do (Prioritized Roadmap)
Phase 1 — Fix What's Broken (Security & Reliability)
#	Action	Where
1	Add input validation with Zod on all API endpoints (you already use it on the frontend — mirror it on the backend)	main-server/src/controllers/*
2	Sanitize error responses — never send raw error objects. Return generic messages, log full errors server-side with Winston	All controllers
3	Use ACI secureEnvironmentVariables for MONGODB_URI, AZURE_CLIENT_SECRET instead of plain environmentVariables	startTranscoding.ts
4	Add a transcoding failure handler — a cron/scheduled function that checks for videos stuck in PENDING > 30 min, marks them FAILED, and optionally retries (max 2 attempts)	New Azure Function or scheduled job
5	Fix CORS — make the preflight handler use the same origin list as the main CORS config	main-server/src/index.ts
6	Increase bcrypt rounds to 12	main-server/src/utils/server/bcryptjs.ts
7	Fix FFmpeg aspect ratio — use force_original_aspect_ratio=decrease,pad to handle non-16:9 inputs	transcoder/transcoder.go
Phase 2 — Make It Production-Ready
#	Action	Why
8	Add pagination (cursor-based) to GET /api/video and GET /api/comments/:videoId	Can't scale beyond 30 videos
9	Deduplicate view counting — track views per (userId + videoId) with a 24h window in a View collection, or use Redis with TTL keys for this	View inflation
10	Sign transcoded video URLs — generate short-lived SAS URLs for HLS master.m3u8 at read time (you already have the code for thumbnails, do the same for videos — the commented-out code at video.ts:117-118)	Anyone can hotlink videos
11	Add a /health endpoint and basic monitoring (video status distribution, container count)	Observability
12	Decouple transcoder from MongoDB — have the transcoder call back to the Express API (e.g., PUT /api/internal/video/:id/complete) instead of writing to MongoDB directly. Protect with an internal API key	Schema changes shouldn't require Docker rebuilds
13	Delete dead code — remove the S3 utils, or if you're not using Redis yet, remove it too. Clean inventory	Reduces confusion and attack surface
14	Add route guards on the frontend — redirect unauthenticated users away from /video-upload	UX
Phase 3 — Scale & Polish
#	Action	Why
15	Add a message queue (Azure Service Bus or a simple Redis queue) between the blob trigger and the transcoder. This gives you retry, backpressure, and concurrency control	If 50 users upload at once, you spawn 50 containers
16	Implement Redis caching — you already have the client. Cache video listings (5 min TTL), subscriber counts, and use it for view dedup	Reduce DB load
17	Add tests — start with API integration tests for the critical paths (auth, upload, like/dislike transactions). Use a test MongoDB instance	Prevent regressions
18	Refactor like/dislike into a single toggleReaction(videoId, userId, action) function to eliminate the 200-line duplication	Maintainability
19	Add video deletion, comment editing, unsubscribe routes (the subscription controller has unsubscribeFromCreator written but not wired to a route)	Feature completeness
20	Implement search — add a text index on Video.title + Video.description + Video.tags in MongoDB and build a proper search endpoint	The Results page exists but has no real backend
The architecture is fundamentally sound — presigned URLs for upload, event-driven transcoding with self-destructing containers, HLS adaptive streaming — these are the right patterns. The main gaps are around hardening (validation, error handling, auth on video URLs), reliability (no retry/monitoring for the transcoding pipeline), and scalability (pagination, caching, view dedup).