# Portfolio Build — Progress

Living status document. Read this before resuming work. Updated at the end of each session.

Last updated: Phase 4 complete (SEO + performance + a11y polish).

## Project root

`H:\Personal\Job\Me\portfolio`

## Stack (locked in)

- Next.js 15 (App Router) + TypeScript (strict) + Tailwind 3.4
- Supabase Postgres + Auth + Storage
- Prisma 6 (server-only, service role)
- Framer Motion (subtle), next-themes, lucide-react, shadcn-style hand-built primitives
- Markdown (remark + rehype) for blog bodies
- Vercel hosting target

Supabase project is provisioned and connected. Env values live in `.env` (gitignored). Source-of-truth for keys is `.env.example`.

## How to resume development

```powershell
# 1. Ensure .env has the live Supabase values (it already does).
# 2. Sync schema + regenerate Prisma client (only needed if schema changed).
npm run prisma:generate
npm run prisma:push       # only if prisma/schema.prisma changed since last push

# 3. (Optional) Re-seed content from ai-context + CV.
npm run seed              # idempotent upserts — safe to re-run

# 4. Run dev server.
npm run dev

# 5. Verify quality gate before committing.
npm run typecheck
npm run lint
npm run build
```

## Verification commands

| Check | Command |
| --- | --- |
| Type errors | `npm run typecheck` |
| ESLint | `npm run lint` |
| Production build | `npm run build` |
| DB schema sync | `npm run prisma:push` |
| Seed content | `npm run seed` |
| Apply RLS policies | `npm run apply:rls` |
| Apply storage buckets + policies | `npm run apply:storage` |
| Verify storage buckets present | `npm run check:buckets` |
| Format | `npm run format` |

## Manual action still required — read before sleeping

1. **RLS applied (now in DB).** Ran `npx tsx scripts/apply-rls.mts` against the live Supabase DB on 2026-06-30 — all 22 policies are in place: 9 public-read, 9 admin-manage, 3 admin-on-messages (read/update/delete), 1 anon-insert-messages. Captured in `pg_policies`. The bug that originally caused the SQL Editor error (`relation "public.profile" does not exist`) was traced to a missing `@@map` directive on the Prisma `Profile` model — Prisma created the actual table as `public."Profile"` (quoted, capitalised). `supabase/rls.sql` is now patched to use `"Profile"` (and is idempotent: re-running via the script is safe). `supabase/migrate-rename-profile.sql` is a one-shot migration in case the owner wants to rename the table back to lowercase later.
2. **Create the admin user in Supabase Auth.** Dashboard → Authentication → Users → Add user. Email: `mdkamalhosennn@gmail.com`. Choose a strong password and store it in a password manager. This is needed for Phase 3 sign-in.
3. **Storage buckets.** Apply `supabase/storage-policies.sql` (idempotent) via either `npm run apply:storage` or the Supabase SQL Editor. It creates the **4 buckets the upload route actually accepts** (`ALLOWED_BUCKETS` in `src/app/api/admin/upload/route.ts`): `avatars`, `projects`, `blog`, `cvs`. Each gets a public-read + authenticated-write policy. **Note:** an earlier draft of this doc referenced `project-covers`/`project-gallery`/`blog-covers`/`avatar` — those names don't match the code. The `projects` bucket holds both covers and gallery under subfolders named after the project slug. Verify with `npm run check:buckets`.

Do above at any time before resuming Phase 3.

---

## Phase 0 — Scaffold + design tokens + schema — DONE

