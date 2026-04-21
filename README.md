# Zylo

Zylo is a travel-first public-beta web app that turns saved reels, posts, screenshots, and food finds into organized places, maps, and trip plans.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- React Query
- Zod
- Vitest
- Playwright

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

## Notes

- The current codebase ships a polished product shell, typed domain model, API contracts, and security-oriented validation/rate-limiting scaffolding.
- Environment variables live in `.env.local`, and `.env.example` documents the expected key names.
- Gemini, Google Maps / Places, and Unsplash are now wired through server-side provider helpers with safe fallbacks when keys are missing or quotas fail.
- Supabase SSR auth is wired into the app shell, protected routes, and backend ownership checks.
- The SQL schema and RLS policies live in `db/migrations/001_zylo_public_beta.sql`.
- Review `SECURITY.md` before public deployment to finish the one-time dashboard and infrastructure hardening steps.
- Public beta copy intentionally positions Instagram/TikTok sync as coming soon rather than launch-ready.
