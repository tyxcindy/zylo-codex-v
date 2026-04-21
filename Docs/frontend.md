# Frontend

## Frontend Philosophy

The frontend is deliberately split into two visual worlds:

- Marketing: energetic, animated, aspirational.
- App shell: dark, operational, product-focused.

Anyone rebuilding Zylo should preserve that contrast. If both areas start to look the same, the product loses its positioning.

## Core Frontend Stack

- Next.js App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- React Query

## Layout Structure

### Root Layout

File:

- `app/layout.tsx`

Responsibilities:

- inject metadata
- load `app/globals.css`
- run theme bootstrap script before hydration
- wrap everything with `Providers`
- wrap everything with `SiteChrome`

### Providers

File:

- `components/providers.tsx`

Responsibilities:

- create `QueryClient`
- provide React Query defaults
- mount `ThemeProvider`

### Site Chrome

File:

- `components/site-chrome.tsx`

Responsibilities:

- detect whether current route is public or app
- show marketing header/footer only on public routes

## Public Marketing UI

Key files:

- `components/marketing/hero.tsx`
- `components/marketing/how-it-works.tsx`
- `components/marketing/mobile-showcase.tsx`
- `components/marketing/feature-grid.tsx`
- `components/marketing/problem-strip.tsx`
- `components/marketing/security-trust.tsx`
- `components/marketing/faq-list.tsx`
- `components/marketing/final-cta.tsx`
- `components/marketing/site-header.tsx`
- `components/marketing/site-footer.tsx`

Design characteristics:

- large condensed headings
- layered gradients
- glass and mesh panels
- animated bars, scan lines, pulses, floating cards
- dark branded background on the homepage

Important note:

- `ProblemStrip`, `SecurityTrust`, and `RoadmapTeaser` exist but are not currently mounted on the homepage route.

## Authenticated App UI

Key files:

- `components/app/app-shell.tsx`
- `components/app/dashboard-overview.tsx`
- `components/app/import-workbench.tsx`
- `components/app/places-grid.tsx`
- `components/app/map-panel.tsx`
- `components/app/trips-board.tsx`
- `components/app/ai-concierge.tsx`
- `components/app/settings-panel.tsx`
- `components/app/section-intro.tsx`

Design characteristics:

- darker background and cards
- operational dashboard tone
- stronger contrast
- simplified navigation
- less atmospheric motion than the landing page

## Theme System

Files:

- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `app/layout.tsx`
- `app/globals.css`

How it works:

1. `app/layout.tsx` injects a `beforeInteractive` script that reads local storage and sets `document.documentElement.dataset.theme`.
2. `ThemeProvider` syncs theme state on the client.
3. `ThemeToggle` flips between `light` and `dark`.
4. CSS variables in `app/globals.css` switch token values based on `html[data-theme="dark"]`.

Important note:

- The root HTML starts with `data-theme="light"` and then hydrates into the preferred value.

## Styling System

The styling model combines Tailwind utility classes with a rich hand-authored CSS token layer in `app/globals.css`.

### Main token groups

- background and foreground
- surface and card colors
- text and soft text colors
- line colors
- brand colors
- shadow tokens

### Reusable CSS concepts

- `page-shell`
- `glass-panel`
- `home-panel`
- `home-panel-muted`
- `home-kicker`
- `home-title`
- `home-copy`
- `mesh-card`
- `app-frame`
- `app-card`

These are critical to the look and should not be stripped out casually.

## Component Groups

### `components/ui/`

Contains primitives:

- button
- input
- textarea
- card
- badge
- logo

These are the shared low-level building blocks.

### `components/auth/`

- sign-in panels
- forgot password form
- update password form

Important note:

- These forms currently perform client-side Supabase auth operations directly.
- Server action versions of similar auth logic also exist in `app/*/actions.ts`.

### `components/app/`

These represent the signed-in experience but are still partly fed by demo seed data.

## Data Usage In The Frontend

### Demo-data-driven screens

- dashboard overview
- places grid
- map panel
- trips board
- some settings content
- FAQ content

### API-connected interactive screens

- import workbench
- AI concierge
- auth flows via client-side Supabase methods

## Known Frontend Inconsistencies

### Missing `/search` page

- `AppShell` includes a `Search` nav item pointing to `/search`.
- There is no `app/(app)/search/page.tsx`.

### Mixed real and fake data

- The app looks coherent, but many views are still seeded from `lib/data.ts`.
- This can fool a new engineer into thinking those screens are live.

### Auth duplication

- There are server actions for sign-in/sign-up/reset/update.
- There are also client-side form handlers that hit Supabase directly.
- A future cleanup should choose one primary path per flow.

## Responsive Behavior

The app is designed to work on desktop and mobile.

Examples:

- `AppShell` uses a desktop sidebar and mobile bottom nav.
- Marketing sections use stacked mobile layouts and split desktop grids.
- Forms and cards use large tap targets.

## What To Preserve In A Recreation

If recreating the frontend from scratch, preserve:

- the cinematic homepage tone
- the contrast between public and private surfaces
- the condensed heading style
- the theme toggle and persistent theme
- the bottom nav on mobile app routes
- the import, trip, and AI product metaphors

Avoid turning the interface into:

- a generic SaaS admin panel
- a template-looking Tailwind landing page
- a flat monochrome travel dashboard

