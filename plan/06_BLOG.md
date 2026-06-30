# 06 — Blog

The blog is a first-class section of the site (nav: Home · About · Experience · Projects ·
Skills · **Blog** · Contact) but its implementation is intentionally minimal — Markdown
stored in the database and edited live in production. No git-writes-to-publish loop.

## Goals

1. Demonstrate writing clarity and engineering authority (target audience includes other
   engineers, recruiters who google you, and AI crawlers indexing technical content).
2. Build SEO surface for queries like "BACnet vs Modbus", "Niagara 4 commissioning",
   "AI in building automation" — long-tail traffic that compounds.
3. Provide a place to publish case-study companion notes too detailed for the project page.
4. Keep editing trivial: log in, write Markdown, publish.

## Why Markdown-in-DB (not MDX files)

| Option | Verdict |
| --- | --- |
| MDX files in repo | Requires commit + redeploy to publish — **disqualifies** (owner needs production CRUD) |
| Markdown text column in `blog_posts.body_md` | **Chosen**. Owner edits in admin like a CMS. Server renders Markdown → HTML on read. |
| Rich text (Tiptap/Lexical) | Overkill, locks content into a schema, harder to migrate. Markdown is forever. |

Markdown table support and code blocks with syntax highlighting ship via `remark-gfm` +
`rehype-highlight` — BMS protocol snippets, installer logs, and configuration examples all
render correctly.

## Routes

| Route | Type | Content |
| --- | --- | --- |
| `/blog` | ISR | Index. Paginated list of `published` posts. Newest first. Per post: cover (16:9), title, tag chips, date, reading time, 160-char excerpt. |
| `/blog/[slug]` | ISR | Full post. Title, cover, meta, TOC, body, author box, prev/next. |
| `/blog/tag/[tag]` | ISR | All posts with that tag, same index style. |

Drafts are never visible on the public site (RLS: `status = 'published'` only). Admin sees
all.

## Post schema (excerpt — see `04_DATA_MODEL.md`)

```
blog_posts:
  id           int pk
  slug         text unique
  title        text
  excerpt      text          -- auto-generated from first paragraph if blank
  cover_url    text nullable
  body_md      text          -- GitHub-flavored Markdown
  status       text          -- 'draft' | 'published'
  published_at timestamp     -- set when first flip to published
  reading_minutes int        -- computed on save (360 wpm)
  meta_description text      -- for SEO; optional, falls back to excerpt
  author_id    int           -- always profile.id = 1
  created_at, updated_at timestamp

blog_tags:
  id int pk, name text unique, slug text unique

_BlogPostsToBlogTags:
  A int (post_id), B int (tag_id)   -- Prisma implicit M2M
```

## Editor (`/admin/blog/[id]/editor`)

A single full-page route replacing the admin sidebar (back button returns to `/admin/blog`).
Layout:

```
┌─────────────────────────┬─────────────────────────┐
│   Markdown editor       │   Live preview          │
│   (textarea + toolbar)  │   (rendered HTML)       │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
[title] [slug] [tags] [cover upload]
[Save draft] [Publish] [Unpublish] [Preview full page] [Delete]
```

Toolbar actions: bold, italic, H2, H3, link, image upload (Supabase Storage), code block,
blockquote, table, unordered list, ordered list. Hand-rolled buttons wrapping selection
in Markdown syntax (no rich-text lib). Backspace in a code/list block behaves naturally.

Autosave: on `blur` and every 5 seconds if dirty. Shows "Saving…" → "Saved at HH:MM".
Slug auto-generated from title on first save; editable; uniqueness enforced by DB.

Reading time + excerpt auto-computed server-side on each save (override allowed for excerpt).

## Rendering (public)

Server-side pipeline (cached by ISR):

```
body_md
  → remark-parse
  → remark-gfm
  → remark-rehype
  → rehype-slug         (add ids to H2/H3 for TOC)
  → rehype-autolink-headings
  → rehype-highlight    (code syntax, CSS variables for theming)
  → rehype-stringify
```

`dangerouslySetInnerHTML` on a `<div class="prose">` — content is single-author (you), held
in your own DB; HTML sanitization still applied via `rehype-sanitize` as a belt-and-braces
default.

Code syntax theme:

- Light: a custom soft theme (based on GitHub light) bound to `--code-bg`, `--code-fg`.
- Dark: one-dark variant in the dark navy theme.

## TOC + reading UX

- TOC generated from `<h2>` ids; sticky on the right column on desktop ≥ `lg`.
- Long code blocks: `overflow-x-auto`, vertical scroll allowed but no clamp.
- Images: `next/image` with `display: block, max-width: 100%`. Cover image gets a 16:9
  card above the title.

## SEO

| Concern | Strategy |
| --- | --- |
| Title | `post.title` first, then site name |
| Description | `meta_description` or post excerpt |
| Canonical | full URL of the post |
| OpenGraph | `ImageResponse` OG image generated per post (title + tag + author + date) — cached at the edge |
| Twitter card | `summary_large_image` |
| JSON-LD | `Article` schema — author `Person`, datePublished, dateModified, image, keywords (tags) |
| Sitemap | `/sitemap.xml` includes all `published` posts + tag pages |
| Internal links | Prev/next post; tag pages; "related projects" optional below the post (joined by shared tag → project category mapping) |
| Breadcrumbs | Home → Blog → Post (JSON-LD `BreadcrumbList`) |

## Tags

- Tag page `/blog/tag/[tag]` reads from the join table.
- Tag chips on the blog index link to the tag page.
- Tag creation happens inline in the editor (type a new tag, Enter to create). No separate
  "manage tags" screen required (admin just deletes the association; orphan tags are cleaned
  by a nightly cron strip or a button in `/admin/blog`).

## Public list view

Card grid 3 columns desktop / 1 column mobile. Sort: `published_at desc`. Pagination:
12 per page via query param `?page=2` (no infinite scroll — better for SEO and sharing).
Empty state: "No posts yet. Check back soon." (Use only until the first published post.)

## Performance

- `body_md` sizes stay small (a few KB each). Rendering server-side + ISR cache → near-zero
  per-request cost.
- `rehype-highlight` registered languages limited to the ones used (javascript, python,
  bash, json, text) — keeps bundle tiny.
- Cover images processed by `next/image`.

## Migration story

If you ever move off this stack:

- Export `blog_posts.body_md` per row → individual `.md` files with frontmatter. One script.
- Re-import in any other Markdown-aware system (Astro, Hugo, Notion, etc.).
- No vendor lock-in, no rich-text JSON to unparse. Markdown is forever.