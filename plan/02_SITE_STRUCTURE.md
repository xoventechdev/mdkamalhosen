# 02 — Site Structure

All routes use the Next.js App Router. Routes wrapped in `(site)` share the public layout
(nav, footer, theme toggle). Routes in `(admin)` share the auth-gated admin layout.

## Public routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | Static + ISR | Hero, proof bar, 3 featured projects, latest 3 blog posts, CTA |
| `/about` | ISR | Story, journey timeline (BD → Qatar → KSA → international), philosophy, "how I work", values |
| `/experience` | ISR | Chronological timeline of roles; per-role company, country, dates, achievements |
| `/projects` | ISR | Filterable grid by domain (BMS / Software / IoT / Android); search |
| `/projects/[slug]` | ISR | 7-part case study: Problem → Role → Tech → Challenges → Solution → Outcome → Lessons |
| `/skills` | ISR | Grouped skill matrix: BMS / Programming / IoT / AI tools; each group with level |
| `/blog` | ISR | Blog index. List with cover, title, excerpt, date, reading time, tag |
| `/blog/[slug]` | ISR | Full blog post rendered from Markdown; author, published date, TOC, prev/next |
| `/blog/tag/[tag]` | ISR | Posts filtered by tag |
| `/contact` | Static | Contact form, email, LinkedIn, WhatsApp, availability badge, Relocate: yes |
| `/cv` | ISR | Web version of CV; "Download PDF" button (file from `public/cv/`) |
| `/sitemap.xml` | dynamic | Generated on demand |
| `/robots.txt` | static | Allow all, sitemap reference |

## Admin routes (`/admin/*`)

Under `(admin)` layout with sidebar. Auth gate: middleware redirect to `/admin/login` when
session missing or email ≠ `ADMIN_EMAIL`.

| Route | Purpose |
| --- | --- |
| `/admin/login` | Email/password sign-in (Supabase Auth) |
| `/admin` | Dashboard: counts, recent edits, unread messages, quick links |
| `/admin/profile` | Edit name, role, location, summary, contact links, availability |
| `/admin/experience` | CRUD for work history; reorder; points (bullets) editor |
| `/admin/education` | CRUD for education |
| `/admin/certifications` | CRUD for certifications |
| `/admin/projects` | CRUD for projects; image upload; markdown body optional; slug auto from title |
| `/admin/skills` | CRUD for skill groups + items |
| `/admin/blog` | CRUD for blog posts; Markdown editor + live preview; tags; draft/published |
| `/admin/blog/[id]/editor` | Full-page post editor with autosave |
| `/admin/messages` | Inbox for public contact form submissions; mark read; archive |
| `/admin/settings` | Update revalidation secret, SMTP, optional site prefs |

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/contact` | POST | Public contact form → insert into `messages` + optional SMTP forward |
| `/api/revalidate` | POST/GET | On-demand ISR refresh after admin edit; protected by `REVALIDATE_SECRET` |
| `/api/auth/callback` | GET | Supabase auth callback (if not using pure SSR cookie flow) |

## Section map per public page

### Home (`/`)

1. Hero — name, role, one-line positioning, CTA (View projects / Download CV).
2. Proof bar — 5+ yrs · KAFD · Niagara 4 certified · 100K+ downloads · Relocate: yes.
3. "I do two things" section — BMS cards + Software cards side by side.
4. Featured projects — 3 cards with image + title + 1-line outcome.
5. Latest from the blog — 3 most recent published posts.
6. "How I work" — AI-integrated workflow (Planning → Documentation → Coding → Troubleshooting).
7. CTA band — Download CV + Contact.

### About (`/about`)

1. Hero — short intro paragraph (CV-aligned).
2. Timeline — Bangladesh → Hassanesco (2019) → Stark Security Qatar (2020–2025) → GLSAN Riyadh
   (2025–) → future: international smart building consultant.
3. Mission statement (verbatim from `01_PROFILE.md`).
4. Philosophy ("I build software to solve engineering problems") + examples.
5. Values — short list, action-verb phrased.
6. Headshot (optional).

### Experience (`/experience`)

Vertical timeline. Per role:

- Company · Country ·dates
- 3–6 achievement bullets (action verb + outcome)
- Stack badges (Niagara 4, BACnet, Modbus, ...)
- Marquee project callout if applicable (e.g., KAFD on the GLSAN row)

### Projects (`/projects`)

Filter chips: All · BMS · Software · IoT · Android. Search box. Grid of cards:

- Cover image (16:10)
- Title, one-line problem, category badge
- Outcome metric (e.g., "100K+ downloads", "KAFD district")
- hover → reveals "Read case study"

### Project detail (`/projects/[slug]`)

7-part layout in this exact order (from `04_PROJECTS.md`):

1. Header — title, category, year, client type (anonymized), links (live/github/pdf).
2. Problem
3. My role
4. Technology stack (badges)
5. Challenges
6. Solution
7. Outcome (with metrics / screenshots)
8. Lessons learned
9. Image gallery (Supabase Storage, anonymized)
10. Prev / next project (by sort order)

### Skills (`/skills`)

Grouped matrix — BMS / Programming / IoT / AI Tools / Networking. Each row:

- Skill name
- Years of use (optional)
- Notable platform (e.g., Span for Honeywell Alerton)
- Level shown as a quiet progress bar or dots (1–5)

### Blog (`/blog`)

Simple index. Per post card:

- Cover (16:9)
- Title, tag, date, reading time
- Excerpt (first ~160 chars)
- Author line — Md Kamal Hosen

### Blog post (`/blog/[slug]`)

- Hero: cover, title, date, reading time, tags
- TOC generated from H2s (sticky on desktop)
- Body rendered from Markdown (with code highlighting, tables, callouts)
- Author box at the end (consistent Person schema)
- Prev / next by publishedAt
- JSON-LD `Article`

### Contact (`/contact`)

- Form: name, email, message → `messages` table + SMTP forward to
  `CONTACT_TO_EMAIL`.
- Right column: email, LinkedIn, WhatsApp, phone, country, availability badge.
- Submit confirmation + inline validation (Zod).

### CV (`/cv`)

Mirror of the CV with:

- Hero: name, role, location, contact line.
- Summary (from `profile.summary`).
- Experience (same data as `/experience`, dense format).
- Education, certifications, skills (compact).
- Download PDF button — links to a file in `public/cv/kamal-hosen-cv.pdf`.

## Navigation

Top nav (site): Home · About · Experience · Projects · Skills · Blog · Contact.
Persistent "Download CV" button on the right (desktop).
On mobile: hamburger → full-screen menu.
Footer: name, copyright, nav duplicates, LinkedIn/GitHub/Email icons, back-to-top.

## What intentionally does NOT have a route

- No `/portfolio` (it's the whole site).
- No `/portfolio/<image>` photo dump — projects carry images.
- No `/login` outside `/admin/login`.
- No `/tags` top-level — only under `/blog/tag`.