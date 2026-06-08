# Zylo

Zylo is a travel-first public-beta web app that turns saved reels, posts, screenshots, and food finds into organized places, maps, and trip plans.

## What it does
Zylo turns saved Instagram reels and travel content into organized destination boards, 
place maps, and trip itineraries. Users import links or text, and Zylo extracts and 
groups destinations, restaurants, activities, and stays.

## Live Demo
https://zylov10-git-main-cindy-tang-projects.vercel.app

Try it with these sample Instagram reels (no account needed for demo):
- [Shenzhen](https://www.instagram.com/p/DQRR-UjCWlw/)
- [Paris](https://www.instagram.com/p/DIROk2nJzRe/)
- [Bangkok](https://www.instagram.com/p/DOjIm54EZZg/)
(Full demo dataset of 30 reels across 20+ destinations available in-app)

## Current Status
Instagram/TikTok direct sync is in development. The current version supports 
manual link import with full extraction and organization functionality.

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
- Gemini, Google Maps / Places, and Unsplash are now wired through server-side provider helpers with safe fallbacks when keys are missing or quotas fail.
- Supabase SSR auth is wired into the app shell, protected routes, and backend ownership checks.
- Public beta copy intentionally positions Instagram/TikTok sync as coming soon rather than launch-ready.
