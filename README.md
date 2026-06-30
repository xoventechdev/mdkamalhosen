# portfolio

Professional portfolio of **Md Kamal Hosen** — Building Management System Engineer and software developer.

Built with Next.js 15, TypeScript, Tailwind CSS, Supabase (Postgres + Auth + Storage), and Prisma.
Content is fully dynamic and editable in production through a private admin panel.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your env file from the template
cp .env.example .env.local
#   -> Fill in your Supabase URL, anon key, service role key,
#      DATABASE_URL, and admin email (mdkamalhosennn@gmail.com by default).

# 3. Generate the Prisma client and sync the schema to Supabase
npm run prisma:generate
npm run prisma:push

# 4. (Optional) Seed initial content from the ai-context files
npm run seed

# 5. Run the dev server
npm run dev
#    open http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes |
| `npm run prisma:push` | Push schema changes to Supabase (no migration history) |
| `npm run prisma:studio` | Open Prisma Studio (DB browser at :5555) |
| `npm run seed` | Seed initial content from ai-context |
| `npm run format` | Prettier format everything |

## Project structure

```
portfolio/
├── ai-context/          # Source-of-truth notes (profile, projects, design, rules)
├── prisma/
│   ├── schema.prisma    # Data model
│   └── seed.ts          # Initial content loader
├── public/
│   ├── cv/              # CV PDF
│   ├── og/              # OG images
│   └── ...
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (site)/      # Public pages: home, about, projects, contact
│   │   ├── admin/       # Auth-gated CRUD admin
│   │   ├── api/         # Route handlers (revalidate, contact, webhooks)
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/      # UI components
│   ├── lib/             # supabase clients, prisma, helpers
│   ├── server/          # server-only queries and revalidation
│   └── styles/          # global CSS
└── ...
```

## Admin

Sign in at `/admin` with the email registered in `ADMIN_EMAIL`. After sign-in you can:
create, edit, reorder, and delete projects, experiences, education, certifications, skills, and profile
content; upload anonymized screenshots to Supabase Storage; and view messages from the public
contact form. Every save triggers on-demand revalidation so the public site updates instantly.