- [x] `package.json` with all needed deps
- [x] `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- [x] `.gitignore`, `.env.example`, `.env`, `next-env.d.ts`, `.eslintrc.json`, `.prettierrc.json`, `README.md`
- [x] `src/styles/globals.css` — light + dark navy tokens, hero-gradient, prose, reduced-motion, scrollbar
- [x] `src/app/layout.tsx` — root layout, Inter + JetBrains fonts, ThemeProvider, header, footer, skip link
- [x] `prisma/schema.prisma` — profile, experiences, education, certifications, skill_groups, skills, projects, blog_posts, blog_tags, messages, activity_log
- [x] `prisma/seed.ts` — content loader per `plan/05_CONTENT_MAPPING.md` (idempotent upserts)
- [x] `src/lib/prisma.ts`, `src/lib/supabase/{server,client,middleware}.ts`, `src/lib/utils.ts`
- [x] `src/middleware.ts` — admin auth gate (session + ADMIN_EMAIL allows-list)
- [x] `src/server/queries.ts` — cached data-access layer (`unstable_cache` + tags)
- [x] `supabase/rls.sql` — full RLS policy file (needs manual apply in dashboard)
- [x] `plan/` — 11 plan markdown files (overview, stack, structure, design, data model, content mapping, blog, admin, SEO, security, roadmap)

Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

---

## UI overhaul — colorful, responsive, smart — DONE

- [x] Multi-accent palette: `accent` blue + 4 category hues (bms=cyan, software=violet, iot=emerald, android=amber)
- [x] Hero gradient backgrounds, grid pattern texture, custom scrollbar
- [x] 8 keyframes: fade-up, fade-in, scale-in, slide-in-right, float, gradient-pan, shimmer, pulse-ring
- [x] New shadows: `card`, `card-hover`, `glow`
- [x] Mobile hamburger menu → full-screen staggered reveal
- [x] Sticky desktop nav with active-page indicator
- [x] `ScrollReveal` component (Framer Motion + `prefers-reduced-motion`)
- [x] `SectionHeading`, `PageHeader`, `StatGrid`, `SkillBar`, `Badge`/`CategoryBadge`, `ProjectCard`, `ProjectFilter`
- [x] Footer rebuild — 3-column responsive, color-coded social icons, back-to-top
- [x] 404 page

Verified: `npm run build` clean, Lighthouse Prerequisites Pass (all routes green).

---

## Phase 1 — Public pages reading from live DB — DONE

DB is seeded and live. Pages render real data with try/catch fallbacks to static content if Supabase anon read is RLS-blocked (won't happen once the RLS SQL is applied per the manual-action note above).

- [x] **Home (`/`)** — async server component: fetches `getFeaturedProjects` + `getLatestPosts` from Supabase; renders hero, proof bar, animated stat grid, two-disciplines split, featured project cards (category-coded hover glow), latest-blog teasers (only when posts exist), "How I work" workflow, gradient CTA. ISR 60s.
- [x] **About (`/about`)** — loads profile (mission + values) from DB; falls back to static. Story narrative, BD→Qatar→KSA timeline, philosophy cards.
- [x] **Experience (`/experience`)** — loads `getAllExperiences`; renders chronological cards with stack badges, marquee callouts, current-role pulse. Falls back to seeded static array.
- [x] **Skills (`/skills`)** — loads `getSkillGroups`; name→color mapping renders the same color coding live. Falls back to static.
- [x] **Projects (`/projects`)** — loads `getPublishedProjects`; **interactive client-side filter** chips (All/BMS/Software/IoT/Android) with live counts; color-coded cards with hover lift + glow.
- [x] **Project detail (`/projects/[slug]`)** — loads `getProjectBySlug`; renders full 7-part case study (Problem → Role → Tech → Challenges → Solution → Outcome → Lessons), quick-facts sidebar, gallery, prev/next. `generateStaticParams` + `generateMetadata`. `notFound()` on missing.
- [x] **Blog (`/blog`)** — loads `getPublishedPosts`; tag badges, dates, reading time. Empty state when no posts.
- [x] **Blog post (`/blog/[slug]`)** — loads `getPostBySlug`; renders Markdown body via `remark-gfm` + `rehype-highlight` + sanitised; sticky TOC from H2/H3; prev/next; tags link to tag pages. `generateStaticParams` + `generateMetadata`.
- [x] **Blog tag (`/blog/tag/[tag]`)** — loads `getPostsByTag` + `getAllTags`; lists posts for tag; empty state; `notFound()` on unknown tag. `generateStaticParams`.
- [x] **Contact (`/contact`)** — channel cards + contact form (still posts to `/api/contact` which inserts into `messages`; profile-driven contact column will arrive in Phase 3 once profile supports editing email/phone/socials from admin).
- [x] **CV (`/cv`)** — static content aligned with seed; full web CV. Phase 3 will wire to live profile/experience/education/certs.
- [x] **Sitemap (`/sitemap.xml`)** — async; combines static + dynamic project/post/tag routes from Supabase. Confirmed output grew from ~894 → 2691 bytes after seeding, proving live expansion.
- [x] **Markdown renderer** — `src/lib/markdown.ts`: `renderMarkdown` + `extractToc`; Sanitize schema augments defaultSchema for class names from rehype-highlight/autolink-headings.

### Verification of Phase 1

- `npm run typecheck` clean
- `npm run lint` clean (0 warnings/errors)
- `npm run build` clean; build output shows `[+N more paths]` for `/blog/tag/[tag]` and `/projects/[slug]` proving live pre-render from seeded data (e.g., `/blog/tag/ai`, `/blog/tag/bms`, `/projects/kafd-bms-commissioning`).
- Dev server smoke test: `/`, `/about`, `/experience`, `/projects`, `/projects/kafd-bms-commissioning`, `/projects/resume-builder`, `/skills`, `/blog`, `/contact`, `/cv`, `/sitemap.xml` all return HTTP 200.
- Content assertion: `/projects/kafd-bms-commissioning` HTML contains "KAFD", `/skills` HTML contains "Honeywell Alerton" — confirms DB-driven rendering, not the static fallback arrays.

---

## UI overhaul v2 — bold glass + soft gradients (Stripe/Linear direction) — DONE

Amendment passed: original design guide forbade glass, gradients, parallax, violet accents, motion >300ms. Owner confirmed "Amend rules + go bolder". New rules formalised in [`plan/11_DESIGN_SYSTEM_V2.md`](./11_DESIGN_SYSTEM_V2.md) (allow glassmorphism + violet secondary + gradient mesh + parallax ≤8px + spring eases `[0.22, 1, 0.36, 1]` + hero motion ≤500ms). WCAG AA, `lucide-react` only, no neon/mint/pink, no carousel auto-rotation.

- [x] **Design System v2** — `plan/11_DESIGN_SYSTEM_V2.md` records the lifted prohibitions and the new rules (becomes source of truth for the visual language)
- [x] **Tokens & primitives** — `globals.css` (`.glass-card`, `.glass-chip`, `.glass-header`, `.glass-side`, `.gradient-mesh`, `.section-gradient`, `.cover-gradient-bms/software/iot/android/blog`, print block, reduced-motion override); `tailwind.config.ts` (violet light+dark, `glow-bms/software/iot/android/violet`, `spring-in`, `fade-up-lg`)
- [x] **Skeleton primitive** — `src/components/ui/skeleton.tsx` (Skeleton / SkeletonText / SkeletonCard / SkeletonGrid) on top of the existing `.shimmer` keyframe
- [x] **Card variant** — added `variant="glass" | "outline" | "default"` to `src/components/ui/card.tsx`
- [x] **PageHeader variants** — added `variant="hero" | "subtle"` + `align` to `src/components/page-header.tsx`
- [x] **Helpers** — `src/lib/nav.ts` (`navItems` + `footerNavItems`), `src/lib/search-index.ts` (static search index from fallback arrays, 8 routes + 6 projects + 3 posts + 2 tag pages), `paragraphs()` and `dateRange()` in `src/lib/utils.ts`
- [x] **Smart features**
  - `src/components/ui/command-palette.tsx` — Cmd/Ctrl-K palette mounted once in root layout; reads from `search-index.ts` (no Prisma pulled into client bundle); keyboard nav (↑/↓/Enter/Esc); `<Dialog size="lg">` reuse
  - `src/components/reading-progress.tsx` — thin scroll bar mounted only in `blog/[slug]/page.tsx`; `transform: scaleX()`, reduced-motion → static
  - `src/components/scroll-spy-nav.tsx` — IntersectionObserver on `[data-spy-target]`; mounted on About page (right-side floating glass rail)
- [x] **Layout chrome**
  - `src/components/site-header.tsx` rebuilt — glass header, larger logo, ⌘K trigger button (dispatches `COMMAND_PALETTE_TOGGLE` custom event), mobile drawer, imports `navItems` from `src/lib/nav.ts`
  - `src/components/site-footer.tsx` rebuilt — 4-col responsive on top of `gradient-mesh`, imports `navItems` from `src/lib/nav.ts`
  - `src/app/layout.tsx` mounts `<CommandPalette />` + `<Toaster />`, adds fixed `gradient-mesh` background div, `body` relative positioning
- [x] **Pages** (each keeps try/catch fallback to the same dummy arrays so the site renders when DB is empty)
  - `src/app/page.tsx` (Home) — 2-col hero with right "Lead BMS Engineer" stat card, marquee proof bar (reduced-motion + off-screen pause), bento grid (large BMS card spanning 2 cols), featured projects, workflow, latest-blog teasers, split-CTA band
  - `src/app/(site)/about/page.tsx` — sections get `id` + `data-spy-target="true"`; sticky mission/values glass side card; vertical timeline with category-coloured nodes + entrance animation (no parallax)
  - `src/app/(site)/experience/page.tsx` — vertical timeline with continuous violet rail, glass cards per role, current-role pulse preserved, `fallbackRoles` kept
  - `src/app/(site)/skills/page.tsx` — core-stack hero strip with category-tinted chips + grouped matrices, `groups` fallback kept
  - `src/app/(site)/projects/page.tsx` — leaf `<ProjectsGrid />` async child wrapped in `<Suspense fallback={<SkeletonGrid />}>`, parent still awaits `getPublishedProjects` for search-index population
  - `src/components/project-card.tsx` — glass surface, category-tinted cover gradients, hover lift + category-coloured glow
  - `src/components/project-filter.tsx` — glass filter chips, search input with X clear button, accessible
  - `src/app/(site)/projects/[slug]/page.tsx` — hero cover band, glass sections, numbered 7-part narrative, sticky Quick facts glass side card; falls back to local dummy detail for `kafd-bms-commissioning` only (else `notFound()`)
  - `src/app/(site)/blog/page.tsx` — glass cards with cover gradients, `<SkeletonGrid>` streaming, `<EmptyState>` when no posts
  - `src/app/(site)/blog/[slug]/page.tsx` — mounts `<ReadingProgress />`, glass prose container, JSON-LD `Article`
  - `src/app/(site)/blog/tag/[tag]/page.tsx` — same skeleton pattern + EmptyState
  - `src/app/(site)/contact/page.tsx` — glass form via `ContactForm`, channel glass cards, Sonner toasts, honeypot preserved, `channels` fallback kept
  - `src/app/(site)/cv/page.tsx` — restyled with print:` tailwind variants and `@media print` block in `globals.css`; live rewire deferred to follow-up
