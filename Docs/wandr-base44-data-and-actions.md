# Wandr Base44 Data And Actions

This file captures the original data model and server-side action contract from the Wandr/Base44 brief.

## Entity Model

Use Base44's built-in database.

## User

Extends Base44 auth user with:

- `home_city: Text`
- `home_city_lat: Number`
- `home_city_lng: Number`
- `subtopic_scan_version: Number` default `0`

## ConnectedAccount

Fields:

- `user -> User`
- `platform`
  - `instagram`
  - `tiktok`
- `platform_user_id`
- `access_token`
- `refresh_token`
- `token_expires_at`
- `last_synced_at`
- `is_active` default `true`

## SourceInput

Internal only. No direct user-facing listing page should be built around this as the primary product unit.

Fields:

- `user -> User`
- `input_type`
  - `manual_text`
  - `manual_url`
  - `instagram_video`
  - `tiktok_video`
- `platform`
- `platform_video_id`
- `raw_text`
- `thumbnail_url`
- `processed_at`
- `was_actionable`
- `scan_version_at_processing`

## Destination

Fields:

- `user -> User`
- `name`
- `country`
- `region`
- `cover_photo_url`
- `is_local` default `false`
- `place_count` default `0`

Required product rule:

- a permanent Local destination must exist
- it should be named after the user's home city

## Place

This is the core entity.

Fields:

- `user -> User`
- `destination -> Destination`
- `source_input -> SourceInput`
- `category`
  - `food`
  - `activity`
  - `photo_spot`
  - `stay`
- `name`
- `description`
- `address`
- `city`
- `country`
- `latitude`
- `longitude`
- `photo_url`
- `google_place_id`
- `cuisine_type`
- `price_range`
  - `$`
  - `$$`
  - `$$$`
  - `$$$$`
- `tags`
- `is_visited` default `false`
- `is_in_itinerary` default `false`
- `times_seen` default `1`
- `duplicate_of -> Place` optional self relation

Critical rules:

- `photo_url` should come from Google Places photos first
- never use source video thumbnails as the canonical place photo
- deduplicate first, then increment `times_seen`

## Itinerary

Fields:

- `user -> User`
- `destination -> Destination`
- `title`
- `date_from`
- `date_to`

## ItineraryItem

Fields:

- `itinerary -> Itinerary`
- `place -> Place`
- `day_number`
- `sort_order` default `0`
- `note`

## Backend Actions

## `processInput(sourceInputId, userId)`

This is the core AI pipeline and the most important backend action in the brief.

Required order:

1. load `SourceInput`
2. use `sourceInput.raw_text` as content
3. call Gemini `gemini-2.0-flash`
4. parse strict JSON `{ places: [...] }`
5. if empty or invalid:
   - set `was_actionable = false`
   - set `processed_at = now()`
   - return success with `placesFound = 0`
6. for each extracted place:
   - run Google Places text search
   - extract place ID, address, coordinates, photo
   - use Unsplash fallback when needed
   - deduplicate before insert
   - find or create destination
   - create `Place`
   - recompute destination place count
7. finalize SourceInput as actionable and processed

### Required Gemini endpoint

Use:

- `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

Key generation settings from the brief:

- `temperature: 0.1`
- `responseMimeType: "application/json"`

Why this matters:

- low temperature keeps extraction consistent
- JSON response mode reduces parsing failures

### Required Gemini contract

The brief specifies:

- low temperature `0.1`
- `responseMimeType = "application/json"`
- extract only specific, named, physically visitable places
- categories must be exactly:
  - `food`
  - `activity`
  - `photo_spot`
  - `stay`

### Required Google Places behavior

Use:

- `POST https://places.googleapis.com/v1/places:searchText`

Use field mask:

- `places.id`
- `places.displayName`
- `places.formattedAddress`
- `places.location`
- `places.photos`

Photo URL format:

- `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}`

Fallback order:

1. Google Places photo
2. Unsplash search by place name and city
3. UI placeholder if both fail

### Required deduplication behavior

If `google_place_id` exists:

- search by `(user, google_place_id)`
- update `times_seen += 1`
- skip insert

If `google_place_id` does not exist:

- search by case-insensitive `name + city`
- update `times_seen += 1`
- skip insert

## `fetchUrlMetadata(url)`

Purpose:

- server-side URL fetch
- extract `og:description` or meta description
- avoid client-side CORS issues

Return:

- `{ raw_text: string | null }`

## `syncVideos(userId)`

Phase 2 stub only.

Expected current behavior:

- return mock data
- message should push users back toward manual import
- keep TODO notes for future Instagram Graph API and TikTok API work

This is intentional. The brief explicitly says Phase 2 should scaffold the connected state without pretending live sync is complete.

## `exportItinerary(itineraryId)`

Purpose:

- load itinerary and sorted items
- return plain text export

Required output structure:

- itinerary title and destination
- date range
- day groupings
- bullet list of place name, category, optional cuisine, address

## Build-Order Verification From The Brief

The brief says to validate the system in this order:

1. create entities
2. build and directly test `processInput`
3. verify repeated import increments `times_seen` without duplicates
4. build `fetchUrlMetadata` and `exportItinerary`
5. build onboarding
6. build import panel
7. build home
8. build destination browsing
9. build place detail
10. build search
11. build itineraries
12. scaffold Phase 2 account connection UI
13. add loading and empty states
14. run final duplicate test with repeated paste

## Sample Verification Input From The Brief

The prompt defines a canonical import test:

`You have to visit Ichiran Ramen in Shibuya, Tokyo and then teamLab Planets in Toyosu! The view from Shibuya Sky at sunset is insane too.`

Expected behavior:

- Gemini extracts 3 places
- Google Places resolves each place
- each resulting `Place` gets a `photo_url`
- running the same input again increments `times_seen` rather than creating new rows

## Environment Contract From The Brief

Only three secrets are required for Phase 1:

- `GEMINI_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `UNSPLASH_ACCESS_KEY`

This zero-cost constraint is part of the product definition, not just an implementation preference.

## Current Repo Divergence From This Contract

The checked-in repo differs in important ways:

- current database is SQL/Supabase, not Base44 entities
- current category names differ in some places
- current destination/place schema is similar but not identical
- current import pipeline uses `GOOGLE_MAPS_API_KEY`, not `GOOGLE_PLACES_API_KEY`
- current repo still stores more demo-oriented shape in some front-end files

Use this file when the task is to align implementation to the original prompt, not when you only need to understand the code as it exists today.
