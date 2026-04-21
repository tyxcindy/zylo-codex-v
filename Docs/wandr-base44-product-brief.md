# Wandr Base44 Product Brief

This file captures the original requested product brief, independent of the current repository implementation.

## Core Product Definition

Build a full-stack web app called `Wandr` in `Base44`.

Purpose:

- take pasted travel content
- extract specific, named, physically visitable places
- organize them into a destination-first trip planning board
- always include a permanent `Local` destination named after the user's home city

Primary organization model:

- destination first
- category second

Required categories:

- `food`
- `activity`
- `photo_spot`
- `stay`

## Required Stack

This brief is intentionally zero-cost for testing and demo use.

### Free-tier services only

- AI: `Google Gemini 2.0 Flash`
  - model string: `gemini-2.0-flash`
  - env var: `GEMINI_API_KEY`
- Place lookup and photos: `Google Places API (New)`
  - env var: `GOOGLE_PLACES_API_KEY`
- Photo fallback: `Unsplash API`
  - env var: `UNSPLASH_ACCESS_KEY`
- Auth and database: `Base44 built-in auth and database`

Explicitly not allowed:

- Stripe
- subscriptions
- paid services

## Most Important Non-Negotiable Rules

## 1. The Unit Is A Place, Not A Video

The UI must never revolve around source videos.

Every visible surface should show place cards, not video cards.

Required place card data:

- name
- destination
- category
- AI-written description
- real photo from Google Places when available
- address
- tags

Original source content:

- stored internally only
- never shown in UI

## 2. Zero Duplicates

This is the hardest product rule and must be enforced at the data layer.

Primary deduplication:

- one `Place` row per `(user, google_place_id)`

Behavior:

- if the same place appears again from another paste or sync input
- increment `times_seen`
- do not create a second visible card

Fallback deduplication when Google Places fails:

- normalized `name + city` comparison

## 3. Extract Only Actionable, Physically Visitable Places

Allowed:

- restaurants
- cafes
- bars
- hotels
- museums
- parks
- viewpoints
- markets
- landmarks

Silently discard:

- memes
- recipes
- cooking tutorials
- fashion content
- motivational content
- unnamed places
- generic tips
- content with no actionable place

If nothing is found:

- show a friendly empty-result message
- never show an error

## 4. Phase 1 Versus Phase 2

### Phase 1

Build fully:

- manual import from pasted text or URLs

### Phase 2

Scaffold only:

- Instagram OAuth buttons
- TikTok OAuth buttons
- connected-state UI
- mock sync responses

The logic remains stubbed with TODO notes.

Important:

- manual import is permanent and first-class
- it is not a temporary workaround

## Product Structure

## Onboarding

Three-step public onboarding:

1. sign up or log in
2. collect home city and create Local destination
3. choose between manual import or connect-account scaffold

### Step 1. Sign up / Log in

Required content:

- `Wandr` wordmark and logo
- tagline: `Your saved videos, turned into a trip planner.`
- email and password fields
- Base44 sign-up and log-in actions

Behavior:

- redirect to `/home` if already logged in
- advance to Step 2 on auth success

### Step 2. Home city

Required purpose:

- collect the home city
- create a permanent Local destination

Behavior:

- save `home_city`
- look up `home_city_lat` and `home_city_lng` through Google Places Text Search
- create a `Destination` with `is_local = true`
- skip path should still create a Local destination, even if using placeholder text like `My City`

### Step 3. Get started

Required choice architecture:

- recommended card for manual import
- secondary scaffold card for Instagram and TikTok connection

Important behavior:

- Phase 2 connect buttons only show `Coming soon`
- they can store intent, but not perform real sync
- user should always have a path into manual import

## Home

Required sections:

- `Seen multiple times`
- `Your destinations`
- `Recently added`

Required empty state:

- no skeleton card wall
- show a clear centered message that the planner is empty
- primary CTA opens import

## Destinations

Destination-first browsing with:

