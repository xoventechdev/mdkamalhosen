# 10 — Roadmap

Phased delivery. Each phase ends in a verifiable state. Phase 0 is in progress.

Legend: `[ ]` pending · `[~]` in progress · `[x]` done.

---

## Phase 0 — Scaffold + design tokens + schema — [~]

Goal: a runnable Next.js project, design system tokens, Prisma schema for every entity,
env-template file, git repo with sensible ignore.

- [~] `package.json` with all needed deps
- [~] `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- [~] `.gitignore`, `.env.example`, `next-env.d.ts`, `.eslintrc.json`, `.prettierrc.json`, `README.md`
- [ ] `src/styles/globals.css` with light + dark CSS variables (per `03_DESIGN_SYSTEM.md`)
- [ ] `src/app/layout.tsx` root layout (fonts, theme provider, analytics)
- [ ] `src/app/page.tsx` placeholder
- [ ] `prisma/schema.prisma` — all entities (profile, experiences, education, certifications,
      skills + skill_groups, projects, blog_posts + blog_tags + join, messages, activity_log)
- [ ] `prisma/seed.ts` — loads content per `05_CONTENT_MAPPING.md` (idempotent upserts)
- [ ] `src/lib/prisma.ts` — singleton Prisma client (server-only)
- [ ] `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts` (anom client + SSR cookies)
- [ ] `src/lib/utils.ts` (`cn`, slugify, formatDate, reading-time)
- [ ] `src/middleware.ts` — admin auth gate per `07_ADMIN_PANEL.md`
- [ ] Public placeholders for every route (home, about, experience, projects, [slug],
      skills, blog, blog/[slug], blog/tag/[tag], contact, cv, 404)
- [ ] `git init` + first commit (no env file committed)

**Verify:** `npm install && npm run prisma:generate && npm run typecheck && npm run dev`
starts on `localhost:3000` with a styled placeholder home page; `npm run lint` is clean.

---

## Phase 1 — Public pages reading from DB — [ ]

Goal: every public route visualized with real data from Supabase (or seeded data).

- [ ] Theme toggle (next-themes) wired in layout
- [ ] `<SiteHeader>`, `<SiteFooter>`, `<SiteNav>`, theme toggle, mobile menu
- [ ] Home page: hero, proof bar, "two things", featured projects, latest blog, how I work, CTA
- [ ] About page: story, timeline, mission, philosophy, values
- [ ] Experience page: chronological timeline (anonymized but CV-aligned)
- [ ] Skills page: grouped matrix with level indicators
- [ ] Contact page: form (RHF + Zod) + contact column + availability badge
- [ ] Public /cv page + download button (file from `public/cv/`)
- [ ] Data-access layer: `src/server/queries.ts` with cached query functions per entity

**Verify:** With `.env.local` filled and `npm run seed` done, every public page renders real
content; toggling theme persists; Lighthouse mobile Performance ≥ 90 on home (target hit
in Phase 4).

---

## Phase 2 — Projects + Blog (public) — [ ]

- [ ] `/projects` filterable grid (chips + search + pagination)
- [ ] `/projects/[slug]` 7-part case study layout (Problem → Role → Tech → Challenges →
      Solution → Outcome → Lessons) + gallery + prev/next
- [ ] `/blog` index (cards, tag filter, pagination)
- [ ] `/blog/[slug]` post layout (cover, TOC sticky, prose, prev/next, author box)
- [ ] `/blog/tag/[tag]` tag page with clean empty state
- [ ] Markdown server rendering pipeline (`remark-gfm` + `rehype-*`), code highlighting
      themes per theme mode

**Verify:** All routes render real data; markdown tables/code render; sitemap picks up
projects + posts; JSON-LD `Article` validates at schema.org.

---

## Phase 3 — Admin panel — [ ]

- [ ] `/admin/login` (Supabase Auth email/password)
- [ ] Middleware auth gate (session + email allow-list)
- [ ] `(admin)/layout.tsx` with sidebar
- [ ] Dashboard `/admin`
- [ ] Profile CRUD (singleton)
- [ ] Experience CRUD + bullets + stack + marquee + reorder
- [ ] Education CRUD
- [ ] Certifications CRUD
- [ ] Skills CRUD (groups + items, level slider)
- [ ] Projects CRUD + image uploads + gallery + 7-part fields + featured + status
- [ ] Blog list `/admin/blog`
- [ ] Blog full-page editor `/admin/blog/[id]/editor` (Markdown + live preview + autosave +
      tags + cover upload + publish/unpublish)
- [ ] Messages inbox + mark read + archive
- [ ] Settings (`/admin/settings`) with "Revalidate everything" button
- [ ] `/api/revalidate` protected route + wired after every save
- [ ] `/api/contact` route + `messages` insert + optional SMTP
- [ ] `X-Robots-Tag: noindex` on `/admin/*`

**Verify:** Log in with `mdkamalhosennn@gmail.com`; create a draft project, publish, see it
appear on `/projects` within seconds; edit a blog draft, publish, see it on `/blog`;
delete something and confirm it's gone from the public site.

---

## Phase 4 — SEO, performance, a11y, polish — [ ]

- [ ] Per-route `metadata` + `generateMetadata`
- [ ] JSON-LD: `Person`, `WebSite`, `Article`, `CreativeWork`, `BreadcrumbList`
- [ ] `/api/og?slug=...` Edge OG images (home, project, blog)
- [ ] `sitemap.ts`, `robots.ts`
- [ ] Security headers via `next.config.ts`
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] Skip-to-content link, focus rings, keyboard nav tested
- [ ] Lighthouse mobile ≥ 95 on home, about, projects, blog, project detail, post
- [ ] axe DevTools run on every route type — 0 critical
- [ ] CV PDF placed at `public/cv/kamal-hosen-cv.pdf`
- [ ] Vercel Analytics installed

**Verify:** Lighthouse sweep passes; OWASP ZAP passive scan shows 0 high; manual keyboard
navigation covers every primary user journey.

---

## Phase 5 — Deploy + handoff — [ ]

- [ ] Push repo to GitHub (owner creates repo)
- [ ] Vercel import + connect Supabase env vars
- [ ] Run `prisma db push` against prod DB (or via build script)
- [ ] Run `npm run seed` against prod DB
- [ ] Apply RLS SQL via Supabase dashboard (see `09_SECURITY_PRIVACY.md`)
- [ ] Create first admin user in Supabase Auth (`mdkamalhosennn@gmail.com`)
- [ ] Verify login + cycle of create-publish-revalidate works in production
- [ ] Optional: custom domain connected (after GitHub publish per owner)
- [ ] Handoff doc: `plan/` + `README.md` + a short "how to edit" guide committed to repo

**Verify:** Public production site mirrors local; admin works; one round-trip edit + publish
succeeds end-to-end.

---

## Optional later / enhancements

- AI chat widget on home (RAG over published projects + blog posts + profile; Supabase
  pgvector if desired). Demonstrates AI-integrated engineering workflow from `08_FAQ.md`.
- "Is Kamal a fit?" matrix on home/auto-evaluated against a posted job spec (paste-a-JD
  mini tool).
- Reading time per project case study.
- Plausible or Vercel Toolbar for the owner to view analytics.
- Newsletter via Resend Audiences (only if you actually plan to send).
- Multi-language (EN + AR) — relevant for GCC market and demonstrates i18n skill.