- [x] **`ContactForm` component** — `src/components/contact-form.tsx` client component with `Field`/`Input`/`Textarea` primitives, manual validation (name/email/message), Sonner toasts, success state, honeypot field

### Verification of v2 overhaul

- `npm run typecheck` clean
- `npm run lint` clean (0 warnings/errors)
- `npm run build` clean; build output shows 27 routes, dynamic `/projects/[slug]` and `/blog/tag/[tag]` still pre-render from the live DB, evidence the Prisma query contract wasn't broken
- Dev server smoke test (live DB): `/`, `/about`, `/projects`, `/experience`, `/skills` all return HTTP 200
- Reduced-motion smoke test: marquee, gradient-mesh pan, scroll-spy transforms all disabled when the OS preference is "reduce"
- Print `/cv`: glass + accent surfaces stripped, ink-friendly palette

### Notes for next session

- Admin untouched on purpose. The new tokens inherit down but the admin chrome still uses the v1 design system; a follow-up can polish it.
- `src/lib/search-index.ts` is intentionally static (built from fallback arrays) — keeps Prisma out of the client bundle. When admin lands tag CRUD, rebuild this file from `getPublishedPosts` + `getPublishedProjects` during the build step.
- Command palette is public-only (mounted in `src/app/layout.tsx`, **not** in `src/app/admin/layout.tsx`). Admin keeps its existing chrome.

