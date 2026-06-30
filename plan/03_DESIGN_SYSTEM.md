# 03 — Design System

Built to satisfy `06_DESIGN_GUIDE.md` in ai-context: minimal, engineering, professional,
premium. The reference is Apple + Stripe + Linear — confident restraint, never busy.

## Tokens

Stored as CSS variables in `src/styles/globals.css`, applied through Tailwind aliases in
`tailwind.config.ts`. Two themes: **light** (default) and **dark navy** (optional toggle,
system-aware via next-themes).

### Color (light)

| Token | Value | Use |
| --- | --- | --- |
| `--background` | 255 255 255 | Page bg |
| `--foreground` | 11 26 58 | Body text (navy 900 equivalent) |
| `--card` | 255 255 255 | Cards, surfaces |
| `--card-foreground` | 11 26 58 | Card text |
| `--muted` | 248 250 252 | Subtle band backgrounds |
| `--muted-foreground` | 100 116 139 | Captions, secondary text |
| `--border` | 226 232 240 | Hairline borders, dividers |
| `--input` | 226 232 240 | Form field borders |
| `--accent` | 37 99 235 (blue-600) | Links, focus, key actions |
| `--accent-foreground` | 255 255 255 | White text on accent |

### Color (dark)

| Token | Value | Use |
| --- | --- | --- |
| `--background` | 6 11 26 (navy 950) | Page bg |
| `--foreground` | 226 232 240 | Body text |
| `--card` | 11 26 58 (navy 900) | Surfaces |
| `--card-foreground` | 248 250 252 | Card text |
| `--muted` | 15 37 82 (navy 800) | Bands |
| `--muted-foreground` | 148 163 184 | Captions |
| `--border` | 30 41 59 | Borders |
| `--input` | 30 41 59 | Inputs |
| `--accent` | 59 130 246 (blue-500) | Lighter accent for dark |
| `--accent-foreground` | 255 255 255 | Text on accent |

Accent is the **only** seductive color. Everything else is grayscale/ navy. No gradients,
no glassmorphism, no neon (per `06_DESIGN_GUIDE.md`).

## Typography

- Sans: **Inter** via `next/font/google` (self-hosted, subset latin).
- Mono: **JetBrains Mono** via `next/font/google` — used only for code blocks, slugs in admin,
  and inline protocol names like `BACnet/IP`.

Scale (modular, 1.250 ratio):

| Token | px | Use |
| --- | --- | --- |
| `text-xs` | 12 | Captions, badges |
| `text-sm` | 14 | Body meta, nav on mobile |
| `text-base` | 16 | Body |
| `text-lg` | 18 | Lead paragraphs |
| `text-xl` | 20 | Card titles |
| `text-2xl` | 24 | Section subheads |
| `text-3xl` | 30 | H3 in case studies |
| `text-4xl` | 36 | H2 |
| `text-5xl` | 48 | H1 hero on large screens |

Weights: 400 (body), 500 (subtle emphasis), 600 (headings, buttons). Italic reserved for
genuine emphasis, never decoration.

Heading tracking tightened (`-0.02em`), body leading `1.7` for readability on long pages
(blog, case studies).

## Spacing & layout

- Container: `max-w-6xl` (1152px) centered, `px-6` on mobile / `px-8` on desktop.
- Section vertical rhythm: `py-20` (5rem) desktop, `py-14` mobile.
- Card padding: `p-6` / `p-8` feature cards.
- Grid gap: `gap-6` default, `gap-8` on feature grids.
- Generous whitespace is the feature — do not pack content edge-to-edge.

## Radius & depth

- `rounded-md` (0.5rem) for buttons, chips.
- `rounded-lg` (0.625rem) for cards.
- `rounded-full` for avatars, badges.
- Shadows: single token `--shadow-card` = `0 1px 2px rgba(11,26,58,.06), 0 8px 24px
  rgba(11,26,58,.04)`. Applied to cards on hover only — default cards are flat with a
  hairline border. Premium sites stay flat by default.

## Motion

- Stagger fade-up on scroll for section content (`framer-motion` `whileInView`).
- Duration ≤ 300ms, ease `easeOut`.
- **`prefers-reduced-motion: reduce`** → disable all transforms/opacity changes.
- No parallax, no counters, no auto-carousel. A single muted "marquee" of skill chips is
  allowed on the home hero area but must respect reduced-motion and pause when off-screen.

## Imagery

- Cover ratio 16:10 for project cards, 16:9 for blog covers.
- Anonymized BMS screenshots: blur tag names / addresses before upload (handled by owner
  outside the site). Storage bucket is admin-write only.
- `next/image` everywhere; provide `width`/`height` or use the `fill` pattern.
- Never hot-link external images.

## Accessibility (WCAG 2.1 AA target)

- Color contrast ≥ 4.5:1 for body, ≥ 3:1 for UI components (the dark navy + accent combo
  has been checked).
- All interactive elements keyboard-focusable, visible focus ring (`outline: 2px solid
  var(--accent)`).
- Skip-to-content link first focusable element.
- ARIA landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`).
- Form fields paired with `<label>`, error text via `aria-describedby`.
- Theme toggle exposes `aria-label`.
- All non-decorative images carry descriptive `alt`.
- Targets ≥ 44×44px on touch devices.

## Iconography

`lucide-react` line icons only. Same weight across the site (`strokeWidth: 1.75`). No
filled icons, no emoji as UI affordances.

## Tone of UI copy

Mirror the writing rules in `07_WRITING_STYLE.md`:

- Short, declarative buttons: `View projects`, `Download CV`, `Read case study`,
  `Send`, `Save draft`.
- Section headings are noun phrases or short verb phrases ("Selected work",
  "How I work", "Get in touch").
- Empty states use plain language, no "Oops!".

## What is forbidden visually

- Gradient text or gradient buttons.
- Neon / mint / pink accents (only navy + blue accent allowed).
- Glassmorphism, blur cards, frosted overlays.
- Carousel auto-rotation.
- Stock illustrations of engineers pointing at holograms.
- Testimonial sliders — a portfolio doesn't need fake testimonials.

## Reference sites

- **Stripe** — typography restraint + spacing rhythm + section transitions.
- **Linear** — minimal chrome, dense but readable detail pages, dark mode done right.
- **Apple** — type scale, hero treatment, calm motion.
- **Vercel** — code/terminal aesthetic for the admin panel and project detail snippets.