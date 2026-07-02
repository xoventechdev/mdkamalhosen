/**
 * Site-wide identity defaults. Used by:
 *   - `RootLayout` (metadata + JSON-LD + footer profile pre-seed fallback)
 *   - `SiteHeader` (brand name fallback)
 *   - `SiteFooter` (fallback profile.base)
 *   - `ContactForm` / `LoginPage` (email placeholder)
 *   - `OgImageRoute` (alt text for default fallback image)
 *
 * Override via the Profile singleton in `/admin/profile` whenever possible —
 * these only render when no profile doc is seeded.
 */
export const SITE_DEFAULTS = {
  name: "Md Kamal Hosen",
  email: "mdkamalhosennn@gmail.com",
  twitterHandle: "@mdkamalhosennn",
  linkedinUrl: "https://linkedin.com/in/mdkamalhosennn",
  githubUrl: "https://github.com/mdkamalhosennn",
  whatsapp: "https://wa.me/966583471377",
} as const;

export type SiteDefaults = typeof SITE_DEFAULTS;
