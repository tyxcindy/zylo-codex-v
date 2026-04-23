# Data Model

## Source Of Truth

Use these in order:

1. `db/migrations/001_zylo_public_beta.sql` for database truth
2. `lib/domain.ts` for frontend/backend TypeScript contracts
3. `lib/data.ts` only for seeded demo presentation data

Do not use `db/schema.ts` as the main schema reference. It is only a short note file.

## Conceptual Entities

### User

Represents the signed-in traveler.

Stored across:

- `auth.users` in Supabase Auth
- `public.profiles`

Fields of interest:

- email
- display name
- home city
- planner notes

### Taste Profile

Represents preference signals used by AI.

Examples:

- priorities
- favorite cuisines
- avoids

### Platform Connection

Represents external account or product integrations.

Currently modeled for:

- Instagram
- TikTok
- Beli

### Destination

Represents a city or place cluster around which a trip can be organized.

### Source Artifact

Represents imported raw material.

Examples:

- pasted URL
- pasted text
- screenshot-derived text
- manual content

### Import Job

Represents processing state attached to a source artifact.

### Place

Represents a normalized visitable entity extracted from imports.

Examples:

- cafe
- restaurant
- bar
- hotel
- scenic spot

### Trip

Represents an itinerary project tied to a destination.

### Trip Day

Represents a day-level grouping inside a trip.

### Trip Stop

Represents a time-based place stop within a trip day.

### Audit Event

Represents security, auth, API, import, or AI events worth recording.

## TypeScript Domain Model

File:

- `lib/domain.ts`

Important enums and unions:

- `PlaceCategory`
- `SourceArtifact.type`
- `SourceArtifact.status`
- `Trip.status`
- `PlatformConnection.status`
- `AuditEvent.type`
- `AuditEvent.severity`

## SQL Tables

## `profiles`

Purpose:

- one row per auth user

Important fields:

- `user_id`
- `email`
- `display_name`
- `home_city`
- `planner_notes`
- timestamps

## `taste_profiles`

Purpose:

- store user preference arrays

Important fields:

- `priorities`
- `favorite_cuisines`
- `avoids`

## `platform_connections`

Purpose:

- store external connection status

Important fields:

- `platform`
- `status`
- `summary`

## `destinations`

Purpose:

- user-owned city/destination buckets

Important fields:

- `name`
- `country`
- `vibe`
- `cover_tone`
- `is_local`

Constraint:

- unique per `user_id + name + country`

## `source_artifacts`

Purpose:

- raw import inputs

Important fields:

- `type`
- `label`
- `raw_content`
- `status`
- `extracted_places`

## `import_jobs`

Purpose:

- processing state for a source artifact

Important fields:

- `source_artifact_id`
- `status`
- `error_message`

Constraint:

- one import job per source artifact

## `places`

Purpose:

- normalized saved locations

Important fields:

- `destination_id`
- `source_artifact_id`
- `google_place_id`
- `name`
- `city`
- `country`
- `category`
- `address`
- `description`
- `latitude`
- `longitude`
- `times_seen`
- `source_count`
- `is_visited`
- `is_in_trip`
- `tags`

Constraints:

- unique per `user_id + name + city + country`
- unique partial index on `user_id + google_place_id` where present

## `trips`

Purpose:

- top-level itinerary records

Important fields:

- `destination_id`
- `title`
- `status`
- `vibe`
- `travelers`

SQL statuses:

- `draft`
- `ready`

Important note:

- the TypeScript demo data includes `upcoming` and `past`, but the SQL table only supports `draft` and `ready`. That is a real mismatch.

## `trip_days`

Purpose:

- ordered trip sub-sections

Important fields:

- `trip_id`
- `title`
- `sort_order`

## `trip_stops`

Purpose:

- ordered trip stops

Important fields:

- `trip_day_id`
- `place_id`
- `stop_time`
- `note`
- `sort_order`

## `audit_events`

Purpose:

- security and system visibility

Important fields:

- `user_id`
- `event_type`
- `message`
- `severity`
- `metadata`

## Relationships

- `auth.users` -> `profiles`
- `auth.users` -> `taste_profiles`
- `auth.users` -> `platform_connections`
- `auth.users` -> `destinations`
- `auth.users` -> `source_artifacts`
- `auth.users` -> `import_jobs`
- `auth.users` -> `places`
- `auth.users` -> `trips`
- `auth.users` -> `trip_days`
- `auth.users` -> `trip_stops`
- `auth.users` -> `audit_events`
- `source_artifacts` -> `import_jobs`
- `source_artifacts` -> `places`
- `destinations` -> `places`
- `destinations` -> `trips`
- `trips` -> `trip_days`
- `trip_days` -> `trip_stops`
- `places` -> `trip_stops`

## Auto-Creation Behavior

The SQL migration installs `handle_new_user()`.

When a new auth user is created:

- a `profiles` row is inserted
- a `taste_profiles` row is inserted

The application layer also includes `ensureProfileForUser()` as a safety net.

## Snapshot Mapping Layer

File:

- `lib/app-data.ts`

Purpose:

- map Supabase rows into frontend-facing `Destination`, `Place`, `SourceArtifact`, and `UserProfileSummary` objects

Important behavior:

- joins recent `import_jobs` status and error messages into `sourceArtifacts`
- exposes `plannerNotes` from `profiles.planner_notes`
- still falls back to demo trips because the live trip query layer is not complete yet

## Row-Level Security

RLS is enabled for all key public tables.

Pattern:

- users can only act on rows where `auth.uid() = user_id`
- deeper tables like `trip_days` and `trip_stops` also verify ownership through parent rows

Special case:

- `audit_events` only explicitly defines owner-readable select access

## Demo Data Caveats

`lib/data.ts` is useful to understand intended UX and product language, but it is not an exact mirror of the SQL model.

Examples:

- demo trip statuses do not fully match SQL trip statuses
- demo places include properties that are presentation-oriented rather than query-oriented
- demo platform connections and audit events are sample UI content

## Data Migration Priority If Making The Product Fully Live

1. align `lib/domain.ts` with SQL status enums
2. replace demo data reads with Supabase queries
3. add a real query layer for dashboard aggregates
4. add search indexes or a search service
5. separate sync jobs from request-response imports
