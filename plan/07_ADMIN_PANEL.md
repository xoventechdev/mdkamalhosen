# 07 — Admin Panel

Locked-down production CMS for the owner. Single Supabase Auth account (`ADMIN_EMAIL`).
Full CRUD over every content entity from the browser, with on-demand ISR so public pages
update within seconds.

## Auth flow

1. Owner visits `/admin/login`.
2. Enters email + password. Supabase Auth issues a session cookie via `@supabase/ssr`.
3. Middleware (`src/middleware.ts`) checks:
   - session exists, **and**
   - `session.user.email === env.ADMIN_EMAIL`.
   If either fails on any `/admin/*` route except `/admin/login`, redirect to `/admin/login`.
4. Logout clears the cookie.

This is a single-user system — no roles table, no invite flow, no password reset UI (use
the Supabase dashboard if you ever need a reset, which you won't).

## Layout

`/admin/*` uses a separate layout (`(admin)/layout.tsx`) — no public nav, no hero. Sidebar
with:

- Dashboard
- Profile
- Experience
- Education
- Certifications
- Projects
- Skills
- Blog (list)
- Messages (with unread count)
- Settings (revalidate secret, SMTP, etc.)
- "View public site" link
- Sign out

Top bar on mobile collapses the sidebar.

## Dashboard (`/admin`)

Cards: total projects, published blog posts, drafts, unread messages, last edit timestamp.
Quick buttons: "New project", "New blog post". Recent activity table (last 10 rows from
`activity_log`, if enabled).

## CRUD screens — shared UX

Every list screen has the same shape:

- Header + "New" button.
- Table / cards list (title, subtitle, status chip, edit/delete actions).
- Sortable via `sort_order` (drag-and-drop optional later; "move up/down" buttons MVP).

Every edit screen:

- Left column: form fields (React Hook Form + Zod).
- Right column (on wide screens): live preview (read-only render of the entity as it would
  appear on the public site) — handy for projects and blog posts.
- Bottom: Save / Delete buttons. Delete asks for confirmation.
- All mutations are Server Actions. Success → toast + revalidate path.

## Per-entity notes

### Profile
One row only. Edit form shows every column from `profile`. Save calls revalidate `/`, `/about`,
`/contact`, `/cv`. Enforces singleton (id=1 always).

### Experience
List sorted by `sort_order`. Edit form has dynamic bullet list (add/remove rows); stack
chips (tokens input); date pickers with "Currently here" checkbox to null `end_date` and
set `current=true`. Marquee project is optional text.

### Education + Certifications
Same pattern. Certifications allow optional `credential_url` linking to the issuer's
verification page (great for recruiters).

### Skills
Two-level editor: skill groups ordered, each with items ordered. Inline edit, level slider
1–5, years optional.

### Projects
Full form:

- Title, slug (auto, editable), category (enum buttons), year.
- Cover upload (Supabase Storage → `project-covers` bucket).
- Excerpt (used on cards).
- The 7 parts as Markdown textareas (`problem`, `role`, `tech_stack` as chips, `challenges`,
  `solution`, `outcome`, `lessons`).
  - **Rationale:** Markdown lets you put bullet lists in challenges and outcome (e.g., a
    metric line + a list). Plain text was too restrictive.
- Gallery: multi-image upload, drag to reorder, delete.
- Links JSON: live URL, github URL, pdf URL (all optional).
- Featured checkbox (only 3 shown on home, UI warns if >3 featured).
- Status: draft / published (drafts hidden from public).
- SEO: meta_description (optional; falls back to excerpt).

Admin form order mirrors the public project detail section order so your editing mental model
matches what the reader sees.

### Blog
List: cover thumb, title, tags, status chip, published date, edit link.
New post lands on `/admin/blog/[id]/editor` (full-page markdown editor — see `06_BLOG.md`).
Before any row exists in DB for a "New post" click, create a draft row server-side and
redirect to its editor — so autosave always has an id.

### Messages
Inbox: table of submissions; click a row opens a drawer with full message + reply-by-email
link (`mailto:` prefilled or SMTP send via a "Reply" action). Mark read/unread; archive;
delete. Rough spam guard: honeypot field on public form + rate limit by IP (Vercel
middleware).

### Settings
- Revalidation secret (read-only display; change via `.env` only).
- SMTP test button.
- "Revalidate everything" button — calls `/api/revalidate` with `?path=*`.

## Image uploads

- Bucket `project-covers`, `project-gallery`, `blog-covers`, `avatar`.
- Admin POSTs file → route handler validates MIME + size (≤2MB) → uploads to Supabase
  Storage with `cacheControl: 3600` → returns the public URL → admin stores URL in DB row.
- The public site reads via `next/image` from `https://*.supabase.co`.
- Owner must anonymize BMS screenshots (blur tag names, project addresses) before upload —
  documented in the admin UI helper text and in `09_CONTENT_RULES.md`.

## Revalidation flow

```
admin save (Server Action)
  → prisma write
  → fetch /api/revalidate?secret=...&tag=<entity>&path=<list>
  → on success: toast "Saved and published"
  → on failure: toast "Saved; refresh failing — revalidate by hand" (data is still correct in DB)
```

`/api/revalidate` is a Route Handler protected by `REVALIDATE_SECRET`. It calls
`revalidatePath` / `revalidateTag` and returns `{ revalidated: true }`.

Public reads happen with ISR (revalidate 60s) as a fallback; the admin save just makes it
happen immediately instead of waiting for the next request after 60s.

## Security

- All writes go through Server Actions guarded by middleware auth check + email allow-list.
- DB-side RLS still requires `auth.uid() is not null` — defense in depth.
- Service role key used only in route handlers / Server Actions, never imported by client
  components, never prefixed with `NEXT_PUBLIC_`.
- `<meta x-robots-tag: noindex>` on `/admin/*` (and middleware sets header) so admin pages
  never appear in Google.
- Rate-limit `/admin/login` (5 attempts / 15 min per IP) using an in-memory Map (single
  instance) or Vercel KV if needed later.
- All admin forms behind `X-Frame-Options: DENY` and a basic CSP via `next.config.ts`
  headers.

## Accessibility of admin

Even though it's a single-user tool, the admin uses the same shadcn primitives so it stays
keyboard-navigable and screen-reader friendly. Forms have proper labels, errors are
announced, focus moves to the top-most error on submit failure.

## What the admin explicitly does NOT have

- No public sign-up. Ever.
- No role hierarchy. Single user only.
- No live collaboration features. One writer at a time.
- No undo for deletes (soft-delete column optional — recommended for projects and posts;
  otherwise the activity log retains a snapshot for 30 days via Supabase backups).