import Link from "next/link";
import { Github, Linkedin, Mail, ArrowUp, MapPin, Heart, Download } from "lucide-react";
import { footerNavItems } from "@/lib/nav";

interface SiteFooterProps {
  /** Optional profile overrides — passed from layout once `getProfile` is wired in. */
  profile?: {
    name?: string;
    tagline?: string;
    location?: string;
    email?: string;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    whatsapp?: string | null;
  } | null;
}

const fallbackProfile = {
  name: "Md Kamal Hosen",
  tagline:
    "Building Management System Engineer commissioning HVAC plants and shipping the software that runs them.",
  location: "Riyadh, Saudi Arabia · Open to relocation anywhere",
  email: "mdkamalhosennn@gmail.com",
  linkedinUrl: "https://linkedin.com/in/mdkamalhosennn",
  githubUrl: "https://github.com/mdkamalhosennn",
  whatsapp: "https://wa.me/966583471377",
};

export function SiteFooter({ profile = null }: SiteFooterProps) {
  const year = new Date().getUTCFullYear();
  const p = { ...fallbackProfile, ...(profile ?? {}) };

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

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-500/80" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Currently available
            </div>
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