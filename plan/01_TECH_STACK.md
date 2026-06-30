# 01 — Tech Stack

Every choice below is justified against three filters: matches the owner's real skills
(so the site itself is a live demo), supports the dynamic-content requirement, and keeps
hosting cost near zero at portfolio scale.

## Core

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15 (App Router)** | Owner skill, best-in-class SEO+performance, RSC for fast public pages |
| Language | **TypeScript (strict)** | Signals senior engineering to technical recruiters |
| Runtime | Node.js 20+ (Vercel) | Server Components, route handlers, edge-ready middlewares |
| Styling | **Tailwind CSS 3.4** | Fast, consistent design tokens; matches the minimal aesthetic |
| Component system | **shadcn/ui** (hand-added only) | Premium accessible primitives, not a "template look"; full source owned |
| Icons | **lucide-react** | Clean line icons, engineering feel |
| Animation | **Framer Motion** | Used sparingly (fade/slide on scroll, ≤300ms) |
| Theme | **next-themes** | Light + dark navy toggle, persisted, system-aware |
| Fonts | **Inter** + **JetBrains Mono** | `next/font` self-hosted; matches `06_DESIGN_GUIDE.md` |
| Forms | **React Hook Form + Zod** | Admin CRUD + public contact form validation |
| Toasts | **sonner** | Lightweight admin feedback |

## Data + Auth

| Service | Choice | Why |
| --- | --- | --- |
| Database | **Supabase Postgres** | Free tier, generous limits, hosted, JS SDK same on server+client |
| ORM | **Prisma 6** | Type-safe schema, migrations, Studio for quick edits during dev |
| Auth | **Supabase Auth (email/password)** | One allowed email (`mdkamalhosennn@gmail.com`); RLS ties writes to `auth.uid()` |
| File storage | **Supabase Storage** | Project screenshots, blog cover images, anonymized BMS diagrams |
| Client SDK | **@supabase/supabase-js + @supabase/ssr** | SSR-friendly cookie auth for the admin area |

## Content + blog

| Concern | Choice | Why |
| --- | --- | --- |
| Blog body storage | **Markdown in DB** (`blog_posts.body_md`, text column) | Lets the owner edit posts from the admin panel with live preview — no git, no MDX redeploy |
| Render | `remark` + `remark-gfm` + `rehype-highlight` rendered server-side | Tables, code blocks, syntax highlight; zero client weight |
| Code highlighting theme | one dark + light variant via CSS variables | Matches site theme |
| Cover images | Supabase Storage bucket `blog-covers` | 1600×830, optimized by `next/image` |
| Drafts | `status` enum (`draft` / `published`) | Owner saves drafts, publishes when ready |

## Editor for admin

A lightweight Markdown editor built with `@uiw/react-md-editor` or `react-markdown` + a textarea
combined with a live-preview pane. Pure browser, no rich-text dependency. Code blocks and
tables render correctly. Drafts autosave to Supabase every few seconds on focus loss.

## SEO + performance

| Concern | Choice |
| --- | --- |
| Metadata | Next.js `metadata` API per route, `generateMetadata` for dynamic project/blog pages |
| Structured data | JSON-LD `Person`, `WebSite`, `Article` (blog posts), `BreadcrumbList` |
| Sitemap | `app/sitemap.ts` (dynamic — pulls published projects and posts from Supabase) |
| Robots | `app/robots.ts` |
| OG images | `ImageResponse` (Edge runtime) generated per project/post; fallback for static pages |
| Analytics | **Vercel Analytics** (privacy mode, no cookies, GDPR-friendly) |
| Speed | RSC + ISR (revalidate 60s) + `next/image` + font subsetting; Lighthouse target ≥95 |

## Infrastructure

| Layer | Choice |
| --- | --- |
| Hosting | **Vercel** (free hobby tier covers a portfolio) |
| Domain | Owner decides post-GitHub publish; default subdomain until then |
| CI | GitHub Actions runs `npm run lint && npm run typecheck && npm run build` on PR |
| Email (contact form) | `nodemailer` via SMTP (server-only) + Supabase `messages` table as inbox/backup |
| Revalidation | `REVALIDATE_SECRET`-protected `/api/revalidate` route; admin calls it after every save |

## Cap / boundary

No Redis, no Kubernetes, no microservices, no GraphQL. A portfolio does not need them and
adding them would only obscure the message. Every component must be explainable in one
sentence to a recruiter.