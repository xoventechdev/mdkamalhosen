# 08 — SEO + Performance

A recruiter googles "Md Kamal Hosen BMS" — the first three results must be this site,
LinkedIn, and GitHub. Personal site wins on structured data, speed, and clean OG cards.

## Metadata

Each route exports a `metadata` object or `generateMetadata`. Canonical, title, description,
OpenGraph, Twitter card, robots directives. Defaults set in `src/app/layout.tsx`:

- Default title template: `%s — Md Kamal Hosen` (home uses absolute title).
- Default description: profile.tagline.
- Default OG image: `/api/og?slug=home` (ImageResponse, runtime edge).
- Twitter card: `summary_large_image`.

## Structured data (JSON-LD)

Injected via `<script type="application/ld+json">` in the relevant layouts:

| Page | Schema |
| --- | --- |
| site root | `WebSite` + `Person` (name, jobTitle, address `{country: KSA}`, sameAs = LinkedIn/GitHub, knowsAbout = skills) |
| `/about` | reuses `Person` with more `description` |
| `/projects/[slug]` | `CreativeWork` with `creator` Person, `dateCreated`, `keywords` (tech_stack) |
| `/blog/[slug]` | `Article` — headline, datePublished, dateModified, author Person, image (cover), keywords (tags) |
| breadcrumbs | `BreadcrumbList` on `/blog/[slug]` and `/projects/[slug]` |

## Sitemap

`src/app/sitemap.ts` dynamically lists:

- All static routes.
- All `published` projects (`/projects/[slug]`).
- All `published` blog posts (`/blog/[slug]`).
- All used tags (`/blog/tag/[tag]`).

Cached 60 minutes (route segment `revalidate = 3600`).

## robots

`src/app/robots.ts`:

- Allow all.
- Sitemap reference absolute URL.
- Disallow `/admin/*`.

## OpenGraph images

`/api/og?slug=...` — Edge runtime `ImageResponse` rendering a 1200×630 card:

- site pages: navy gradient-free background, name, role, tagline.
- project pages: title + category + year + site name.
- blog pages: title + tag chips + date.

Cached at the edge for 24h, keyed by slug + theme.

## Performance targets

Lighthouse (mobile, simulated) ≥ 95 on all four:

| Metric | Target | Strategy |
| --- | --- | --- |
| Performance | ≥ 95 | RSC, no client-only data fetching, `next/image`, font subsetting, route segment ISR |
| Accessibility | ≥ 95 | design-system compliance (see `03_DESIGN_SYSTEM.md`) |
| Best Practices | ≥ 95 | HTTPS, no console errors, no vulnerable deps, secure headers |
| SEO | 100 | metadata, sitemap, canonical, structured data |

## Caching strategy

- Public pages: ISR `revalidate = 60` seconds.
- Per-entity cache tags: `projects`, `project:<slug>`, `blog`, `blog:<slug>`, `profile`.
- Admin save → `revalidateTag` + `revalidatePath`.
- sitemap.ts: `revalidate = 3600`.
- robots.ts: `revalidate = 86400`.

## Bundle policy

- No full-page client components on marketing routes — only islands for nav toggle, theme
  toggle, contact form, project filter.
- `framer-motion` imported only where actually used (tree-shaken).
- `lucide-react` via `optimizePackageImports` (already in `next.config.ts`).
- No client-side data libraries (React Query etc.) — Server Components + route handlers.

## Headers (next.config.ts)

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` (relaxed enough for Supabase + Vercel Analytics, strict
  elsewhere)

## Analytics

Vercel Analytics (privacy mode) — no cookies, GDPR-friendly, no consent banner needed.
Script: `@vercel/analytics` package, `<Analytics />` in root layout.

Optional later: Simple Analytics or Plausible if you want public stats visible to visitors.