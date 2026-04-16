# Vibes — Architecture Review & Implementation Session

> Full session log of architecture audit, redesign, and feature implementation.
> Use this as a reference for what was changed, why, and how.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Drawbacks Found](#2-drawbacks-found)
3. [Security: Zod Input Validation](#3-zod-input-validation)
4. [Security: Azure ACI Secure Env Vars](#4-aci-secure-environment-variables)
5. [FFmpeg Transcoder Improvements](#5-ffmpeg-transcoder-improvements)
6. [HLS Video Streaming Auth (SAS Tokens)](#6-hls-streaming-auth)
7. [UI/UX Full Redesign](#7-uiux-full-redesign)
8. [Bundle Size Optimization](#8-bundle-size-optimization)
9. [video.js → hls.js Migration](#9-videojs-to-hlsjs-migration)
10. [HLS Player Features](#10-hls-player-features)
11. [Redis View Count Deduplication](#11-redis-view-count-dedup)
12. [Express 5 Migration Fix](#12-express-5-migration)
13. [Checkpoint 1: Critical Bug Fixes](#13-checkpoint-1)
14. [Checkpoint 2: Rate Limiting](#14-checkpoint-2)
15. [Checkpoint 3: Search](#15-checkpoint-3)
16. [Checkpoint 4: Pagination + Infinite Scroll](#16-checkpoint-4)
17. [Checkpoint 5: Video Deletion](#17-checkpoint-5)

---

## 1. Architecture Overview

```
┌─────────────┐     SAS URL      ┌──────────────────┐
│  React SPA   │──── upload ─────▶│  Azure Blob      │
│  (Vite)      │                  │  (tempbucket)     │
│  Vercel      │                  └────────┬─────────┘
│              │                           │ Blob Trigger
│              │                  ┌────────▼─────────┐
│              │                  │  Azure Function   │
│              │                  │  (startTranscoding)
│              │                  └────────┬─────────┘
│              │                           │ Spawns ACI
│              │                  ┌────────▼─────────┐
│              │                  │  Go + FFmpeg      │
│              │                  │  Docker on ACI    │
│              │                  └────────┬─────────┘
│              │    REST API      ┌────────▼─────────┐
│              │◀──────────────▶ │  Express API      │
│              │                  │  Vercel Serverless│
└─────────────┘                  └────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                                 │  MongoDB Atlas    │
                                 │  + Aiven Valkey   │
                                 └──────────────────┘
```

**Key design: fully serverless, pay-per-use.** No always-on servers.

### Services
| Service | Tech | Deployed On |
|---------|------|-------------|
| Frontend | React 19, Vite, TailwindCSS, hls.js | Vercel (free) |
| API | Express 5, TypeScript, Mongoose 9 | Vercel Serverless (free) |
| Blob Trigger | Azure Functions (TS) | Azure (pay-per-exec) |
| Transcoder | Go, FFmpeg, Docker | Azure Container Instances (pay-per-second) |
| Database | MongoDB Atlas | Free tier |
| Cache/Queue | Aiven Valkey (Redis fork) | Free tier |

---

## 2. Drawbacks Found

### Critical
- **No input validation** — `req.body` trusted directly on all endpoints
- **Secrets in plain text** — `MONGODB_URI`, `AZURE_CLIENT_SECRET` passed as regular env vars to ACI containers
- **No authorization on videos** — transcoded video URLs publicly accessible
- **Raw error objects sent to client** — `msg: error` leaked stack traces
- **Transcoder never marks FAILED** — videos stuck in PENDING forever if FFmpeg crashes
- **View count trivially inflatable** — every GET incremented views, no dedup

### Architectural
- **No pagination** — hardcoded `.limit(30)` on video listing
- **No rate limiting** — rate limiter existed but was a no-op (`next()`)
- **Dead code** — S3 utilities, unused Redis client, old rate limiter types
- **Tight coupling** — Go transcoder writes directly to MongoDB

### Code Quality
- **No tests** anywhere
- **console.log instead of Winston** logger
- **200+ lines duplicated** between like/dislike controllers

---

## 3. Zod Input Validation

### What was done
- Installed `zod` v4 in main-server
- Created `src/validations/schemas.ts` — schemas for every endpoint
- Created `src/middlewares/validate.ts` — generic middleware
- Wired validation into all route files

### Schemas created
```typescript
signupSchema      — username (3-30 chars, alphanumeric), email, password (6-100)
signinSchema      — identifier (1-100), password (1-100)
presignedUrlSchema — videoKey, thumbnailKey, title (1-200), description (max 5000), tags (max 20)
videoIdParamSchema — params.videoId (24-char hex ObjectId)
searchQuerySchema  — query.q (1-200 chars)
postCommentSchema  — content (1-5000), optional parentCommentId
deleteCommentParamSchema — params.commentId (ObjectId)
subscribeSchema    — body.creatorId (ObjectId), optional isNotificationsEnabled
unsubscribeSchema  — body.creatorId (ObjectId)
logsParamSchema    — params.videoId (ObjectId)
```

### Validation middleware pattern
```typescript
// Route file
videoRouter.post('/presignedurl', validateAuth, validate(presignedUrlSchema), preSignedUrl);

// Middleware parses req.body, req.params, req.query against schema
// Returns 400 with { errors: [{ path, message }] } on failure
```

### Error response sanitization
All `msg: error` (raw error objects) → replaced with static strings like `"Failed to create signed URL"`.

---

## 4. ACI Secure Environment Variables

### Problem
`MONGODB_URI` and `AZURE_CLIENT_SECRET` were passed as plain `environmentVariables` to Azure Container Instances. Anyone with Azure portal access or container logs could see them.

### Fix (TempBlobTriggerApp/src/functions/startTranscoding.ts)
Changed `value` → `secureValue` for sensitive env vars:
```typescript
{ name: 'MONGODB_URI', secureValue: process.env.MONGODB_URI ?? '' },
{ name: 'AZURE_CLIENT_SECRET', secureValue: process.env.AZURE_CLIENT_SECRET ?? '' },
```
`secureValue` is encrypted at rest and never exposed in Azure portal, API responses, or logs. The container process still reads them as normal env vars.

---

## 5. FFmpeg Transcoder Improvements

### Previous issues
- Hardcoded 1920x1080, 1280x720, 854x480 — force-stretched portrait videos
- Target bitrate mode (`-b:v`) — output sometimes LARGER than input
- Always transcoded to all 3 rungs — 480p input upscaled to 1080p
- `-preset veryfast` — poor compression efficiency

### New approach (transcoder/transcoder.go)

**CRF + maxrate** (replaces fixed bitrate):
```
-crf:v:0 23 -maxrate:v:0 4500k -bufsize:v:0 9000k
```
- CRF = quality target (FFmpeg decides bitrate per frame)
- maxrate = ceiling (prevents bandwidth spikes)
- Simple scenes → small files. Complex scenes → capped at maxrate.

**Bitrate capped to input**: if input is 1200 kbps, maxrate for 1080p capped to 1200k. Output never larger than input.

**Adaptive ladder**: skips rungs above source resolution (720p input → only 720p + 480p encoded, no upscaling).

**Aspect ratio preservation**:
```
scale=w=-2:h=720:force_original_aspect_ratio=decrease
```
No padding. Player handles letterboxing.

**Portrait detection**: swaps width/height in scale filter for 9:16 content.

**Preset `fast`** instead of `veryfast`: ~20% better compression within 1 CPU / 1 GB RAM constraint.

### Failure handling (main.go)
`transcode()` now returns `bool`. On `false`, main.go connects to MongoDB and sets `status: "FAILED"` + saves logs before the container self-destructs.

---

## 6. HLS Streaming Auth

### Problem
HLS uses relative URLs inside .m3u8 playlists. Standard URL resolution strips query params — so appending a SAS token to master.m3u8 doesn't propagate to segment fetches.

### Solution
Return SAS token separately from the API. Frontend appends it to every HLS sub-request.

**Backend** (makePresignedUrl.ts):
```typescript
export const getStreamingSasToken = (containerName: string): string => {
  // Container-level SAS, read-only, 4-hour expiry
  // No blobName = works for any blob in the container
};
```

**Frontend** (HlsPlayer.tsx):
```typescript
hlsConfig.xhrSetup = (xhr, url) => {
  const sep = url.includes("?") ? "&" : "?";
  xhr.open("GET", `${url}${sep}${videoData.videoSasToken}`, true);
};
```

### Why container-level (not blob-level)
Azure Blob SAS has only 2 scopes: container or exact-blob. HLS needs access to master.m3u8 + variant playlists + hundreds of .ts segments. Wildcard/prefix SAS doesn't exist on standard storage accounts.

---

## 7. UI/UX Full Redesign

### Design system
- 8px spacing grid, generous padding
- Theme-aware (removed all hardcoded `bg-gray-800`, `text-white`)
- Typography: `text-2xl font-semibold` titles, `text-sm` labels, `text-xs text-muted-foreground` metadata
- `rounded-xl` cards, `rounded-lg` inputs, `rounded-full` pills/avatars
- Subtle borders, no heavy shadows

### Files changed

| File | Before | After |
|------|--------|-------|
| App.css | Vite template leftovers | Cleaned |
| index.css | Hardcoded scrollbar colors | Theme-aware, antialiased |
| App.tsx | Hardcoded dark colors | Theme system, max-w container, styled Toaster, spinner fallback |
| NavBar | Basic links, separate search page | Sticky glassmorphism header, integrated search, ghost buttons |
| Videos | flex-wrap, no loading state | Responsive grid (1→4 cols), skeleton loading, empty state, hover zoom |
| Video | `px-56` hardcoded, cramped | Responsive flex layout, rounded player, skeleton loading |
| VideoInfo | `bg-gray-800` hardcoded | YouTube-style like/dislike pill, theme-aware description card |
| Comments | Messy spacing | Expandable textarea, proper comment thread, empty state |
| Signin/Signup | Card with shadow | Clean centered form, full-width button |
| VideoUpload | Cramped w-96 card | Full-width form, drag-drop file zones |
| Home | Just text + button | Hero section with badge, headline, dual CTAs |
| Results | Raw text | Search results with horizontal cards |
| NotFound | "There's nothing here!" | Large 404, heading, back button |

---

## 8. Bundle Size Optimization

### Packages removed from client (5 total)
| Package | Size | Replacement |
|---------|------|-------------|
| `@azure/storage-blob` | ~340KB bundled | 30-line `fetch` PUT (SAS URL = anonymous auth) |
| `@azure/identity` | unused on client | removed |
| `@emoji-mart/data` | ~518KB | 15 inline emoji characters |
| `@emoji-mart/react` | part of above | removed |
| `emoji-mart` | part of above | removed |
| `video.js` | ~695KB | `hls.js` (~180KB) |

### Before → After
| Chunk | Before | After |
|-------|--------|-------|
| Video page | 1,228 KB | 30 KB |
| VideoUpload | 344 KB | 6.4 KB |
| Emoji | 518 KB | 0 KB |
| video.js vendor | 695 KB | 0 KB (replaced by hls.js) |
| hls.js vendor | — | 522 KB (isolated, cached) |

### Vite config
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        "vendor-hls": ["hls.js"],
      },
    },
  },
},
```

### Why Azure SDK removal is safe
For files under 256MB, `BlockBlobClient.uploadData()` does a single PUT — identical to `fetch`. Chunking/parallel only kicks in above 256MB. Upload limit is 50MB.

---

## 9. video.js → hls.js Migration

### Why
video.js (695KB) = full player framework (skins, plugins, ads, VR, subtitles). Only used for HLS playback. hls.js (180KB) = just HLS parsing + adaptive streaming, uses native `<video>` controls.

### What video.js offered that we don't need
- Custom skinnable UI (using default skin)
- Plugin ecosystem (ads, VR — not used)
- Flash fallback (Flash is dead)
- DRM (not used)

---

## 10. HLS Player Features

### Built in HlsPlayer.tsx

| Feature | Key | Behavior |
|---------|-----|----------|
| Seek | ← → | -5s / +5s |
| Volume | ↑ ↓ | +10% / -10% |
| Mute | M | Toggle |
| Speed | S / D | 0.25x → 4x steps |
| Theater mode | T | Expands player, collapses sidebar |
| Play/pause | Space | Toggle |
| Fullscreen | F | Browser fullscreen |
| Quality selector | Gear icon | Auto / 1080p / 720p / 480p |

### ABR (Adaptive Bitrate)
```typescript
abrEwmaFastLive: 3,
abrEwmaSlowLive: 9,
abrBandWidthFactor: 0.8,
abrBandWidthUpFactor: 0.7,
```

### Buffer-aware switching (YouTube-style)
```typescript
if (buffer < 5) hls.nextLevel = 0;      // emergency drop to lowest
if (buffer > 25) hls.nextLevel = -1;    // let ABR upgrade
```

### Client-aware config
```typescript
// Low-end devices (≤2GB RAM, 2G/3G)
{ maxBufferLength: 10, maxBufferSize: 20MB, capLevelToPlayerSize: true }
// High-end
{ maxBufferLength: 30, maxBufferSize: 60MB }
```

### Error recovery
- Network error → `hls.startLoad()` (retry)
- Media error → `hls.recoverMediaError()`
- Fatal → `hls.destroy()`

---

## 11. Redis View Count Dedup

### Design
```
User opens /video/:id
  → recordView(videoId, userId)
  → Redis: SET view:{videoId}:{userId} "1" NX EX 86400
  → NX = set only if not exists
  → EX 86400 = expires in 24 hours
  → Returns 1 (new) → $inc views in MongoDB
  → Returns 0 (dup) → skip increment
```

### Lua script (atomic)
```lua
local result = redis.call("SET", key, "1", "NX", "EX", ttl)
if result then return 1 end
return 0
```

### Fail-open
If Redis is down, `recordView()` returns `true` — views still count. Slightly inflated views > broken video pages.

---

## 12. Express 5 Migration

### Breaking change
Express 5 uses `path-to-regexp` v8 which rejects bare `*` wildcard. `app.options('*', cors(...))` crashed on startup.

### Fix
Removed the redundant `app.options('*')` handler. `app.use(cors(...))` already handles preflight OPTIONS for all routes. The removed handler also had a narrower origin list (only localhost) which would have broken production preflight.

### Mongoose 9 compatibility
- `{ new: true }` → `{ returnDocument: "after" }` (deprecated option)
- `FilterQuery<T>` removed — used `as any` for query filters
- `user.id` → `user._id` (`.id` not on Document type in v9)
- `req.userId` type changed from `Schema.Types.ObjectId` to `string` (JWT returns string)

### TypeScript 6
- `baseUrl` in tsconfig deprecated — removed (paths work without it)

---

## 13. Checkpoint 1: Critical Bug Fixes

### Transcoder FAILED status
- `transcode()` returns `bool` now
- `main.go` checks return: on `false`, updates MongoDB to `status: "FAILED"`, saves logs

### Unsubscribe route wired
- `DELETE /api/subscription` → `validateAuth` → `validateInput(unsubscribeSchema)` → `unsubscribeFromCreator`
- Controller + schema already existed, just wasn't mapped in routes

### SAS token re-enabled
- Uncommented `xhrSetup` in HlsPlayer that appends SAS token to every HLS sub-request

---

## 14. Checkpoint 2: Rate Limiting

### Algorithm: Sliding Window (Redis sorted sets)
Better than token bucket for abuse prevention (no burst exploitation, intuitive "X per Y" semantics).

### Lua script (atomic)
```lua
ZREMRANGEBYSCORE key 0 (now - window)  -- prune old entries
ZCARD key                               -- count remaining
if count >= max then return 0           -- reject
ZADD key now (unique-id)                -- add this request
PEXPIRE key window                      -- auto-cleanup idle keys
return 1                                -- allow
```

### Rate limits applied
| Route | Key | Window | Max |
|-------|-----|--------|-----|
| `/signin` | `IP + body.identifier` | 15 min | 10 |
| `/signup` | `IP` only | 1 hour | 5 |
| `/presignedurl` | `IP + userId` | 1 hour | 10 |
| `/like`, `/dislike` | `IP + userId` | 1 min | 30 |

### Why IP + identifier for signin
Shared WiFi (college, 300 users) — IP-only would block the 11th person. `IP + identifier` means each user gets their own 10 attempts.

### Fail-open
If Redis is down, requests pass through.

---

## 15. Checkpoint 3: Search + E2E Fixes

### MongoDB text index
```javascript
videoSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, description: 3, tags: 5 } }
);
```

### Search endpoint
`GET /api/video/search?q=cooking` — returns relevance-ranked results using `$text` search with `textScore` sorting.

### E2E audit fixes
- **Comment Delete**: wired `onClick` handler to call `DELETE /api/comments/:commentId`
- **Subscribe/Unsubscribe**: replaced `alert()` with actual API calls, toggle button state, subscriber count
- **Types**: `creatorId` → `userId` (matches backend), added `FAILED` to status union
- **FAILED display**: shows "Transcoding failed" instead of formatting null date
- **Mongoose warning**: `{ new: true }` → `{ returnDocument: "after" }`

---

## 16. Checkpoint 4: Pagination + Infinite Scroll

### Cursor-based pagination (backend)
All list endpoints now accept `?cursor=<lastId>&limit=20`:
```typescript
const filter = cursor ? { _id: { $lt: cursor } } : {};
const items = await Model.find(filter).sort({ _id: -1 }).limit(limit + 1);
const hasMore = items.length > limit;
if (hasMore) items.pop();
return { items, nextCursor: hasMore ? items[items.length - 1]._id : null };
```

### Why cursor over offset
- Offset: `skip(40)` scans 40 docs. Gets slower with depth.
- Cursor: `{ _id: { $lt: lastId } }` uses index. O(1) at any depth. No dups when new content is added.

### Infinite scroll (frontend)
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryFn: ({ pageParam }) => fetch(`/api/video?cursor=${pageParam}`),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// IntersectionObserver on sentinel div
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
  });
  observer.observe(sentinelRef.current);
}, [hasNextPage]);
```

Applied to: Videos (home), Results (search), Comments.

---

## 17. Checkpoint 5: Video Deletion

### Backend: `DELETE /api/video/:videoId`
1. **Ownership check**: `video.userId.toString() !== req.userId` → 403
2. **Azure Blob cleanup** (best-effort):
   - Delete thumbnail from `thumbnail` container
   - List + delete all blobs under video's folder prefix in `finalbucket`
   - Wrapped in try/catch — DB cleanup continues even if blob deletion fails
3. **MongoDB cascade**: `Promise.all([deleteMany likes, comments, logs, video])`

### Frontend
- Delete button (Trash2 icon) only visible when `creatorName === loggedInUsername`
- `confirm()` dialog before deletion
- On success: toast + redirect to home

---

## Architecture Decisions Log

| Decision | Why |
|----------|-----|
| Keep serverless (no Redis queue worker) | Personal project, low traffic. Worker = always-on server = cost. Azure Function trigger is already pay-per-use. |
| Container-level SAS (not blob-level) | HLS needs access to hundreds of blobs. Azure doesn't support wildcard SAS on standard storage. |
| Sliding window rate limiting (not token bucket) | Abuse prevention doesn't need burst allowance. "10 per 15 min" is exact and intuitive. |
| Cursor pagination (not offset) | O(1) at any depth, no duplicates when new content is inserted. |
| hls.js (not video.js) | 515KB smaller. video.js's extras (skins, plugins, ads) unused. Keyboard shortcuts need custom code either way. |
| `fetch` PUT (not Azure SDK) | Azure SDK = 340KB for a single PUT call. Under 256MB, behavior is identical. |
| Fail-open on Redis errors | Slightly inflated views/slightly looser rate limits > completely broken endpoints. |
| 15 inline emojis (not emoji-mart) | 518KB saved. Covers 90% of use cases. OS emoji picker handles the rest. |
