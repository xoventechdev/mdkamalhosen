"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  ArrowRight,
  Hash,
  FileText,
  FolderGit2,
  Home as HomeIcon,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMAND_PALETTE_CLOSE,
  COMMAND_PALETTE_OPEN,
  COMMAND_PALETTE_TOGGLE,
} from "@/lib/command-palette-events";
import {
  search,
  type SearchItem,
  type SearchItemType,
} from "@/lib/search-index";

const iconForType: Record<
  SearchItemType,
  React.ComponentType<{ className?: string }>
> = {
  route: HomeIcon,
  project: FolderGit2,
  post: FileText,
  page: Hash,
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Cmd/Ctrl-K command palette. Single global instance mounted in src/app/layout.tsx.
 *
 * Open toggle:
 *  - Cmd/Ctrl-K listens inside (always available)
 *  - DOM event "puku:command-palette:toggle" so other components can trigger it
 *  - DOM event "puku:command-palette:open" / ":close"
 *
 * A11y:
 *  - role="dialog" + aria-modal + aria-labelledby
 *  - Focus trap via Tab/Shift+Tab inside the dialog (RFC 412 style)
 *  - Restores focus to the previously-focused element on close
 *  - aria-activedescendant on the input reflects the highlighted result
 */
export function CommandPalette({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(defaultOpen);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const setOpenAndReset = React.useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setActive(0);
    }
  }, []);

  // Cmd/Ctrl-K listener + custom event listener.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) {
            setQuery("");
            setActive(0);
          }
          return next;
        });
      }
    }
    function onToggle() {
      setOpen((prev) => {
        const next = !prev;
        if (next) {
          setQuery("");
          setActive(0);
        }
        return next;
      });
    }
    function onOpen() {
      setOpenAndReset(true);
    }
    function onClose() {
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_TOGGLE, onToggle as EventListener);
    window.addEventListener(COMMAND_PALETTE_OPEN, onOpen as EventListener);
    window.addEventListener(COMMAND_PALETTE_CLOSE, onClose as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(
        COMMAND_PALETTE_TOGGLE,
        onToggle as EventListener,
      );
      window.removeEventListener(COMMAND_PALETTE_OPEN, onOpen as EventListener);
      window.removeEventListener(
        COMMAND_PALETTE_CLOSE,
        onClose as EventListener,
      );
    };
  }, [setOpenAndReset]);

  // Focus management: remember the trigger, focus the input on open, trap Tab.
  React.useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    const t = setTimeout(() => inputRef.current?.focus(), 10);

    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", trap);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", trap);
      // Restore focus to the previously-focused element on close.
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") {
        prev.focus();
      }
    };
  }, [open]);

  // Body scroll lock while open.
  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  const results = React.useMemo(() => search(query, 8), [query]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) navigate(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  function navigate(item: SearchItem) {
    setOpen(false);
    router.push(item.href);
  }

  if (!open) return null;

  const dialogTitleId = "command-palette-title";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh] sm:pt-[15vh]"
    >
      <h2 id={dialogTitleId} className="sr-only">
        Search the site
      </h2>
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-xl animate-spring-in">
        <div className="glass-card overflow-hidden rounded-2xl shadow-card-hover">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Search projects, posts, pages…"
              aria-label="Search query"
              aria-controls="command-palette-results"
              aria-activedescendant={
                results[active] ? `cmd-result-${active}` : undefined
              }
              className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm text-foreground outline-none"
            />
            <kbd className="text-muted-foreground hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              ESC
            </kbd>
          </div>

          <div
            id="command-palette-results"
            role="listbox"
            aria-labelledby={dialogTitleId}
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {results.length === 0 ? (
              <p className="text-muted-foreground px-3 py-8 text-center text-sm">
                {query.trim()
                  ? `No results for "${query}".`
                  : "Type to search projects, posts, and pages."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {results.map((item, i) => {
                  const Icon = iconForType[item.type] ?? Compass;
                  const selected = i === active;
                  return (
                    <li key={item.href + item.title}>
                      <button
                        id={`cmd-result-${i}`}
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => navigate(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          selected
                            ? "bg-accent/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border",
                            selected
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "text-muted-foreground border-border bg-card",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="text-muted-foreground block truncate text-xs">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                        {selected ? (
                          <CornerDownLeft
                            className="h-3.5 w-3.5 text-accent"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowRight
                            className="text-muted-foreground/40 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="text-muted-foreground flex items-center justify-between border-t border-border px-3 py-2 text-[11px]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
                  ↑
                </kbd>
                <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
                  ↓
                </kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
                  ↵
                </kbd>
                open
              </span>
            </div>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">
                ⌘K
              </kbd>
              toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
