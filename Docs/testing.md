# Testing

## Current Test Stack

- Vitest for unit tests
- Playwright for end-to-end smoke testing
- Testing Library setup through `@testing-library/jest-dom`

## Commands

```bash
npm run test
npm run test:e2e
```

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

## What The Current Tests Do Well

- verify the most reusable validation and security helpers
- verify the provider-status reporting logic
- ensure the public homepage still renders key brand copy

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

- `/api/imports`
- `/api/imports/[id]`
- `/api/places/[id]/save-state`
- `/api/trips`
- `/api/trips/[id]/generate`
- `/api/ai/chat`

These are the most important missing tests because they gate the live product behavior.

### Provider integrations

Missing tests:

- Gemini extraction prompt formatting
- Gemini chat fallback behavior
- Google Places enrichment parsing
- Unsplash image response parsing

### Database helpers

Missing tests:

- profile creation fallback behavior
- destination upsert deduplication
- place upsert deduplication and count increment logic

### UI behavior

Missing tests:

- theme toggle persistence
- import form success and failure states
- AI concierge request lifecycle
- mobile nav rendering

## Recommended Test Expansion Order

1. route handler tests for all API endpoints
2. middleware tests
3. auth integration tests
4. database helper tests
5. richer Playwright flows for signed-in usage

## Recommended Playwright Scenarios

Add flows for:

- anonymous user redirected from `/dashboard` to `/sign-in`
- sign-in page renders and can navigate to password reset
- import submission shows success or failure state
- AI concierge submits a prompt and renders a reply
- settings screen renders provider status cards

## Recommended Mock Strategy

For unit and integration tests, mock:

- Supabase client methods
- Gemini fetch calls
- Google Places fetch calls
- Unsplash fetch calls
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

