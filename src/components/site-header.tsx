"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav";
import { SITE_DEFAULTS } from "@/lib/site-defaults";
import { ThemeToggle } from "@/components/theme-toggle";
import { COMMAND_PALETTE_TOGGLE } from "@/components/ui/command-palette";

export interface SiteHeaderProps {
  /** Full name from the profile (e.g. "Md Kamal Hosen"). When provided,
   *  the desktop brand text uses the first word as the highlighted name
   *  and the rest as the muted tail, mirroring the original layout. */
  name?: string;
}

export function SiteHeader({ name }: SiteHeaderProps = {}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function openPalette() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_TOGGLE));
    }
  }

  // Split the profile name into "highlighted first" + "muted rest" — same
  // visual treatment as the original hardcoded "Md Kamal / Hosen". Falls
  // back to the same hardcoded pair when no name is passed (so the static
  // skeleton still renders correctly during build when the profile query
  // is skipped).
  const displayName = name ?? SITE_DEFAULTS.name;
  const [firstName, ...rest] = displayName.split(/\s+/u).filter(Boolean);
  const tail = rest.join(" ");

  return (
    <header className="glass-header">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet text-accent-foreground shadow-glow transition-transform group-hover:scale-105">
            <span className="font-mono text-xs">{"</>"}</span>
          </span>
          {/* Brand text: show the full name on screens wide enough to fit it
              (≥475px — most modern phones in portrait), and fall back to the
              first name only on narrow devices where the right-side
              controls (theme toggle, menu) leave little room. The full name
              has the same visual treatment as the original hardcoded layout
              (highlighted first word + muted tail). */}
          <span className="hidden xs:inline">
            <span className="text-foreground">{firstName}</span>
            {tail && (
              <span className="ml-1.5 text-muted-foreground">{tail}</span>
            )}
          </span>
          <span className="xs:hidden">
            <span className="text-accent">{"//"}</span> {(firstName ?? "kamal").toLowerCase()}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems
            .filter((i) => !i.cta)
            .map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open search (Cmd/Ctrl-K)"
            className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground sm:inline-flex"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Search…</span>
            <kbd className="ml-2 hidden rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground lg:inline">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/cv"
            className="hidden h-9 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow sm:inline-flex"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>CV</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>

          <ThemeToggle />

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="container relative z-40 flex flex-col gap-1 py-6 animate-fade-up">
            {navItems
              .filter((i) => !i.cta)
              .map((item, i) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={cn(
                      "flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-base font-medium transition-colors animate-fade-up",
                      active
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "text-foreground hover:bg-card",
                    )}
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 opacity-50" aria-hidden="true" />
                  </Link>
                );
              })}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openPalette();
              }}
              className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-4 text-sm font-medium text-foreground"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search the site
              <kbd className="ml-2 rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <Link
              href="/cv"
              onClick={() => setOpen(false)}
              className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CV
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}