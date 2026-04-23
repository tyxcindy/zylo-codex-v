# Architecture

## Scope Note

This file documents the current repository architecture.

If the task is to follow the original user brief exactly, read these first:

- `wandr-base44-product-brief.md`
- `wandr-base44-data-and-actions.md`

The biggest architectural mismatch is:

- original brief: `Wandr` on `Base44`
- current repo: `Zylo` on `Next.js + Supabase`

## Executive Summary

Zylo is built as a Next.js App Router application with two major experiences:

- Public marketing pages that sell the idea of filtering saved travel content into a usable personal travel space.
- Protected application pages that represent the signed-in product for imports, places, maps, trips, AI assistance, and settings.

The codebase is not a pure CRUD app and not a pure static prototype. It is a hybrid:

- The platform and security foundation are real.
- Several app surfaces are still demo-data-driven.
- The backend endpoints already persist core objects into Supabase.

## Original Brief Architecture Versus Current Repo

The original requested architecture is:

- Base44 full-stack app
- Base44 auth and database
- manual import in Phase 1
- Instagram and TikTok OAuth scaffold only in Phase 2
- place-first UX with no video-centric UI

The current repo architecture is:

- Next.js App Router app
- Supabase auth and Postgres
- real JSON routes inside the app
- roadmap-style social sync hints, but no real OAuth sync implementation
- a hybrid of demo-data UI and real backend persistence

## High-Level Layers

### 1. Presentation Layer

Files:

- `app/*`
- `components/*`
- `app/globals.css`

Responsibilities:

- Render public and authenticated pages.
- Provide theme switching.
- Maintain the product's distinct visual identity:
  - public site = cinematic, animated, branded
  - app shell = darker operational workspace

### 2. Routing and Access Control Layer

Files:

- `middleware.ts`
- `app/(app)/layout.tsx`
- `lib/auth.ts`
- `lib/supabase/middleware.ts`

Responsibilities:

- Refresh Supabase SSR session state.
- Redirect anonymous users away from protected app routes.
- Redirect authenticated users away from auth pages like `/sign-in`.
- Attach security headers to responses.

### 3. Application Logic Layer

Files:

- `app/api/*`
- `app/*/actions.ts`
- `lib/app-data.ts`
- `lib/database.ts`
- `lib/import-analysis.ts`
- `lib/import-logger.ts`
- `lib/import-pipeline.ts`
- `lib/validation.ts`
- `lib/security.ts`
- `lib/request.ts`
- `lib/audit.ts`

Responsibilities:

- Validate and sanitize requests.
- Apply in-memory rate limits.
- Fetch current user from the Supabase session.
- Build user-scoped snapshot data for server-rendered app pages.
- Analyze reel evidence before provider calls.
- Orchestrate the multi-stage import pipeline and diagnostics logging.
- Insert and update database rows.
- Record audit events.
- Coordinate provider calls.

### 4. Provider Integration Layer

Files:

- `lib/providers/gemini.ts`
- `lib/providers/google-places.ts`
- `lib/providers/nominatim.ts`
- `lib/providers/unsplash.ts`
- `lib/url-metadata.ts`

Responsibilities:

- Read public metadata from travel URLs.
- Verify candidates through a free geocoding path before paid provider lookup.
- Extract place candidates from imported content.
- Enrich extracted places with verified address and coordinates.
- Retrieve fallback destination imagery.
- Generate AI concierge responses.

### 5. Persistence Layer

Files:

- `db/migrations/001_zylo_public_beta.sql`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`

Responsibilities:

- Authenticate users with Supabase Auth.
- Persist user-owned data in Postgres.
- Enforce row-level ownership.
- Enable audit logging through the service-role admin client.

## Request Flow

### Public Page Request

1. Request hits `middleware.ts`.
2. Middleware refreshes session cookies with Supabase SSR.
3. If route is public, request continues.
4. `app/layout.tsx` wraps the page in global providers and `SiteChrome`.
5. `SiteChrome` decides whether to show marketing header/footer.

### Protected App Page Request

1. Request hits `middleware.ts`.
2. If path starts with `/dashboard`, `/import`, `/places`, `/map`, `/trips`, `/ai`, or `/settings`, the middleware requires authentication.
3. If authenticated, `app/(app)/layout.tsx` calls `requirePageUser()`.
4. The page renders inside `AppShell`.

### API Request

1. Request reaches `app/api/.../route.ts`.
2. Route calls `requireApiUser()`.
3. Request payload is parsed and validated with Zod.
4. Rate limiting is applied.
5. Database reads and writes happen through the Supabase SSR client.
6. Optional providers are called.
7. Audit events are recorded through the admin client when available.
8. JSON response is returned.

## Directory Map

### `app/`

- Root app router structure.
- Public pages:
  - `/`
  - `/pricing`
  - `/how-it-works`
  - `/security`
- `/faq`
- `/onboarding`
- `/sign-in`
- `/forgot-password`
- `/update-password`
- Auth callback route:
  - `/auth/confirm`
- API routes:
- `/api/health`
- `/api/imports`
- `/api/imports/[id]`
- `/api/profile/planner-notes`
- `/api/places/[id]/save-state`
- `/api/trips`
- `/api/trips/[id]/generate`
- `/api/ai/chat`
- Protected app group:
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

### `components/`

- `marketing/`: public landing and supporting sections.
- `app/`: authenticated workspace UI.
- `auth/`: sign-in, reset, and password update forms.
- `ui/`: low-level primitives like button, input, card, badge, logo.
- global providers and theme controls.

### `lib/`

- `auth.ts`: current user helpers.
- `app-data.ts`: server-side library snapshot loader for signed-in routes.
- `audit.ts`: audit logging.
- `database.ts`: helper functions for upserting profiles, destinations, and places.
- `domain.ts`: TypeScript domain contracts.
- `env.ts`: environment variable normalization.
- `import-analysis.ts`: evidence normalization, travel scoring, and rule-based place seeding.
- `import-logger.ts`: append-only JSONL import diagnostics.
- `import-pipeline.ts`: multi-stage import orchestration for URL, text, and screenshot-text workflows.
- `provider-status.ts`: availability summary for third-party services.
- `request.ts`: IP, redirect, and app URL utilities.
- `security.ts`: rate limiting and input safety utilities.
- `validation.ts`: Zod schemas.
- `supabase/`: browser, server, admin, and middleware clients.
- `providers/`: Gemini, Google Places, Nominatim, Unsplash.

### `db/`

- `schema.ts`: short notes, not the actual authoritative schema.
- `migrations/001_zylo_public_beta.sql`: the actual database contract.

### `tests/`

- unit tests for validation, provider status, and security helpers.
- Playwright smoke test for homepage branding.

## Rendering Strategy

The app intentionally mixes:

- Server Components for most page-level rendering.
- Client Components where interactivity is needed:
  - theme provider
  - app shell navigation
  - import workbench
  - AI concierge
  - marketing motion sections
  - auth forms

This keeps the route tree simple while still allowing rich interaction.

## Data Strategy

There are two distinct data sources:

### Demo Seed Data

File:

- `lib/data.ts`

Used by:

- dashboard overview
- places grid
- map preview
- trips board
- settings panel connection cards
- FAQ and marketing copy support

Purpose:

- make the product look full and coherent before every live query is wired up.

### Live Supabase Data

Used by:

- authentication
- source artifacts
- import jobs
- destinations
- places
- trips
- trip days
- trip stops
- taste profiles
- audit events

Purpose:

- support real persistence and secure per-user ownership.

### Snapshot-Loaded Route Data

File:

- `lib/app-data.ts`

Used by:

- dashboard
- import
- map
- destinations
- search
- settings

Purpose:

- load a user-scoped library snapshot of destinations, places, recent source artifacts, and profile data including `planner_notes`

## Architectural Strengths

- Clear split between public and protected surfaces.
- Real auth model with SSR session handling.
- SQL migration includes row-level security.
- Validation and rate limiting exist at the route boundary.
- Provider helpers fail safely instead of taking down the request path.
- Audit logging is treated as important but non-blocking.

## Architectural Weaknesses And Important Caveats

- In-memory rate limiting is process-local and resets on restart.
- Several visible app pages still read demo data instead of live records.
- Auth logic exists in both server actions and client-side Supabase form handlers, which creates duplication.
- `db/schema.ts` is not the real schema and should not be used as the source of truth.
- Import processing is synchronous inside the request instead of background-job-driven.
- Image import is still text-based placeholder behavior, not a real upload pipeline.
- The import pipeline now does materially more work inside a single request: metadata fetch, `yt-dlp`, subtitle parsing, OCR, transcription, free geocoding, paid enrichment, and persistence all happen before the response returns.

## What To Preserve If Refactoring

Do not accidentally flatten the product into a generic dashboard. The codebase is built around a deliberate contrast:

- Public site = animated, aspirational, consumer-facing.
- Signed-in app = focused, operational, darker control center.

If you refactor architecture, preserve:

- Supabase SSR auth flow.
- strict route protection.
- provider failures returning soft degradation.
- audit hooks.
- validation before persistence.
- the separation between demo presentation data and real persisted entities.