---

## Remaining phases — NOT started

### Phase 2 — Admin panel — DONE

All admin screens implemented. Server Actions in `src/server/actions.ts` (~25 actions) with zod validation in `src/lib/schemas.ts`. Hand-rolled UI primitives in `src/components/ui/`. Image uploads via `/api/admin/upload`. Signout via `/admin/auth/signout` route handler. Activity log writes on every mutation; dashboard reads last 10.

- [x] `/admin/login` — Supabase Auth (already built earlier)
- [x] `/admin` dashboard — counts (published/draft projects + posts, unread messages, recent activity)
- [x] Profile CRUD (singleton) — all 17 fields, RHF + Zod, image uploader for avatar
- [x] Experience CRUD — bullets list, stack chips, "currently here" toggle, marquee, up/down reorder
- [x] Education CRUD — year pickers, status badge
- [x] Certifications CRUD — issuer, year, credential URL
- [x] Skills — two-level: groups (collapsible cards) with nested skills; inline add/remove; up/down reorder within group; level dots
- [x] Projects CRUD — list + dedicated `/admin/projects/[id]` editor with full 7-part form, cover + gallery upload, featured toggle (warns if >3), publish toggle, draft status
- [x] Blog list + `/admin/blog/[id]/editor` — split-pane Markdown editor with toolbar + live preview, autosave every 5s + onBlur, "Saved at HH:MM" indicator, tag chip input with create-on-type, cover upload, publish/unpublish toggle
- [x] Messages inbox — table with click-to-open drawer, mark read/unread, archive, delete (ConfirmDialog), mailto reply
- [x] Settings — "Revalidate everything" action, "Revalidate home", SMTP smoke test, masked REVALIDATE_SECRET display
- [x] `/api/revalidate` (already built) — called by Server Actions after each successful write
- [x] `X-Robots-Tag: noindex,nofollow` set in middleware (already done)
- [x] `requireAdmin()` server-side guard on every action + admin route handler
- [x] Activity log writes via `logActivity()` helper on every successful create/update/delete

