# Product And User Flows

## Product Positioning

Zylo is a travel organizer for content people already save but cannot easily use later. The core promise is:

"You save it. Zylo plans it."

The app is centered on this transformation:

saved content -> extracted places -> destination clusters -> editable trips -> itinerary-aware AI

## Primary User Problem

Users save too much travel inspiration across reels, screenshots, and text notes. The failure mode is not discovery. The failure mode is retrieval and organization.

Zylo solves for:

- finding travel content inside noisy saves
- extracting actual visitable places
- grouping them by city and destination
- mapping them spatially
- turning them into editable trips

## Current Product Surfaces

### Public Site

Goal:

- explain the concept
- establish brand taste
- convert visitors into sign-ins

Key pages:

- `/`
- `/pricing`
- `/how-it-works`
- `/security`
- `/faq`

### Signed-In App

Goal:

- provide an operational workspace for the user's saved travel world

Key pages:

- `/onboarding`
- `/dashboard`
- `/import`
- `/destinations`
- `/destinations/[id]`
- `/places`
- `/map`
- `/search`
- `/trips`
- `/ai`
- `/settings`

## Route Inventory

### Public Routes

- `/`
  - Landing page.
  - Emphasizes filtering travel reels out of noisy saves.
- `/pricing`
  - Beta pricing page.
  - Free now, paid later framing.
- `/how-it-works`
  - Expanded explanation of save -> filter -> explore.
- `/security`
  - Security posture and sample audit events.
- `/faq`
  - Answers around sync, mobile support, and scope.
- `/onboarding`
  - Public onboarding route that frames manual import as the real beta workflow.
- `/sign-in`
  - Sign in and create account entry page.
- `/forgot-password`
  - Password reset request page.
- `/update-password`
  - Password change completion page after recovery flow.

### Protected Routes

- `/dashboard`
  - Summary metrics, repeat-save radar, destination highlights.
- `/import`
  - Main import workbench for URL, text, and image-derived inputs.
- `/destinations`
  - Destination grid over the saved library snapshot.
- `/destinations/[id]`
  - Destination detail with filtered place browsing.
- `/places`
  - Card grid of places.
- `/map`
  - Visual cluster map mock plus destination cards.
- `/search`
  - Search workspace for place name, city, tag, and category lookups.
- `/trips`
  - Trip cards and day/stop breakdown.
- `/ai`
  - Chat-like AI concierge.
- `/settings`
  - Provider readiness, connection roadmap, sign out.

### Auth/Infra Routes

- `/auth/confirm`
  - Handles Supabase email confirmation and recovery link verification.
- `/api/health`
  - Health and provider availability JSON.

### API Routes

- `/api/imports`
- `/api/imports/[id]`
- `/api/profile/planner-notes`
- `/api/places/[id]/save-state`
- `/api/trips`
- `/api/trips/[id]/generate`
- `/api/ai/chat`

## Main User Journeys

## 1. Visitor To Signed-In User

1. Visitor lands on `/`.
2. Marketing site explains the value proposition.
3. User clicks `Open Zylo` or `Sign in`.
4. User either:
   - signs in, or
   - creates an account.
5. Supabase sends verification email.
6. User confirms through `/auth/confirm`.
7. Middleware now allows protected routes.
8. User reaches `/dashboard`.

Important note:

- If an unauthenticated user clicks directly into a protected route like `/dashboard`, middleware redirects to `/sign-in?next=/dashboard`.

## 2. Import Content Into Zylo

1. User opens `/import`.
2. User chooses mode:
   - URL
   - text
   - image
3. User submits content and optional destination hint.
4. Frontend sends POST to `/api/imports`.
5. Backend:
   - validates and sanitizes input
   - checks auth
   - rate-limits the request
   - writes a `source_artifacts` row
   - writes an `import_jobs` row
   - runs a multi-stage evidence pipeline
   - for reel links, tries metadata fetch, `yt-dlp`, subtitles, frame OCR, and audio transcription
   - scores whether the content looks travel-related enough to parse
   - extracts rule-based place seeds before Gemini refinement
   - verifies candidates through Nominatim first, then Google Places
   - optionally looks up a fallback Unsplash image
   - upserts destinations and places
   - updates artifact and import job status
   - appends import diagnostics
   - writes an audit event
6. UI displays resulting status text.

Important note:

- The import UI looks live and talks to the real API, and the right-side `Latest uploads` panel now reflects recent source artifacts from the user snapshot.

## 3. Browse Places

Current behavior:

- `/places` renders place cards from `lib/data.ts`.

Intended long-term behavior:

- query persisted `places` rows for the signed-in user
- support filtering, deduplication, visit state, and trip membership

Related backend support already exists:

- `/api/places/[id]/save-state` updates `is_visited` and `is_in_trip`.

## 4. Build A Trip

1. User creates or will create a trip tied to a destination.
2. Backend writes a `trips` row.
3. User or AI triggers trip generation.
4. `/api/trips/[id]/generate` checks ownership and creates at least one trip day if none exists.
5. Trip status is updated from `draft` to `ready`.

Current limitation:

- generation is a beta placeholder, not a sophisticated itinerary planner.

## 5. Ask AI Concierge

1. User opens `/ai`.
2. User sends a message.
3. Frontend POSTs to `/api/ai/chat`.
4. Backend:
   - validates payload
   - rate-limits
   - optionally loads trip context
   - loads taste profile
   - asks Gemini for a concise route-aware answer
   - writes an audit event
5. Response is rendered back into the chat UI.

Fallback behavior:

- If Gemini is unavailable, a synthetic fallback reply is returned.

## 6. Password Recovery

1. User opens `/forgot-password`.
2. User requests reset.
3. Supabase sends recovery email.
4. User clicks email link.
5. Supabase lands on `/auth/confirm?next=/update-password`.
6. `verifyOtp` completes.
7. User lands on `/update-password`.
8. User sets a new password.

## Product Promises That The Code Already Supports

- Travel-first product framing.
- Mobile responsiveness.
- Personal saved-place organization.
- Secure auth and recovery flows.
- Beta-safe provider fallback behavior.
- User-owned data boundaries.
- Manual-import-first onboarding.
- Search over saved places.
- Destination browsing routes.
- Planner note persistence on the trips surface.

## Product Promises That Are Still Mostly Narrative

- Direct Instagram sync.
- Direct TikTok sync.
- Robust screenshot upload pipeline.
- Truly live map experience.
- Sophisticated trip generation.
- Deep collaborative or shareable planning.

## Known Product Gaps To Track

- Several pages look production-ready but still render seeded data.
- Settings page reports provider configuration presence, not provider health, quota, or billing.
- Import results are reflected in the import workspace and snapshot-driven routes, but not every signed-in surface is fully live yet.
- Trip composition is still heavily demo-data-driven.

## What Success Looks Like For The Next Product Phase

The next phase should convert the app from "convincing beta shell with real backend routes" into "fully live user workspace."

That means:

1. replace seeded dashboard, places, map, and trips views with authenticated Supabase queries
2. complete image upload and OCR ingestion
3. deepen destination and search flows until they are fully live across all app surfaces
4. make trip generation actually itinerary-aware
5. add async job processing for imports
