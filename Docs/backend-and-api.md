# Backend And API

## Backend Summary

Zylo's backend is implemented inside the Next.js app using:

- App Router route handlers for JSON APIs
- server actions for auth/sign-out flows
- Supabase SSR client for session-aware database work
- service-role admin client for audit insertion

This is a single application backend, not a separate API server.

## Shared Backend Building Blocks

### Auth

File:

- `lib/auth.ts`

Functions:

- `getOptionalUser()`
- `requirePageUser()`
- `requireApiUser()`

Purpose:

- safely read current session user
- block page access when needed
- make route handlers session-aware

### Validation

File:

- `lib/validation.ts`

Purpose:

- define input contracts
- sanitize plain text
- reject unsafe URLs
- normalize email
- enforce strong password rules

Main schemas:

- `importSchema`
- `saveStateSchema`
- `tripSchema`
- `tripGenerateSchema`
- `chatSchema`
- `authSignInSchema`
- `authSignUpSchema`
- `passwordResetRequestSchema`
- `passwordUpdateSchema`

### Security Utilities

File:

- `lib/security.ts`

Purpose:

- in-memory rate limiting
- plain text sanitization
- private-network URL rejection
- ownership comparison helper

Important limitation:

- rate limiting is memory-based and not shared across instances

### Request Utilities

File:

- `lib/request.ts`

Purpose:

- extract client IP
- determine app base URL
- prevent unsafe redirect paths
- mask email addresses in logs

### Import Analysis And Pipeline

Files:

- `lib/import-analysis.ts`
- `lib/import-pipeline.ts`
- `lib/url-metadata.ts`
- `lib/import-logger.ts`

Purpose:

- normalize raw import evidence
- score whether content looks travel-related
- extract rule-based place seeds before or alongside Gemini
- orchestrate URL metadata, subtitles, OCR, transcription, and geocoding stages
- append JSONL import diagnostics to `logs/imports.jsonl`

### Audit Logging

File:

- `lib/audit.ts`

Purpose:

- insert non-blocking audit rows into `audit_events`

Behavior:

- if the admin client is unavailable, the app keeps working

## Server Actions

### `app/(app)/actions.ts`

- `signOutAction()`
- signs out the current user
- records an auth audit event
- redirects to `/sign-in?message=Signed out.`

### `app/sign-in/actions.ts`

- `signInAction()`
- `signUpAction()`

Capabilities:

- validate input
- rate-limit by IP and email
- call Supabase Auth server-side
- record auth/security audits
- redirect to correct page

Important note:

- the UI currently does not use these server actions as its main auth path; it uses client-side Supabase calls in `components/auth/sign-in-panels.tsx`

### `app/forgot-password/actions.ts`

- `requestPasswordResetAction()`
- validates email
- rate-limits
- calls `supabase.auth.resetPasswordForEmail`

### `app/update-password/actions.ts`

- `updatePasswordAction()`
- validates password strength
- rate-limits
- checks recovery session user
- updates password

## API Routes

## `GET /api/health`

File:

- `app/api/health/route.ts`

Returns:

- app status
- service name
- timestamp
- provider availability summary

Purpose:

- lightweight health check for environments

## `POST /api/imports`

File:

- `app/api/imports/route.ts`

Purpose:

- create and process an import request

Input:

- `type`: `url | text | image`
- `content`: string
- `destinationHint`: optional string

Flow:

1. require authenticated user
2. validate payload
3. apply rate limit
4. ensure user profile and taste profile exist
5. insert `source_artifacts` row
6. insert `import_jobs` row
7. run `runImportPipeline()`
8. optionally relabel URL imports from fetched page metadata
9. if no candidates are found, mark the artifact/job failed and return a friendly `422`
10. optionally fetch an Unsplash fallback image
11. upsert destination rows
12. upsert place rows
13. update artifact/import job status
14. append import diagnostics
15. record audit event
16. return JSON preview data

Returned JSON includes:

- job metadata
- import job metadata
- status URL
- provider status
- extraction preview
- enrichment preview
- image preview
- analysis preview with travel scoring, diagnostics, and stage status

Important behavior:

- this route performs the whole processing flow inline
- there is no queue worker yet
- `runtime = "nodejs"` is required because the route depends on Node-side tooling
- total pipeline failure returns `503`
- valid-but-non-actionable imports return `422`

### Import Pipeline Stage Details

Main file:

- `lib/import-pipeline.ts`

Supported input types:

- `url`
- `text`
- `image`

The import route is no longer a single "send content to Gemini" flow. It uses layered evidence collection so reel links can still yield place candidates even when one source fails.

#### URL imports currently attempt these reel parsing methods

1. `fetchUrlMetadata()`
   - fetches public HTML with a browser-like user agent and timeout
   - extracts `title`, `og:title`, `description`, and `og:description`
2. `safeYtDlpJson()`
   - attempts `yt-dlp` JSON metadata without downloading the video
3. `downloadSubtitles()`
   - downloads auto or authored subtitles when available
   - normalizes subtitle text with `subtitleToPlainText()`
4. `downloadVideo()`
   - downloads a temporary local video when possible
5. `extractFrames()`
   - uses `ffmpeg` to sample frames
6. `performOcr()`
   - runs OCR through `tesseract.js` on sampled frames
7. `extractAudio()`
   - uses `ffmpeg` to extract mono audio
