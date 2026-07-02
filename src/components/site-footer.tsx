import Link from "next/link";
import { Github, Linkedin, Mail, ArrowUp, MapPin, Heart, Download } from "lucide-react";
import { footerNavItems } from "@/lib/nav";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="WhatsApp"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export interface SiteFooterProfile {
  name?: string;
  tagline?: string;
  location?: string;
  email?: string;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  whatsapp?: string | null;
  lookingToNewOpportunity?: boolean;
}

interface SiteFooterProps {
  /** Optional profile overrides — passed from layout once `getProfile` is wired in. */
  profile?: SiteFooterProfile | null;
}

// Base fallback values. `location` is computed below so it respects the
// lookingToNewOpportunity toggle — see the helper at the bottom of the file.
const fallbackProfileBase = {
  name: "Md Kamal Hosen",
  tagline:
    "Building Management System Engineer commissioning HVAC plants and shipping the software that runs them.",
  email: "mdkamalhosennn@gmail.com",
  linkedinUrl: "https://linkedin.com/in/mdkamalhosennn",
  githubUrl: "https://github.com/mdkamalhosennn",
  whatsapp: "https://wa.me/966583471377",
};

export function SiteFooter({ profile = null }: SiteFooterProps) {
  const year = new Date().getUTCFullYear();
  const showJob = profile?.lookingToNewOpportunity ?? true;
  // Build the merged profile, then sanitize the location string so the toggle
  // strips the "Open to relocation anywhere" suffix regardless of whether the
  // caller passed it explicitly.
  const baseLocation =
    profile?.location ?? "Riyadh, Saudi Arabia · Open to relocation anywhere";
  const p: {
    name: string;
    tagline: string;
    location: string;
    email: string;
    linkedinUrl: string | null;
    githubUrl: string | null;
    whatsapp: string | null;
  } = {
    ...fallbackProfileBase,
    ...(profile ?? {}),
    location: baseLocation,
  };
  if (!showJob && /open to relocation/i.test(p.location)) {
    p.location = p.location.replace(/\s*·\s*Open to relocation anywhere\s*/i, "");
  }

  return (
    <footer className="relative mt-24 border-t border-border">
      <div className="gradient-mesh" aria-hidden="true" />
      <div className="container relative z-10 py-16 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet text-accent-foreground shadow-glow">
                <span className="font-mono text-xs">{"</>"}</span>
              </span>
              <span className="text-foreground">{p.name}</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">{p.tagline}</p>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {p.location}
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="Footer navigation">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Navigate
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {footerNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Reach out
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {p.email && (
                <li>
                  <a
                    href={`mailto:${p.email}`}
                    className="link-underline inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.email}
                  </a>
                </li>
              )}
              {p.linkedinUrl && (
                <li>
                  <a
                    href={p.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                    LinkedIn
                  </a>
                </li>
              )}
              {p.whatsapp && (
                <li>
                  <a
                    href={p.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                </li>
              )}
              <li>
                <Link
                  href="/cv"
                  className="link-underline inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Download CV
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Elsewhere
            </p>
            <div className="mt-4 flex items-center gap-2">
              {p.linkedinUrl && (
                <a
                  href={p.linkedinUrl}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {p.githubUrl && (
                <a
                  href={p.githubUrl}
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {p.whatsapp && (
                <a
                  href={p.whatsapp}
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                >
                  <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {p.email && (
                <a
                  href={`mailto:${p.email}`}
                  aria-label="Email"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>

            {showJob && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-500/80" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Currently available
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            © {year} {p.name}. Built with{" "}
            <Heart className="h-3 w-3 text-cat-android" aria-hidden="true" />
            in Riyadh.
          </p>
          <a
            href="#main"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to top <ArrowUp className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}