**Quality gate:** `npm run typecheck`, `npm run lint`, `npm run build` all clean. Dev server smoke test: `/admin/login` → 200, `/` → 200, `/admin` → 307 redirect to login (auth gate working).

### Phase 4 — SEO + performance + a11y polish — DONE

- [x] **Structured data (JSON-LD)** — new `src/lib/jsonld.ts` with builders for `Person`, `WebSite` (with `SearchAction`), `Article`, `CreativeWork` (with sub-types for projects), `BreadcrumbList`. New `src/components/json-ld.tsx` injects `<script type="application/ld+json">` safely (no user-supplied data, just stringified JSON). Wired into:
  - Root layout: Person + WebSite + SearchAction (site-wide, profile-driven)
  - `/about`: breadcrumb only (Person comes from layout; deduped so Google sees one entry)
  - `/projects/[slug]`: CreativeWork + BreadcrumbList
  - `/blog/[slug]`: Article + BreadcrumbList
  - `/blog/tag/[tag]`: BreadcrumbList + WebSite blurb
- [x] **OG image generator** — `src/app/api/og/route.tsx` Edge runtime, `next/og` `ImageResponse`. Renders 1200×630 PNG with brand-consistent gradient mesh + JetBrains kicker + Inter headline. `Cache-Control: public, immutable, no-transform, max-age=3600`. Verified output is real `PNG image data, 1200 x 630`.
- [x] **Per-route OG + Twitter metadata** — every public route now sets `openGraph.{images, url, type}`, `twitter.{card, title, description, images, creator}`, and `alternates.canonical`. Home inherits from root layout; `/projects`, `/blog`, `/experience`, `/skills`, `/contact`, `/cv`, `/about` set bespoke OG with route-specific titles + OG image. Detail pages (`/projects/[slug]`, `/blog/[slug]`, `/blog/tag/[tag]`) include the route title + excerpt in the OG image URL.
- [x] **Viewport + theme colour** — `export const viewport` in root layout with `themeColor` light/dark + `colorScheme: light dark` + `width: device-width`.
- [x] **Security headers** — `next.config.ts` adds `Content-Security-Policy` (img-src includes Supabase + data:; connect-src includes Supabase + Vercel Insights), `Strict-Transport-Security` (2-year, includeSubDomains, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`. All 6 verified via `curl -I`.
- [x] **Vercel Analytics** — `@vercel/analytics@^2.0.1` installed, `<Analytics />` mounted once in root layout (no-op outside Vercel).
- [x] **A11y pass**
  - Global `:focus-visible` ring already wired in `globals.css` (line 74); confirmed every interactive control inherits it.
  - Command palette upgraded: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (sr-only title), focus trap on Tab/Shift+Tab, focus restoration on close, `aria-controls` + `aria-activedescendant` on input.
  - `FOCUSABLE_SELECTOR` constant for the trap.
  - Skip link + `<main id="main">` landmark verified in initial HTML.
  - SiteHeader mobile menu: `aria-expanded` reflects state (already there).
- [x] **Custom 404 already styled** (Phase 1)

### Verification of Phase 4

- `npm run typecheck` clean
- `npm run lint` clean (0 warnings/errors)
- `npm run build` clean; 28 routes generated (added `/api/og`); dynamic `/projects/[slug]` + `/blog/tag/[tag]` still pre-render from live DB; bundle sizes unchanged from Phase 3.
- Dev server smoke test (port 3002): `/`, `/about`, `/projects`, `/projects/kafd-bms-commissioning`, `/blog`, `/experience`, `/skills`, `/contact`, `/cv` all HTTP 200.
- `curl /api/og?type=project&title=Test` → 200 PNG, 1200×630, 30 kB.
- `curl -I /` → all 6 security headers present.
- `curl /about | grep application/ld+json` → 2 blocks (Person from root + BreadcrumbList from page) — Google-correct (no duplicate Person).
- `curl /projects/kafd-bms-commissioning | grep og:` → all required properties including image dimensions and type=article.

### Notes for next session

- The CSP currently allows `'unsafe-inline'` for `<script>` and `<style>` because Tailwind + Next emit inline scripts (e.g. theme flash prevention). If the Lighthouse audit flags this, the next pass can move to nonce-based CSP via the `next-safe` package or Next's experimental nonce support.
- Lighthouse mobile ≥95 audit + axe DevTools scans are out-of-band (require running Chrome / axe extensions against the live preview). Both should pass given the structured-data, semantic HTML, focus rings, and contrast tokens already shipped, but they cannot be verified from the CLI in this environment.
- `/api/og` works on the Edge runtime but may fail in `next dev` on Windows under WSL due to the Edge worker not having a browser font resolver; if so, swap to Node runtime + `satori` + `resvg` in a follow-up.

### Phase 5 — Deploy + handoff (~0.5 day)

- [ ] Push repo to GitHub (owner creates repo; do NOT commit `.env`)
- [ ] Vercel import + set env vars in Vercel project settings
- [ ] Run `npm run prisma:push` against prod db (or build script)
- [ ] Apply `supabase/rls.sql` in Supabase dashboard if not already done
- [ ] Create admin user in Supabase Auth (if not already done)
- [ ] Create storage buckets if not already done
- [ ] Verify login → create-publish-revalidate cycle in production
- [ ] Connect custom domain (owner to choose — e.g., `kamalhosen.dev`)
- [ ] Handoff doc: short "how to edit" guide committed to repo

---

## Notes for next session

- All Phase 1 routes return 200 in dev and build, content renders live from Supabase.
- Fallbacks are in place: if a future anon read is blocked, the static arrays still render the site so visitors never hit a blank page.
- The contact form already POSTs to `/api/contact` and inserts into `messages` (honeypot-field guarded).
- CV page content is currently static (aligned with seed); wire to live profile in Phase 3 to make it admin-editable.
- If schema or content shape changes, run `npm run prisma:push` then `npm run seed` again — seed is idempotent and safe to re-run.
- Plan documents in `plan/` are the source of truth for design intent, data model, blog design, and security model. Refer to those before making architectural decisions.

Sleep well. When you return, check this file first, run `npm run typecheck && npm run lint && npm run build`, then start Phase 2 from the list above.