8. `tryLocalWhisperTranscript()`
   - attempts transcription through `scripts/transcribe_audio.py`
   - prefers `.venv/bin/python` when available

#### Evidence analysis

`lib/import-analysis.ts` currently provides:

- `normalizeImportedEvidenceText()`
- `subtitleToPlainText()`
- `buildCombinedEvidenceText()`
- `scoreTravelEvidence()`
- `extractRuleBasedPlaceSeeds()`

Important behavior:

- positive and negative travel signals are scored before persistence
- hashtags are normalized instead of dropped
- rule-based seed extraction tries to recover place names from mixed evidence
- Gemini refinement is additive, not the only parser

#### Candidate verification order

For each merged candidate seed, the pipeline currently tries:

1. `lookupPlaceSummaryFree()` in `lib/providers/nominatim.ts`
2. `lookupPlaceSummary()` in `lib/providers/google-places.ts`
3. Gemini-only fallback when the candidate still has enough city/country context

Important behavior:

- generic location-only matches are rejected
- free geocoding is attempted before paid Google lookup
- Gemini refinement failure is non-fatal and is recorded in diagnostics

#### Pipeline result shape

`runImportPipeline()` returns:

- `candidates`
- `combinedText`
- `diagnostics`
- `failureReason`
- `score`
- `evidencePreview`
- `stages`

The `stages` object currently tracks:

- `metadata`
- `ytDlp`
- `subtitles`
- `download`
- `frames`
- `ocr`
- `transcript`
- `geocoding`
- `geminiRefinement`

## `GET /api/imports/[id]`

File:

- `app/api/imports/[id]/route.ts`

Purpose:

- fetch a single import artifact and its associated import job

Checks:

- auth required
- user ownership enforced via query filters

## `POST /api/profile/planner-notes`

File:

- `app/api/profile/planner-notes/route.ts`

Purpose:

- persist planner notes into `profiles.planner_notes`

Input:

- `notes`

Checks:

- auth required
- validation required
- notes capped at 4,000 characters

Important behavior:

- returns `409` when the `planner_notes` migration has not been applied yet

## `POST /api/places/[id]/save-state`

File:

- `app/api/places/[id]/save-state/route.ts`

Purpose:

- update `is_visited`
- update `is_in_trip`

Input:

- optional booleans `isVisited` and `isInTrip`

Checks:

- auth required
- validation required
- rate limit required
- ownership enforced by filtered update

## `POST /api/trips`

File:

- `app/api/trips/route.ts`

Purpose:

- create a new trip row

Input:

- `destinationId`
- `title`
- `vibe`
- `travelers`

Checks:

- auth required
- validation required
- destination must belong to current user

## `POST /api/trips/[id]/generate`

File:

- `app/api/trips/[id]/generate/route.ts`

Purpose:

- basic beta itinerary generation

Current behavior:

- ensure the trip exists and belongs to the user
- if no `trip_days` exist, insert one stub day
- update trip status to `ready`
- record audit event

This is not a full AI planner yet.

## `POST /api/ai/chat`

File:

- `app/api/ai/chat/route.ts`

Purpose:

- respond as the Zylo concierge

Input:

- `message`
- optional `tripId`
- optional `imageHint`

Flow:

1. auth check
2. validation
3. rate limit
4. optional trip fetch
5. taste profile fetch
6. Gemini request
7. audit logging
8. fallback response if needed

## Provider Layer

### Gemini

File:

- `lib/providers/gemini.ts`

Functions:

- `extractPlacesWithGemini()`
- `askGemini()`

Behavior:

- uses `gemini-2.0-flash`
- asks for JSON responses
- returns empty arrays or `null` on failure
- is now one stage inside the import pipeline, not the only extraction path

### Google Places

File:

- `lib/providers/google-places.ts`

Function:

- `lookupPlaceSummary()`

Behavior:

- uses `places:searchText`
- returns one place summary
- silently returns `null` on failure

### Nominatim

File:

- `lib/providers/nominatim.ts`

Function:

- `lookupPlaceSummaryFree()`

Behavior:

- uses public Nominatim search
- throttles requests to stay polite to the free service
- returns OpenStreetMap URL data when a match is usable
- is preferred before Google Places in candidate verification

### Unsplash

File:

- `lib/providers/unsplash.ts`

Function:

- `searchUnsplashImage()`

Behavior:

- searches for one landscape result
- returns photographer and attribution metadata when available

## Database Helper Layer

File:

- `lib/database.ts`

Functions:

- `ensureProfileForUser()`
- `upsertDestination()`
- `upsertPlace()`

Important behavior:

- `ensureProfileForUser()` seeds a profile and taste profile if missing
- `upsertDestination()` deduplicates by `user_id + name + country`
- `upsertPlace()` deduplicates by `user_id + name + city + country`
- existing places increment `times_seen` and `source_count`

## Important Backend Caveats

- Import processing should eventually move to async workers.
- Rate limiting should eventually move to a shared store like Redis or database-backed counters.
- Provider errors are intentionally swallowed into graceful fallback behavior, so you need logs and health checks to know when enrichment silently degraded.
- The new reel parsing flow depends on Node-side binaries and local runtime capabilities like `yt-dlp`, `ffmpeg`, OCR, and optional Whisper transcription. Not every deployment target will support every stage equally well.
- The signed-in UI does not yet fully query the data written by these routes.
