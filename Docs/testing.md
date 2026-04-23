# Testing

## Current Test Stack

- Vitest for unit tests
- Playwright for end-to-end smoke testing
- Testing Library setup through `@testing-library/jest-dom`

## Commands

```bash
npm run dev
npm run test
npm run test:e2e
```

`npm run dev` now keeps Zylo on `http://127.0.0.1:3000`.
If port `3000` is already serving this app, the command exits cleanly and reuses it.
If another process owns `3000`, the command fails fast instead of silently drifting to another port.

## Current Automated Coverage

### Validation Tests

File:

- `tests/validation.test.ts`

Covers:

- valid import payload accepted
- too-short import content rejected
- localhost/private URL import rejected
- weak password rejected
- strong password accepted

### Provider Status Tests

File:

- `tests/provider-status.test.ts`

Covers:

- provider status becomes `configured` when env values are present
- provider status becomes `missing` when env values are absent

### Security Utility Tests

File:

- `tests/security.test.ts`

Covers:

- rate limit blocks after configured threshold
- ownership helper returns expected booleans

### E2E Smoke Test

File:

- `tests/e2e/home.spec.ts`

Covers:

- homepage renders core brand heading and supporting copy

### Import Analysis Tests

File:

- `tests/import-analysis.test.ts`

Covers:

- subtitle cleanup and timing removal
- travel-signal scoring
- non-travel penalty scoring
- hashtag normalization preserving travel meaning
- rule-based place seed extraction

### Import Pipeline Tests

File:

- `tests/import-pipeline.test.ts`

Covers:

- text import analysis using free parsing plus geocoding
- URL pipeline stage execution across metadata, `yt-dlp`, subtitles, OCR, and transcription
- Gemini refinement failure as a non-fatal condition
- stage-status reporting

### Imports Route Tests

File:

- `tests/api-imports-route.test.ts`

Covers:

- auth requirement
- validation rejection
- rate-limit rejection
- delegation into the import processing service

### Import Processing Service Tests

File:

- `tests/import-processing.test.ts`

Covers:

- successful import processing and preview response shaping
- `422` response for non-actionable imports
- `503` response when analysis crashes
- `500` response when artifact creation fails
- `500` response when persistence fails

### Database Helper Tests

File:

- `tests/database.test.ts`

Covers:

- profile fallback seed resolution
- destination insert payload generation
- place insert/update payload generation
- profile/taste upserts
- destination deduplication
- place deduplication and counter increments

### Planner Notes Tests

Files:

- `tests/planner-notes.test.ts`
- `tests/api-profile-planner-notes-route.test.ts`

Covers:

- newline normalization
- migration-conflict and generic failure handling
- route auth and validation behavior
- route delegation into the planner-notes service

### Place Save-State Tests

Files:

- `tests/place-save-state.test.ts`
- `tests/api-place-save-state-route.test.ts`

Covers:

- selective update payload generation
- not-found handling
- audit logging on success
- route auth/rate-limit behavior
- route delegation into the place save-state service

### Trip Creation Tests

Files:

- `tests/trip-creation.test.ts`
- `tests/api-trips-route.test.ts`

Covers:

- owned-destination trip creation
- missing-destination and insert-failure branches
- route auth/rate-limit behavior
- route delegation into the trip-creation service

### Nominatim Provider Tests

File:

- `tests/nominatim.test.ts`

Covers:

- mapping of free Nominatim results into the app's place-summary shape
- rejection of unusable location-only results

### Import Workbench UI Tests

Files:

- `tests/import-workbench.test.tsx`
- `tests/e2e/import-workbench.spec.ts`

Covers:

- input mode switching
- success and error UI states
- mocked browser flow for import submission

### Settings Panel Tests

File:

- `tests/settings-panel.test.tsx`

Covers:

- account and provider rendering without import history

## What The Current Tests Do Well

- verify the most reusable validation and security helpers
- verify the provider-status reporting logic
- ensure the public homepage still renders key brand copy
- exercise the import analysis helpers directly
- cover the inline import route and multi-stage import pipeline
- isolate the import-processing service from the route layer
- isolate planner notes, place save-state, and trip creation into service modules
- verify the free Nominatim fallback path
- test core import workbench UI behavior

## What Is Not Yet Well Covered

### Auth flows

Missing tests:

- sign in happy path
- sign up happy path
- verification failure behavior
- password reset request flow
- password update flow
- redirect rules for authenticated vs unauthenticated users

### Middleware behavior

Missing tests:

- protected route redirect
- auth-page redirect for signed-in users
- security header presence
- API `Cache-Control: no-store`

### API routes

Missing tests:

- `/api/imports/[id]`
- `/api/profile/planner-notes`
- `/api/places/[id]/save-state`
- `/api/trips`
- `/api/trips/[id]/generate`
- `/api/ai/chat`

The highest-value remaining API tests are now trip, save-state, AI chat, and planner-notes coverage.

### Provider integrations

Missing tests:

- URL metadata parsing edge cases
- Gemini chat fallback behavior
- Google Places enrichment parsing
- Unsplash image response parsing
- import logger file-write behavior

### Database helpers

Missing tests:

- profile creation fallback behavior
- destination upsert deduplication
- place upsert deduplication and count increment logic

### UI behavior

Missing tests:

- theme toggle persistence
- AI concierge request lifecycle
- mobile nav rendering
- search workspace behavior
- destination detail filtering and sorting
- planner notes save states in trips board

## Recommended Test Expansion Order

1. route handler tests for remaining uncovered APIs
2. database helper tests
3. middleware tests
4. auth integration tests
5. richer Playwright flows for signed-in usage

## Recommended Playwright Scenarios

Add flows for:

- anonymous user redirected from `/dashboard` to `/sign-in`
- sign-in page renders and can navigate to password reset
- AI concierge submits a prompt and renders a reply
- settings screen renders provider status cards
- destination browsing and search
- planner notes save flow

## Recommended Mock Strategy

For unit and integration tests, mock:

- Supabase client methods
- Gemini fetch calls
- URL metadata fetch calls
- Google Places fetch calls
- Nominatim fetch calls
- Unsplash fetch calls
- `yt-dlp` and `ffmpeg` subprocess behavior
- time-dependent rate-limiting windows if necessary

Keep tests deterministic. The provider helpers already support soft failure behavior, so test both:

- provider returns useful data
- provider returns `null` or empty arrays

## CI Recommendation

If adding CI, run:

1. `npm run test`
2. `npm run build`
3. `npm run test:e2e` against a preview environment or local bootstrapped server

That sequence catches:

- contract regressions
- type/build failures
- basic UI breakage