- local destination pinned first
- grid view
- destination detail page
- category filters
- place cards

### Destination Detail Must Include

- hero image
- total place count
- create-itinerary CTA
- category tabs:
  - All
  - Food
  - Activities
  - Photo Spots
  - Stays
- sort controls:
  - Most saved
  - Newest
  - A-Z
- search filter by name or tags
- visible `Seen N×` badge for repeated places

## Place Details

Each place gets a full detail surface with:

- image or placeholder
- description
- details
- map link
- itinerary add flow
- visited toggle
- related places from same city

Additional required behavior:

- breadcrumb should show destination and category
- food places should surface cuisine and price when known
- maps button should prefer `lat,lng` links, then fallback to address/name query
- if `times_seen > 1`, show a lightweight informational row, never source-video links

## Itineraries

Required pages:

- itinerary list
- create itinerary
- itinerary detail
- export plain-text itinerary action

### Itinerary Detail Requirements

- destination name
- itinerary title
- editable date range
- day grouping if dates exist
- single `Places` grouping if no dates exist
- add-place flow grouped by categories
- remove and reorder interactions
- export modal with copy-to-clipboard

## Search

Searches places, not source inputs.

Requirements:

- auto-focused input
- filters by category
- results grouped by destination
- initial empty prompt for discovery
- explicit no-results state for typed query

## Settings

Required sections:

- connected accounts
- import history
- home city
- data tools
- account

Additional settings requirements:

- connected rows should show sync status
- expired tokens should show reconnect state
- import history should show manual imports only
- deleting SourceInput history should not delete derived Place rows
- re-analyze action should rerun processing over stored inputs
- delete-all-data should clear all user-owned planning data

## Design System From The Brief

Font:

- Inter

Visual direction:

- soft neutral background
- flat cards
- no shadows
- category-driven accent system
- mobile bottom nav
- desktop left sidebar
- smooth fades between pages
- accessible labels and image alt text
- minimum 44x44 tap targets
- loading skeletons for data states

Key colors:

- page background `#FAFAF8`
- card background `#FFFFFF`
- text primary `#1A1A18`
- text secondary `#6B6A64`
- border `#E8E7E0`
- coral seen badge `#F0997B`
- success green `#0F6E56`

Category accents:

- food `#F0997B`
- activity `#EF9F27`
- photo_spot `#7F77DD`
- stay `#85B7EB`

Core component rules:

- white cards
- 1px neutral border
- 16px radius
- no drop shadows
- rounded-full category badges
- rounded-full seen badge
- strong black primary button
- bordered secondary button
- neutral text inputs with strong focus border
- no broken-image icons
- placeholder blocks use category accent at low opacity plus icon

## Build Order From The Brief

The prompt defines a strict build sequence:

1. create database entities
2. build and directly test `processInput`
3. build `fetchUrlMetadata` and `exportItinerary`
4. build onboarding
5. build import panel
6. build `/home`
7. build destination pages
8. build place detail
9. build search
10. build itineraries
11. build settings
12. scaffold Phase 2 connection UI
13. add loading and empty states
14. run final duplicate-import verification

Required duplicate verification:

- paste the same caption three times
- same place cards remain singular
- `times_seen` becomes `3`
- no duplicate visible places are ever created

## Current Repo Divergence From This Brief

The repository checked into this workspace does not match the brief exactly.

Main differences:

- current codebase is `Zylo`, not `Wandr`
- current codebase is `Next.js + Supabase`, not `Base44`
- current repo env naming uses `GOOGLE_MAPS_API_KEY`, not `GOOGLE_PLACES_API_KEY`
- current repo still has dark cinematic marketing/app surfaces, not the flatter light Base44-style design system from the brief
- current repo exposes routes like `Map` and `AI`, while the original brief is stricter about destination/place/itinerary structure

## How To Use This Brief

Use this file as the source of truth when the task is:

- recreating the originally requested product
- aligning implementation to the user's first prompt
- auditing differences between the repo and the intended Base44 product
