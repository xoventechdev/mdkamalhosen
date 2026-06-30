"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { cn } from "@/lib/utils";

interface FilterDef {
  value: string;
  label: string;
  color: string;
}

interface ProjectFilterProps {
  projects: ProjectCardData[];
  filters: FilterDef[];
}

export function ProjectFilter({ projects, filters }: ProjectFilterProps) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const visible = projects.filter((p) => {
    const matchesCat = active === "all" || p.category === active;
    if (!matchesCat) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.techStack ?? []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => {
            const isActive = active === f.value;
            const count =
              f.value === "all"
                ? projects.length
                : projects.filter((p) => p.category === f.value).length;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setActive(f.value)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full glass-chip px-4 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "border-accent/40 bg-accent/15 text-foreground"
                    : "text-muted-foreground hover:border-accent/40 hover:text-foreground",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full bg-current", f.color)} />
                {f.label}
                <span className="font-mono text-[11px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="h-9 w-full rounded-full glass-chip pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 rounded-2xl border-dashed p-10 text-center">
          <p className="text-base font-medium text-foreground">
            No projects match this filter yet.
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Try clearing the search or picking another category.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <ScrollReveal key={p.slug} delay={i * 50}>
              <ProjectCard project={p} className="h-full" />
            </ScrollReveal>
          ))}
        </div>
      )}
    </>
  );
}