# 11 — Design System v2 (amendment)

> Source of truth for the visual language, supersedes `03_DESIGN_SYSTEM.md` and the
> prohibitions in `ai-context/06_DESIGN_GUIDE.md` for the public site. The admin panel
> remains on the original rules via inheritance. **Owner approved 2026-06-30.**

## Why a v2 amendment

The original guide forbade glassmorphism, page-level gradients, parallax, and any accent
besides navy + blue. After living with the v1 build, the owner asked for a more confident
visual identity in the Stripe / Linear-bold direction. We are keeping the bones (type,
spacing rhythm, motion restraint, accessibility, restraint on the admin chrome) and
loosening the prohibitions listed below.

## What changed

| Topic | v1 rule | v2 rule |
| --- | --- | --- |
| Glassmorphism | forbidden | **Allowed** — `backdrop-blur-xl` with `bg-white/[0.55–0.70]` in light / `bg-white/[0.04–0.08]` in dark. Never stack glass on glass on glass. Never use glass on the dialog overlay itself (overlay stays solid). |
| Page background | flat color (single solid) | **Allowed** — one fixed radial gradient-mesh anchored top + right, built from blue + violet + emerald cat-hue at low opacity. Sub-1.5 luminance shift from base. Fixed position so it doesn't scroll. |
| Accent palette | navy + blue only | **Add violet-500 (`rgb(139 92 246)`)** as a secondary accent. Used in gradients and CTA highlights only — never as a flat text color outside a single violet primary button per page. |
| Parallax | forbidden | **Allowed** on the home hero band only. ≤ 8px translate on Y axis. Fully disabled under `prefers-reduced-motion: reduce`. |
| Motion duration | ≤ 300ms | **Allowed up to 500ms** for hero entries and primary section reveals. Hover and micro-interactions stay ≤ 300ms. |
| Spring curves | `easeOut` only | **Allowed cubic-bezier `[0.22, 1, 0.36, 1]`** for page-entry reveals. Hover uses `easeOut`. |
| Marquee | one allowed on home proof bar | Same. MUST respect reduced-motion and MUST pause when off-screen via IntersectionObserver. |

## What is unchanged

These rules still hold — both for v1 and v2:

- No neon, mint, pink, or saturated pop accents. Blue + violet only.
- No gradient buttons. Gradient text allowed ONLY on the home hero headline.
- No carousel auto-rotation. No testimonial sliders.
- No stock illustrations of engineers, hand-pointing-at-holograms, isometric datacenter art.
- WCAG 2.1 AA contrast required in both light and dark themes.
- `lucide-react` line icons only, stroke width 1.75.
- Generous whitespace. Information density on detail pages (engineers read), restraint on
  marketing pages (recruiters scan).

## Glass surface spec

| Surface | Light class | Dark class |
| --- | --- | --- |
| Card | `bg-white/[0.65] backdrop-blur-xl border border-white/40 shadow-card` | `bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-card` |
| Pill / chip | `bg-white/[0.55] backdrop-blur-md border border-white/40` | `bg-white/[0.04] backdrop-blur-md border border-white/10` |
| Header (sticky) | `bg-white/70 backdrop-blur-xl border-b border-white/40` | `bg-white/[0.04] backdrop-blur-xl border-b border-white/10` |
| Side card | `bg-white/[0.55] backdrop-blur-xl border border-white/30` | `bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]` |

- Hover lift: `hover:-translate-y-1.5` max 6px. Shadow follows.
- Maximum nesting depth: glass → solid → glass. No three-level glass stacks.
- On form inputs, NEVER use glass. Inputs stay solid for legibility.

## Gradient mesh spec

Three layered radial gradients, fixed to viewport, anchored:

```
radial-gradient(ellipse 70% 50% at 50% -10%, rgb(var(--accent) / 0.20), transparent 70%)
radial-gradient(ellipse 60% 50% at 85% 10%, rgb(139 92 246 / 0.12), transparent 70%)
radial-gradient(ellipse 50% 40% at 10% 20%, rgb(var(--cat-iot) / 0.10), transparent 70%)
```

The mesh sits behind everything else and never moves. Content surfaces (`bg-card`,
glass) sit on top with full opacity.

## Violet usage rules

- Color tokens: `violet-500: #8b5cf6` (or `rgb(139 92 246)`). Dark variant: `#a78bfa`.
- Where allowed: gradient stops, one violet primary CTA per page, secondary accent in
  icons, footer accent line.
- Where forbidden: body text color, paragraph text, descriptions.
- On the home page exactly one CTA (`View projects`) gets a violet primary. Everywhere
  else CTAs use the navy-blue accent.

## Motion budgets

| Animation | Max duration | Easing |
| --- | --- | --- |
| Page entry (hero) | 600ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Section entry (ScrollReveal) | 500ms | cubic-bezier(0.22, 1, 0.36, 1) |
| Card hover | 300ms | easeOut |
| Background mesh pan | 30s | linear (off-screen by default) |
| Reading progress bar | 80ms | linear |
| Marquee scroll | 28s | linear (pauses off-screen + reduced motion) |
| Command palette open | 220ms | cubic-bezier(0.22, 1, 0.36, 1) |

All durations and easings become disabled when `prefers-reduced-motion: reduce`.

## Print spec (CV page)

A single `@media print` block in `globals.css` strips glass, gradient mesh, hover lifts,
marquees, and reading progress. Print body falls back to solid white background, navy
text, no shadows. Resume content flows naturally across pages.

## Accessibility budget

- Body text contrast ≥ 4.5:1 in both themes.
- Text on glass surfaces stays at full opacity (foreground token), never `text-muted-foreground` on glass unless the glass is at `0.85+` opacity.
- All interactive elements keep a 2px focus ring (`outline: 2px solid var(--accent)`).
- `lucide-react` icons stay `aria-hidden`. Decorative SVGs stay `aria-hidden`.
- Skip-to-content link stays first focusable in `src/app/layout.tsx`.

## Where this amendment applies

- ✅ Public site (`src/app/(site)/**`, `src/app/page.tsx`, public `layout.tsx`)
- ✅ Shared primitives in `src/components/**` and `src/components/ui/**`
- ❌ Admin panel (`src/app/admin/**`, `src/components/admin/**`) — stays on v1 rules.
  Admin inherits token changes only; no visual remake in this phase.

## Open follow-ups

- Phase 2 (out of scope here): admin panel polish to match v2.
- Phase 3 (out of scope here): per-route OG image generation (already in `plan/08_SEO_PERFORMANCE.md`).
- CV page rewire to live `getProfile/experience/education/certifications` queries deferred.
