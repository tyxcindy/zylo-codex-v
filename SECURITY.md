# Zylo Security Checklist

## April 2026 Vercel Incident Response

- Vercel disclosed this incident on April 20, 2026. Their bulletin says a limited subset of customers had non-sensitive environment variables exposed and recommends rotating non-sensitive secrets, reviewing activity logs, checking deployments, using Sensitive Variables, enabling 2FA, and revoking the compromised Google OAuth app if present.
- For this repo, rotate these first if they exist in Vercel:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `GOOGLE_MAPS_API_KEY`
  - `UNSPLASH_ACCESS_KEY`
  - `UNSPLASH_SECRET_KEY`
  - `RESEND_API_KEY`
- Review these, but do not treat them as the first emergency rotation target:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL`
- This workspace is linked to Vercel project `zylo_v1.0` via `.vercel/project.json`.
- Add every non-public secret in Vercel as a **Sensitive Variable** instead of a plain environment variable.
- Review Vercel project activity and deployments for anything you do not recognize, then delete suspicious deployments and rotate any tokens tied to them.
- Check Google account or Workspace access for the IOC OAuth app ID:
  - `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com`
- Rotate Deployment Protection bypass secrets if they were enabled.
- Enable or verify Vercel 2FA on the account that owns this project.
- Run `npm run security:vercel-incident` from this repo for the current local inventory and follow-up checklist.

## In Code Now

- Supabase SSR auth clients keep service-role credentials server-only.
- Protected app routes redirect unauthenticated visitors to `/sign-in`.
- App API endpoints derive the acting user from the session, not the request body.
- Rate limiting is applied to:
  - sign in
  - sign up
  - password reset
  - password update
  - imports
  - place state updates
  - trip creation
  - AI generation
- User input is schema-validated and sanitized before:
  - auth actions
  - import requests
  - AI prompts
  - trip creation
  - place state updates
- Public URL imports reject localhost and private-network targets.
- Security headers are enforced in middleware, including CSP, HSTS, and frame protections.
- Audit-event hooks are in place for auth, security, import, AI, and API activity.
- Row-Level Security SQL policies are defined in `db/migrations/001_zylo_public_beta.sql`.

## Required Supabase Dashboard Settings

- Enable **Confirm email** for email/password auth.
- Keep JWT expiry short. The default is already short-lived; prefer 1 hour or less.
- Configure the site URL and redirect URLs for:
  - `/auth/confirm`
  - `/dashboard`
  - `/update-password`
- Apply the SQL migration in `db/migrations/001_zylo_public_beta.sql`.
- Use a valid browser-safe Supabase public key in the app:
  - prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - fallback legacy support exists for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - never expose the service-role key to the client
- Review Auth rate limits and CAPTCHA/bot protection settings.
- If CAPTCHA is enabled in Supabase Auth, Zylo signup will fail until CAPTCHA token collection is implemented. For the current beta build, keep Auth CAPTCHA off.

## Session Notes

- Password hashing is handled by Supabase Auth.
- Password reset and verification links are handled by Supabase Auth and should stay enabled.
- True server-enforced session time-box / inactivity timeouts may require higher-tier Auth settings depending on your Supabase plan. For the free setup, Zylo currently relies on Supabase’s normal token/session model plus protected server checks on every request.

## Email Notes

- Supabase Auth can send verification and reset emails directly.
- For production-grade branded email, configure custom SMTP in Supabase.
- Resend is available in the project for future transactional mail, but Supabase Auth emails still depend on Supabase Auth email delivery or SMTP configuration.

## Deployment Notes

- Deploy only over HTTPS.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `UNSPLASH_ACCESS_KEY`, `UNSPLASH_SECRET_KEY`, and `RESEND_API_KEY` server-only.
- Do not expose database service credentials to client bundles.
- Do not allow direct public database access outside Supabase’s managed APIs and RLS rules.
