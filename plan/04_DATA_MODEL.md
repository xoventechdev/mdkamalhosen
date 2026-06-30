# 04 — Data Model

Single Supabase Postgres database, accessed via Prisma 6. Every table is **public read**
(unless flagged) and **write-restricted** to the single admin user via Supabase Row-Level
Security (RLS). On-demand ISR revalidation runs after each admin save so the public site
reflects changes within seconds.

## Entity relationship summary

```
profile (1)              ── single-row owner info
experiences (many)       ── career timeline
education (many)
certifications (many)
skills (group 1 ── many items)
projects (many) ─┬─ many  project_images (attachments)
                └─ tags  implicit via category enum
blog_posts (many) ─┬─ many blog_tags (M2M via join table)
                   └─ one cover image
messages (many)         ── public contact form inbox
activity_log (many)     ── admin audit trail (optional)
```

## Prisma schema (canonical)

Lives at `prisma/schema.prisma`. Field names use snake_case in DB (mapped), camelCase in
TypeScript for ergonomic admin code.

### Tables

#### profile
| Column | Type | Notes |
| --- | --- | --- |
| id | int pk | singleton row (id = 1) |
| name | text | "Md Kamal Hosen" |
| role | text | "Building Management System Engineer" |
| tagline | text | one-line positioning |
| location | text | "Riyadh, Saudi Arabia" |
| relocate | bool | true |
| email | text | mdkamalhosennn@gmail.com |
| phone | text | optional |
| linkedin_url | text | |
| github_url | text | optional |
| whatsapp | text | optional |
| summary | text | CV "professional summary" |
| mission | text | from `01_PROFILE.md` |
| philosophy | text | from `05_SOFTWARE.md` |
| values | text[] | short strings, action-verb phrased |
| availability | text | enum: open / closed / limited |
| avatar_url | text | Supabase Storage |
| cv_pdf_url | text | link or copy in public/cv/ |

#### experiences
| Column | Type | Notes |
| --- | --- | --- |
| id | int pk | |
| company | text | GLSAN, Stark Security, Hassanesco, ... |
| role | text | BMS Engineer, BMS Testing & Commissioning Engineer, BMS Operator, BMS Technician |
| country | text | Saudi Arabia, Qatar, Bangladesh |
| city | text | Riyadh, Doha |
| start_date | date |  |
| end_date | date nullable | null = present |
| current | bool | true for active role |
| bullets | text[] | achievement lines, action verbs |
| stack | text[] | platform names (Niagara 4, BACnet, ...) |
| marquee_project | text | optional callout (e.g., "KAFD") |
| sort_order | int | manual order in timeline |

#### education
| Column | Type | Notes |
| --- | --- | --- |
| id | int pk | |
| degree | text | "Bachelor of Arts", "Diploma in Electrical Engineering" |
| institution | text | "Bangladesh Open University", "Bangladesh Youth Technical Training" |
| start_year | int | |
| end_year | int nullable | null = ongoing |
| status | text | ongoing / completed |
| sort_order | int | |

#### certifications
| Column | Type | Notes |
| --- | --- | --- |
| id | int pk | |
| name | text | "Niagara 4 BACnet Driver" |
| issuer | text | "Tridium University", "Honeywell Buildings University" |
| year | int | |
| credential_url | text nullable | |
| sort_order | int | |

#### skill_groups + skills
| Table | Columns |
| --- | --- |
| skill_groups | id, name (BMS / Programming / IoT / AI Tools / Networking), sort_order |
| skills | id, group_id fk, name, platform (nullable, e.g., "Honeywell Alerton"), years (int nullable), level (1–5 int), sort_order |

