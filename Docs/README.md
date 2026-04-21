# Zylo Docs

This folder is the onboarding package for the Zylo codebase.

Zylo is a travel-first web application that turns saved reels, posts, links, screenshots, and notes into structured destinations, places, maps, and editable trip plans. The current implementation mixes three layers:

1. A polished marketing site.
2. A protected signed-in app shell.
3. A server-backed beta workflow for auth, imports, trip creation, AI chat, and persistence through Supabase.

Read these files in order if you are new:

1. `wandr-base44-product-brief.md`
2. `wandr-base44-data-and-actions.md`
3. `architecture.md`
4. `product-and-user-flows.md`
5. `setup-and-environment.md`
6. `frontend.md`
7. `backend-and-api.md`
8. `data-model.md`
9. `security.md`
10. `testing.md`
11. `rebuild-playbook.md`
12. `Figma Version/README.md`

## Two Documentation Tracks

These docs now preserve two different but related truths:

### 1. Original Product Brief

The user's original build brief describes a product called `Wandr` that should be built in `Base44`, use Base44's built-in auth/database, run as a zero-cost demo stack, and follow a stricter place-first travel planning model.

Read first if you are implementing the original requested product:

- `wandr-base44-product-brief.md`
- `wandr-base44-data-and-actions.md`

### 2. Current Repository Implementation

The checked-in codebase is a `Next.js + Supabase` implementation currently branded mostly as `Zylo`.

Read these if you are modifying the repo that exists today:

- `architecture.md`
- `product-and-user-flows.md`
- `setup-and-environment.md`
- `frontend.md`
- `backend-and-api.md`
- `data-model.md`
- `security.md`
- `testing.md`
- `rebuild-playbook.md`

## Current Project Truths

- Framework: Next.js 15 App Router with TypeScript.
- Styling: Tailwind CSS plus a large custom token and utility layer in `app/globals.css`.
- Auth and persistence: Supabase SSR auth plus Postgres tables and RLS policies.
- Optional providers:
  - Gemini for extraction and AI concierge responses.
  - Google Places for place enrichment.
  - Unsplash for fallback imagery.
  - Resend is installed but not central to the current auth flow.
- State strategy:
  - Many screens still render seeded demo data from `lib/data.ts`.
  - Core API flows write to Supabase.
  - The repo is part real product, part polished beta shell.

## What Is Real Versus Placeholder

Implemented enough to work end to end:

- Public pages and signed-in pages render.
- Protected routes redirect through middleware.
- Supabase sign in, sign up, confirm, password reset, and password update flows exist.
- Import POST endpoint validates input, creates source artifacts, tries Gemini extraction, enriches with Google Places, optionally looks up Unsplash imagery, and writes records to Supabase.
- Trip creation and basic trip generation endpoints exist.
- AI chat endpoint exists and uses taste profile plus optional trip context.
- SQL migration defines most important tables and row-level ownership rules.

Still intentionally shallow or placeholder:

- A number of authenticated screens read demo data instead of live queries.
- The trip generation route only creates a single day stub and marks the trip ready.
- AI chat has a fallback text response when Gemini is unavailable.
- There is a mobile/app navigation entry for `/search`, but that route is not implemented.
- Direct Instagram and TikTok sync are roadmap copy, not launch features.
- Uploaded image handling is not yet a true storage pipeline; the import UI currently asks for OCR text or a description.

## Folder Guide

- `architecture.md`: system map, rendering boundaries, data flow, and major modules.
- `wandr-base44-product-brief.md`: original Wandr/Base44 scope, non-negotiable rules, phases, UI/page requirements, and design system.
- `wandr-base44-data-and-actions.md`: original Base44 entities, server actions, deduplication rules, and build-order verification criteria.
- `product-and-user-flows.md`: user journeys, route inventory, and intended product behavior.
- `setup-and-environment.md`: local setup, environment keys, Supabase requirements, and deployment notes.
- `frontend.md`: layouts, component groups, styling system, and UI behavior.
- `backend-and-api.md`: server actions, API routes, providers, and backend processing notes.
- `data-model.md`: TypeScript domain model plus SQL schema and relationships.
- `security.md`: auth posture, rate limits, validation, headers, and known gaps.
- `testing.md`: automated coverage and what still needs to be tested.
- `rebuild-playbook.md`: exact sequence an engineer or agent should follow to recreate the site.
- `Figma Version/`: everything verified or inferred about the linked Figma Make project.

## Recommended First Tasks For A New Engineer

1. Get the app running locally with Supabase configured.
2. Apply the SQL migration and verify auth redirect URLs.
3. Hit `/api/health` and confirm provider status.
4. Test sign up, email confirmation, password reset, import creation, and AI chat.
5. Decide whether the next milestone is:
   - live data replacing seeded demo screens, or
   - stronger import pipeline and media upload support.

## Recommended First Tasks For An AI Agent

1. Decide whether you are implementing:
   - the original `Wandr/Base44` brief, or
   - the current `Zylo/Next.js` repo.
2. Read the matching docs before touching code.
3. For original-brief work, start with `wandr-base44-product-brief.md` and `wandr-base44-data-and-actions.md`.
4. For current-repo work, start with `rebuild-playbook.md` and `architecture.md`.
5. Treat `lib/data.ts` as demo presentation data, not the source of truth.
6. Treat `db/migrations/001_zylo_public_beta.sql` as the current repo persistence contract.
7. Treat `app/api/*` plus `lib/providers/*` as the live backend behavior in the current repo.
8. Preserve the split between:
   - cinematic public marketing UI, and
   - dark, high-contrast signed-in dashboard UI.

## Highest-Risk Documentation Mismatches

These are the places a new engineer or agent is most likely to get burned:

- The original brief says `Wandr` on `Base44`; the repo is currently `Zylo` on `Next.js + Supabase`.
- The original brief wants `GOOGLE_PLACES_API_KEY`; the repo currently expects `GOOGLE_MAPS_API_KEY`.
- The original brief treats manual import as a permanent first-class feature and Phase 2 OAuth as scaffold-only; the current repo already hints at roadmap connections but does not implement real sync.
- The public `figma.site` artifact is still `Zylo` branded, while the original brief specifies `Wandr`.
