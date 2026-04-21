# Setup And Environment

## Scope Note

This file documents the environment model for the current `Next.js + Supabase` repository.

If you are implementing the original `Wandr/Base44` brief, also read:

- `wandr-base44-product-brief.md`
- `wandr-base44-data-and-actions.md`

## Local Development Stack

- Node.js
- npm
- Next.js 15
- Supabase project
- Optional third-party provider accounts:
  - Gemini
  - Google Maps / Places
  - Unsplash
  - Resend

## Install And Run

```bash
npm install
npm run dev
```

Then open:

- `http://127.0.0.1:3000`

Useful scripts:

```bash
npm run build
npm run start
npm run test
npm run test:e2e
```

## Environment Variables

The repo documents expected keys in `.env.example`.

```env
NEXT_PUBLIC_APP_URL=
GEMINI_API_KEY=
GOOGLE_MAPS_API_KEY=
UNSPLASH_ACCESS_KEY=
UNSPLASH_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Original Wandr/Base44 Environment Contract

The original brief requires only three secrets for Phase 1:

```env
GEMINI_API_KEY=
GOOGLE_PLACES_API_KEY=
UNSPLASH_ACCESS_KEY=
```

Important mismatch:

- original brief uses `GOOGLE_PLACES_API_KEY`
- current repo uses `GOOGLE_MAPS_API_KEY`

If someone is porting the repo toward the original brief, this env-name difference needs to be resolved deliberately rather than guessed.

## Variable Meanings

### `NEXT_PUBLIC_APP_URL`

- Canonical app URL used in auth redirects.
- Strongly recommended in every non-local deployment.

### `GEMINI_API_KEY`

- Used by `lib/providers/gemini.ts`.
- Powers:
  - place extraction from imports
  - AI concierge responses

### `GOOGLE_MAPS_API_KEY`

- Used by `lib/providers/google-places.ts`.
- Powers:
  - place address enrichment
  - latitude/longitude lookup
  - Google Maps URL enrichment

### `UNSPLASH_ACCESS_KEY`

- Used by `lib/providers/unsplash.ts`.
- Powers fallback image search.

### `UNSPLASH_SECRET_KEY`

- Tracked as part of provider completeness in `getProviderStatus()`.
- Not directly used in the current Unsplash fetch helper, but expected as part of a complete provider setup.

### `NEXT_PUBLIC_SUPABASE_URL`

- Required for browser and server SSR clients.

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

- Preferred public key for Supabase browser/server auth.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- Legacy fallback if the publishable key is not set.

### `SUPABASE_SERVICE_ROLE_KEY`

- Server-only.
- Used by `lib/supabase/admin.ts`.
- Needed for audit logging inserts that bypass user-scoped RLS constraints where appropriate.

### `RESEND_API_KEY`

- Present for future transactional email workflows.
- Not the main auth email channel today.

## Supabase Setup Checklist

1. Create a Supabase project.
2. Copy:
   - project URL
   - publishable key
   - service-role key
3. Fill `.env.local`.
4. Apply `db/migrations/001_zylo_public_beta.sql`.
5. Configure Supabase Auth:
   - enable confirm email
   - set site URL
   - allow redirect URLs for:
     - `/auth/confirm`
     - `/dashboard`
     - `/update-password`
6. Keep Auth CAPTCHA disabled unless you also implement token capture in the frontend.

## How Environment Resolution Works

File:

- `lib/env.ts`

Rules:

- Public Supabase key:
  - prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Public browser-safe env values are exposed through `getPublicEnv()`.
- Server-only keys are exposed through `getServerEnv()`.
- Empty strings are normalized to `undefined`.

## Provider Availability Rules

File:

- `lib/provider-status.ts`

Status is derived from env presence only.

This means `configured` does not guarantee:

- billing is active
- quota is available
- the upstream API is healthy
- credentials have the right scopes

## Auth Redirect Logic

File:

- `lib/request.ts`

The app chooses the base URL in this order:

1. `NEXT_PUBLIC_APP_URL`
2. `APP_BASE_URL`
3. `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`
4. request host/protocol headers
5. fallback `http://127.0.0.1:3000`

If auth redirects fail in a deployment, check this first.

## Local Development Recommendations

### Minimum viable local config

If you only want the app to render:

- Supabase values are the most important.

If you want import and AI flows to feel real:

- add Gemini
- add Google Places
- add Unsplash

### Safe defaults

- Run over localhost with `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000` for predictable redirect behavior.
- Keep test data isolated to a dedicated Supabase project.

## Deployment Notes

- `vercel.json` declares the project as `nextjs`.
- Middleware sets strict security headers.
- API responses are marked `no-store`.
- All secret credentials must remain server-only.

## Common Failure Modes

### "Supabase public environment variables are missing."

Cause:

- missing `NEXT_PUBLIC_SUPABASE_URL`
- missing publishable/anon key

### Sign-up fails with CAPTCHA-related errors

Cause:

- Supabase Auth CAPTCHA enabled
- frontend does not submit CAPTCHA tokens

### Verification or recovery redirects fail

Cause:

- `NEXT_PUBLIC_APP_URL` not set correctly
- deployment URL missing from Supabase allowed redirect URLs

### Gemini or Google Places silently do nothing

Cause:

- provider helper intentionally soft-fails and returns `null` or empty arrays

This is a design choice. Check provider keys and logs before assuming the feature is broken.
