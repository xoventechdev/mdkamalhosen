# 09 — Security & Privacy

The site is the digital identity of a real engineer. Two interests are protected:

1. **The owner** — no leaked keys, no unauthorized admin access, no leaked private data.
2. **Past employers / clients** — no confidential employer data, network architecture,
   controller passwords, or private source code ever published.

## Secrets

- All secrets live in `.env.local` (dev) and Vercel environment variables (prod). Never in
  the repo, never in client bundles.
- `.env.example` documents every var but holds only placeholders. Already created.
- Supabase **service role key** is server-only, imported exclusively from route handlers and
  Server Actions via `@/lib/supabase/server`. Cannot be bundled into client.
- `NEXT_PUBLIC_*` only on the Supabase URL + anon key (safe by design; RLS still enforced).
- A pre-commit hook (`husky` optional) scans via `git-secrets` or manual check; at minimum
  `.gitignore` covers `.env*` (already in place).

## Admin authentication

- Supabase Auth email/password session.
- `src/middleware.ts` runs on every `/admin/*` request:
  - Session missing → redirect `/admin/login`.
  - `session.user.email !== env.ADMIN_EMAIL` → redirect `/admin/login`.
  - `session.user.email === env.ADMIN_EMAIL` → allow through.
- `/admin/*` response header `X-Robots-Tag: noindex, nofollow` (set in middleware) so admin
  never appears in Google.
- Login route rate-limited (5 attempts / 15 min per IP) — in memory Map initially, Vercel KV
  if abuse detected.

## Database RLS

Every table has RLS enabled. Patterns:

- Public content (profile, experiences, education, certifications, skills, published
  projects, published blog posts, blog_tags): `SELECT` policy `using (true)` (or stricter
  for drafts: `status = 'published'`).
- Writes: `USING (auth.uid() IS NOT NULL)` + `WITH CHECK (auth.uid() IS NOT NULL)`.
- `messages` and `activity_log`: NO public SELECT (insert-only for `messages`).

Drift check: `supabase/rls.sql` checked into the repo, applied via `supabase db push` or the
Supabase dashboard. Prisma handles schema; RLS policies are applied separately.

## Content rules (mirrors `ai-context/09_CONTENT_RULES.md`)

The admin UI enforces these as reminders, but ultimate responsibility is the owner's.

Never display on the site:

- Salary, passport, iqama, national ID
- Family information
- Employer confidential data
- Client confidential drawings
- Project addresses (only city/district level is OK — e.g., "King Abdullah Financial
  District" is public knowledge, but a specific tower address is not)
- Controller passwords, network topology, IP schemas
- Private source code of employer/client work

Rules for technical screenshots:

- Blur or crop out tag names, controller passwords, IP addresses.
- Crop to show only the relevant BMS graphic, not the operator's full screen.
- Prefer hand-redrawn block diagrams over raw screenshots.
- Confirm with HR/client if unsure before publishing.

## Image uploads

- Bucket policies: `project-covers`, `project-gallery`, `blog-covers`, `avatar` —
  admin-only write, public read.
- Server route validates MIME (image/webp, image/png, image/jpeg) and size (≤2MB) before
  upload; rejects on mismatch.
- AV-ignored for a portfolio scale; the validation above is enough.

## Contact form

- `name`, `email`, `subject` (optional), `message` fields. Server validates with Zod.
- Honeypot field `website` (hidden) — if filled, silently drop.
- Rate limit per IP (3 / 10 min) — Middleware via Vercel KV or in-memory fallback.
- Insert into `messages` (RLS: anon insert allowed with a policy; no select for anon).
- Optional SMTP forward to `CONTACT_TO_EMAIL` via `nodemailer` (server-only); credentials
  in env. If SMTP not configured, the inbox still receives the submission.

## Privacy (GDPR/UK GDPR friendly)

- No cookies except Supabase auth session (admin area only); public site is cookieless.
- Vercel Analytics in privacy mode — no cross-site tracking, no PII.
- No consent banner required.
- IP (if stored on message submission) is GDPR-min: stored as a 24-bit prefix only for
  rate-limit forensics, deleted after 30 days.
- Public privacy page (`/privacy`) states these facts in plain language.

## Security headers (via next.config.ts)

- HSTS, nosniff, deny frames, strict referrer, permissions policy.
- CSP: `default-src 'self'; img-src 'self' https://*.supabase.co ...; script-src 'self'
  'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline';`
  `connect-src 'self' https://*.supabase.co;` fine-tuned against console errors.

## Backups + disaster recovery

- Supabase free tier: 7 daily backups.
- A weekly manual `pg_dump` via `prisma studio` export or `pg_dump --schema=public` to the
  owner's local disk.
- Repo holds `prisma/schema.prisma` + `prisma/seed.ts` — full DB reconstructable from a
  blank Supabase project in <15 min.

## What we are NOT doing

- No two-factor auth on the admin (single user; password strong; rate-limited; dashboard
  supports enable later if needed).
- No public API surface.
- No third-party trackers.
- No newsletter sign-up (could be added later via Resend Audiences if desired).