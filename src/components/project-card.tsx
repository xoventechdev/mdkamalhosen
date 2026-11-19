"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CategoryBadge } from "@/components/badge";
import { cn } from "@/lib/utils";

const accentByCategory: Record<string, string> = {
  bms: "group-hover:border-cat-bms/40",
  software: "group-hover:border-cat-software/40",
  iot: "group-hover:border-cat-iot/40",
  android: "group-hover:border-cat-android/40",
};

const glowByCategory: Record<string, string> = {
  bms: "shadow-glow-bms",
  software: "shadow-glow-software",
  iot: "shadow-glow-iot",
  android: "shadow-glow-android",
};

const coverByCategory: Record<string, string> = {
  bms: "cover-gradient-bms",
  software: "cover-gradient-software",
  iot: "cover-gradient-iot",
  android: "cover-gradient-android",
};

export interface ProjectCardData {
  slug: string;
  title: string;
  excerpt: string;
  category: "bms" | "software" | "iot" | "android";
  /**
   * Free-form year label. Accepts legacy `number` years (e.g. 2024)
   * for backwards compatibility with projects created before the
   * flexible label was introduced, plus new string values like
   * `"2024"`, `"2024 - 2026"`, or `"2025 - Present"`.
   */
  year?: number | string;
  techStack?: string[];
  coverUrl?: string;
}

export function ProjectCard({
  project,
  className,
}: {
  project: ProjectCardData;
  className?: string;
}) {
  const coverClass = coverByCategory[project.category];

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover",
        accentByCategory[project.category],
        className,
      )}
    >
      {/* Cover area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={`${project.title} cover`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={70}
            className="object-cover"
          />
        ) : (
          <div
            className={cn("absolute inset-0", coverClass)}
            aria-hidden="true"
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <CategoryBadge category={project.category} />
          {project.year && (
            <span className="text-muted-foreground font-mono text-xs">
              {project.year}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-lg font-semibold tracking-tight">
          {project.title}
        </h3>
        <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
          {project.excerpt}
        </p>

        {project.techStack && project.techStack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-muted-foreground rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium"
              >
                {t}
              </span>
            ))}
            {project.techStack.length > 3 && (
              <span className="text-muted-foreground px-1 text-[11px]">
                +{project.techStack.length - 3}
              </span>
            )}
          </div>
        )}

        <span
          className={cn(
            "mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          )}
        >
          Read case study{" "}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
