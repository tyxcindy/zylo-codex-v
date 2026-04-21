# Rebuild Playbook

This guide is written for an engineer, AI agent, or CLI workflow that needs to recreate Zylo from scratch while keeping the same product direction.

## Scope Note

This file is the rebuild guide for the current repository implementation.

If you need to rebuild the app from the original user brief exactly, start with:

- `wandr-base44-product-brief.md`
- `wandr-base44-data-and-actions.md`

That brief specifies `Wandr` on `Base44`, which is not the same stack or naming as the current repo.

## Goal

Rebuild a travel-first web app that:

- accepts saved travel content
- extracts real places
- organizes them by destination
- lets users browse places and trips
- offers itinerary-aware AI support
- uses a polished public marketing site and a separate protected app shell

## Non-Negotiable Product Characteristics

Preserve these:

- public site feels cinematic and consumer-facing
- signed-in app feels like an operational control center
- travel is the launch wedge
- direct IG/TikTok sync is roadmap, not fake-shipped
- auth is real
- persistence is real
- provider failures degrade gracefully

## Recommended Rebuild Order

## Phase 1. Scaffold The App

1. Create a Next.js App Router project with TypeScript.
2. Add Tailwind CSS.
3. Add Framer Motion.
4. Add React Query.
5. Add Zod.
6. Add Supabase SSR support.

Expected libraries:

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `framer-motion`
- `@tanstack/react-query`
- `zod`
- `@supabase/ssr`
- `@supabase/supabase-js`

## Phase 2. Build Global Shells

1. Create `app/layout.tsx`.
2. Add a root provider wrapper.
3. Add a theme bootstrap script before hydration.
4. Create:
   - marketing header/footer shell
   - protected app shell

Keep:

- mobile responsiveness
- bottom nav for mobile app routes
- theme persistence through local storage

## Phase 3. Implement Auth And Access Control

1. Set up Supabase browser and server clients.
2. Build middleware that:
   - refreshes the session
   - protects app routes
   - redirects signed-in users away from auth pages
3. Create auth pages:
   - sign in
   - sign up
   - forgot password
   - update password
4. Create auth confirm route for email verification and recovery.

## Phase 4. Define The Data Layer

Implement the database entities:

- profiles
- taste_profiles
- platform_connections
- destinations
- source_artifacts
- import_jobs
- places
- trips
- trip_days
- trip_stops
- audit_events

Apply RLS from day one.

## Phase 5. Build Import Pipeline

Implement `/api/imports` with this exact order:

1. auth check
2. schema validation
3. rate limit
4. ensure profile exists
5. create source artifact
6. create import job
7. extract places with Gemini
8. enrich with Google Places
9. optionally fetch Unsplash image
10. upsert destination
11. upsert place
12. complete job status
13. record audit event

Do not skip the deduplication logic on places. It is part of the product value.

## Phase 6. Build Signed-In Product Surfaces

Create pages for:

- dashboard
- import
- places
- map
- trips
- ai
- settings

Short-term acceptable:

- use seeded demo data for some presentation surfaces

Long-term required:

- replace demo reads with user-scoped Supabase queries

## Phase 7. Add AI Concierge

Implement:

- prompt validation
- optional trip context
- taste profile summary
- Gemini response generation
- audit event logging
- fallback response when model call fails

## Phase 8. Add Security Hardening

Implement:

- strong password rules
- route-level auth
- rate limiting
- input sanitization
- external URL safety checks
- security headers
- audit logs

## Phase 9. Add Tests

Start with:

- validation tests
- security tests
- provider status tests
- homepage smoke test

Then add:

- API route tests
- middleware tests
- auth flow tests

## File-By-File Recreation Guide

### Root files

Create:

- `package.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `middleware.ts`
- `README.md`
- `SECURITY.md`

### App router

Create:

- `app/layout.tsx`
- `app/page.tsx`
- `app/template.tsx`
- `app/manifest.ts`
- public route pages
- app route group pages
- auth confirm route
- API routes

### Components

Create:

- `components/providers.tsx`
- `components/site-chrome.tsx`
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `components/ui/*`
- `components/marketing/*`
- `components/app/*`
- `components/auth/*`

### Lib layer

Create:

- `lib/auth.ts`
- `lib/audit.ts`
- `lib/database.ts`
- `lib/domain.ts`
- `lib/env.ts`
- `lib/provider-status.ts`
- `lib/request.ts`
- `lib/security.ts`
- `lib/validation.ts`
- `lib/supabase/*`
- `lib/providers/*`

### Database

Create:

- `db/migrations/001_zylo_public_beta.sql`

## Common Rebuild Mistakes To Avoid

### Mistake 1. Treating `lib/data.ts` as the source of truth

Wrong:

- build the whole app around demo arrays

Right:

- use it only as a temporary UX scaffold and copy guide

### Mistake 2. Shipping fake sync

Wrong:

- imply direct Instagram or TikTok sync exists if it does not

Right:

- keep imports real and label direct sync as roadmap

### Mistake 3. Flattening the design

Wrong:

- generic SaaS dashboard UI

Right:

- preserve a strong marketing identity and a distinct app shell

### Mistake 4. Skipping RLS

Wrong:

- trust only frontend route checks

Right:

- enforce ownership in SQL

### Mistake 5. Making providers mandatory

Wrong:

- let missing provider keys crash the app

Right:

- degrade gracefully and expose provider status

## Acceptance Criteria For A Successful Recreation

The rebuild is successful if all of the following are true:

1. anonymous users can browse the public marketing site
2. signed-in users can reach protected pages
3. auth confirmation and recovery flows work
4. imports create artifacts and jobs in the database
5. extracted places persist to Supabase
6. trips can be created and marked ready
7. AI chat responds with trip/taste-aware language
8. provider keys can be missing without crashing the app
9. middleware adds security headers and route protection
10. the site still feels like Zylo rather than a generic starter template