#### projects
| Column | Type | Notes |
| --- | --- | --- |
| id | int pk | |
| slug | text unique | generated from title; editable |
| title | text | |
| category | text | enum: bms / software / iot / android |
| year | int | |
| client_type | text | "Commercial Buildings", "Personal project", "Google Play" |
| excerpt | text | one line shown on cards |
| cover_url | text nullable | |
| problem | text | |
| role | text | "Lead Commissioning Engineer" |
| tech_stack | text[] | badges |
| challenges | text | |
| solution | text | |
| outcome | text | with metrics |
| lessons | text | |
| gallery_image_urls | text[] | anonymized |
| links | jsonb | {live?, github?, pdf?} |
| featured | bool | 3 featured shown on home |
| status | text | enum: published / draft |
| sort_order | int | |
| created_at, updated_at | timestamp | |

#### blog_posts + blog_tags (M2M)
| Table | Columns |
| --- | --- |
| blog_posts | id, slug unique, title, excerpt, cover_url, body_md (Markdown text), status (draft/published), published_at, reading_minutes (int, computed on save), created_at, updated_at, author_id (always profile.id = 1), meta_description |
| blog_tags | id, name unique, slug unique |
| _BlogPostsToBlogTags | join table (A = post_id, B = tag_id) |

Stored as Markdown in `body_md` text column — not MDX files — so the owner can edit posts
from the admin panel in production without committing code.

#### messages
| Column | Type | Notes |
| --- | --- | --- |
| id | int pk | |
| name | text | |
| email | text | |
| subject | text nullable | |
| message | text | |
| ip | text nullable | optional, GDPR-min |
| read_at | timestamp nullable | admin marks read |
| archived | bool | |
| created_at | timestamp | |

#### activity_log (optional audit)
| Column | Type |
| --- | --- |
| id | int pk |
| user_email | text (must equal ADMIN_EMAIL) |
| action | text (created / updated / deleted) |
| entity | text |
| entity_id | int nullable |
| meta | jsonb |
| created_at | timestamp |

## Row-Level Security (RLS)

Apply on Supabase directly for safety (Prisma uses service role which bypasses RLS for admin
server routes; the public read client uses anon key which RLS still enforces).

### Pattern (per table)

```sql
alter table public.projects enable row level security;

create policy "public read published projects"
  on public.projects for select
  using (status = 'published');

create policy "admin write projects"
  on public.projects for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
```

Draft blog posts and draft projects must not be visible to the anon client.

### Admin identification

Standard identity-based RLS uses `auth.uid()`. To restrict to a single account, also enforce
in application middleware: any write request must come from a session whose
`session.user.email === ADMIN_EMAIL`. This dual check (DB RLS + App middleware) is defense in
depth; either alone is insufficient.

## Reading strategy (public site)

- Server Components fetch via Prisma on each render, cached with Next.js `unstable_cache`
  wrapped around query functions, tagged by entity (e.g., `projects`, `blog`).
- Default revalidate: 60 seconds (ISR).
- On admin save: call `revalidatePath('/projects')` (or `/blog`, etc.) + `revalidateTag`.

## Writing strategy (admin)

- All admin writes happen server-side through route handlers or Server Actions that run as
  the service-role Prisma client.
- After every successful mutation, schedule a revalidation by calling
  `/api/revalidate?secret=...&path=...&tag=...`.
- Insert/update timestamps maintained in Prisma middleware.

## Migrations approach

- Dev: `prisma db push` (schema sync without migration history — fine for solo portfolio).
- Production: keep `prisma/migrations/` once stable; run `prisma migrate deploy` on Vercel
  build only if schema changed (guarded by `prisma migrate diff --exit-code`).

## Seed strategy

A `prisma/seed.ts` script loads initial rows from `ai-context/*.md` + the extracted CV data
and writes them through Prisma. Re-runnable, idempotent (uses `upsert` keyed on natural keys
like slug / company+role). See `05_CONTENT_MAPPING.md`.

## Backups

- Supabase free tier takes daily backups retained 7 days. Enough for a portfolio.
- Owner can export full data via `pg_dump` or Prisma Studio JSON export monthly.