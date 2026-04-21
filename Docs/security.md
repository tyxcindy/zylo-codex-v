# Security

## Security Posture Summary

Zylo already has a stronger beta security posture than a typical demo app. The main protections are implemented in code and in the SQL migration.

Main protections in place:

- Supabase SSR auth and protected routes
- session-derived user ownership
- input validation and sanitization
- rate limiting
- unsafe URL rejection for imports
- security headers in middleware
- row-level security policies
- non-blocking audit logging

## Authentication

Files:

- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`
- `lib/auth.ts`
- `app/sign-in/actions.ts`
- `app/forgot-password/actions.ts`
- `app/update-password/actions.ts`
- `app/auth/confirm/route.ts`

Key facts:

- Protected pages require a real session.
- Protected API routes derive the acting user from Supabase, not the client body.
- Email confirmation and recovery flows are supported.
- Password strength rules are enforced with Zod.

## Middleware Protections

File:

- `middleware.ts`

Behavior:

- refresh Supabase session cookies
- redirect anonymous users off protected routes
- redirect signed-in users away from auth pages
- add strict security headers
- force `Cache-Control: no-store` on API responses

Headers set:

- Content-Security-Policy
- Referrer-Policy
- X-Content-Type-Options
- X-Frame-Options
- Permissions-Policy
- Strict-Transport-Security

## Input Validation

File:

- `lib/validation.ts`

Examples:

- imports require minimum content length
- private or localhost URLs are rejected
- trips require valid destination IDs and bounded traveler counts
- AI and generation prompts are length-limited
- passwords must be at least 12 chars with uppercase, lowercase, and number

## Sanitization

File:

- `lib/security.ts`

`sanitizePlainText()`:

- removes control characters
- strips angle brackets
- trims whitespace

This is basic but useful input hardening.

## Rate Limiting

File:

- `lib/security.ts`

Applied to:

- sign in
- sign up
- password reset
- password update
- imports
- place state updates
- trip creation
- AI generation
- AI chat

Important limitation:

- implemented as an in-memory `Map`
- resets on process restart
- not shared across server instances

This is acceptable for early beta protection but not enough for high-scale or multi-instance enforcement.

## Ownership And Access Control

Files:

- `lib/auth.ts`
- SQL RLS policies in `db/migrations/001_zylo_public_beta.sql`

Model:

- page and API access require current session user
- queries are filtered by `user_id`
- database tables also enforce ownership through RLS

This is the right direction because the app does not rely only on frontend route hiding.

## Audit Logging

File:

- `lib/audit.ts`

Events cover:

- auth
- import
- security
- ai
- api

Important implementation detail:

- audit failures do not block user flows

That is pragmatic for availability, but it also means silent logging failures are possible if the admin client is misconfigured.

## SQL Security Highlights

The migration:

- enables `pgcrypto`
- defines `set_updated_at()` triggers
- creates a `handle_new_user()` trigger
- enables RLS on all key tables
- creates owner policies for major entities

Good patterns:

- ownership checks are enforced close to the data
- child tables like `trip_days` and `trip_stops` verify parent ownership

## Email And Recovery Considerations

Current posture:

- Supabase handles verification and recovery links
- custom branded production email is not fully built out yet
- Resend is present for future expansion, but Supabase remains central for auth emails

## Known Security Gaps

### 1. In-memory rate limiting

Problem:

- easy to evade across instances
- state disappears on restart

Better future approach:

- Redis or other centralized store

### 2. Dual auth implementation paths

Problem:

- both server actions and client-side Supabase auth form handlers exist
- this increases maintenance surface and the risk of drift

### 3. CSP is permissive in places

Current CSP includes:

- `'unsafe-inline'`
- `'unsafe-eval'`

That is often necessary during early product phases, but it should be tightened when practical.

### 4. Image import is not yet a hardened upload pipeline

The current UI treats image imports as text/OCR description entry, which is safer than fake uploads, but the real future upload system still needs:

- storage policy design
- size limits
- MIME validation
- signed upload flow
- virus/malware considerations if accepting user files

### 5. Provider health is not deeply monitored

The settings screen only checks whether environment variables exist. It does not verify:

- quota
- scopes
- upstream outages

## Deployment Security Checklist

1. Use HTTPS only.
2. Keep all secret keys server-side.
3. Apply the SQL migration.
4. Verify Supabase redirect URLs.
5. Keep Auth CAPTCHA off until token handling exists.
6. Verify service-role key is never exposed to the browser.
7. Replace in-memory rate limiting before serious scale.
8. Add centralized logging and alerting around provider failures.

## Security Review Priority Order

If performing a hardening pass, do it in this order:

1. centralize rate limiting
2. unify auth submission path
3. tighten CSP where possible
4. implement real upload pipeline
5. add deeper provider health checks and alerting

