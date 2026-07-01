import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillBar } from "@/components/skill-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { getSkillGroups } from "@/server/queries";
import { cn, absoluteUrl } from "@/lib/utils";

export const revalidate = 60;

const ogImage = absoluteUrl(
  "/api/og?type=default&title=Skills&subtitle=Building+automation+%C2%B7+Software+%C2%B7+IoT+%C2%B7+AI",
);

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Grouped skills matrix — BMS, programming, IoT, AI tools, cloud and networking — with levels and platforms.",
  alternates: { canonical: "/skills" },
  openGraph: {
    title: "Skills",
    description:
      "Grouped skills matrix — BMS, programming, IoT, AI tools, cloud and networking.",
    url: absoluteUrl("/skills"),
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Skills — Md Kamal Hosen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skills — Md Kamal Hosen",
    description: "Grouped skills matrix — BMS, programming, IoT, AI tools, cloud and networking.",
    images: [ogImage],
  },
};

// `groupColorByName` maps DB-stored group names to their display styling.
// If a DB group name isn't in this map, `defaultGroupColor` is used. This
// is presentation config, not a DB-fallback — keep it.
const groupColorByName: Record<string, { color: string; accent: string }> = {
  "Building Automation": { color: "text-cat-bms", accent: "from-cat-bms" },
  "Programming": { color: "text-cat-software", accent: "from-cat-software" },
  "IoT": { color: "text-cat-iot", accent: "from-cat-iot" },
  "AI Tools": { color: "text-cat-android", accent: "from-cat-android" },
  "Cloud & Tooling": { color: "text-accent", accent: "from-accent" },
};
const defaultGroupColor = { color: "text-accent", accent: "from-accent" };

const levelLabel = (l: number) =>
  l >= 5 ? "Expert" : l >= 4 ? "Advanced" : l >= 3 ? "Proficient" : "Learning";

type PublicSkillGroup = {
  name: string;
  color: string;
  accent: string;
  skills: Array<{ name: string; platform?: string; years?: number; level: number }>;
};

async function loadGroups(): Promise<PublicSkillGroup[]> {
  // Errors bubble to the nearest error.tsx — same convention as the home page.
  // No static fallback: an empty DB renders an EmptyState so this page
  // always matches the admin panel's view.
  const rows = (await getSkillGroups()) as unknown as Array<{
    name: string;
    skills: Array<{
      name: string;
      platform?: string | null;
      years?: number | null;
      level: number;
    }>;
  }>;
  return rows.map((g) => {
    const colors = groupColorByName[g.name] ?? defaultGroupColor;
    return {
      name: g.name,
      color: colors.color,
      accent: colors.accent,
      skills: g.skills.map((s) => ({
        name: s.name,
        platform: s.platform ?? undefined,
        years: s.years ?? undefined,
        level: s.level,
      })),
    };
  });
}

const categoryChipColors: Record<string, string> = {
  "Building Automation": "text-cat-bms border-cat-bms/30 bg-cat-bms/10",
  "Programming": "text-cat-software border-cat-software/30 bg-cat-software/10",
  "IoT": "text-cat-iot border-cat-iot/30 bg-cat-iot/10",
  "AI Tools": "text-cat-android border-cat-android/30 bg-cat-android/10",
  "Cloud & Tooling": "text-accent border-accent/30 bg-accent/10",
};

export default async function SkillsPage() {
  const groupsData = await loadGroups();

  // Core stack — top 2 skills per group, level 4+. Derived from DB; if the
  // DB is empty this list is also empty, which is fine.
  const coreStack = groupsData.flatMap((g) =>
    g.skills
      .filter((s) => s.level >= 4)
      .slice(0, 2)
      .map((s) => ({ ...s, group: g.name })),
  );

  return (
    <>
      <PageHeader
        eyebrow="Skills"
        title="A matrix across two disciplines"
        description="Grouped by domain with a self-assessed level on a 5-step scale. The point is not to be exhaustive — it is to show where I'm strongest and where I'm honest about being mid."
      />
      <section>
        <div className="container py-12 md:py-20">
          {groupsData.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No skill groups yet."
              description="Skill groups are managed from the admin panel. Add one and it will appear here within seconds."
              action={
                <Link
                  href="/admin/skills"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:shadow-glow"
                >
                  Open admin
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            />
          ) : (
            <>
              {/* Core stack hero strip */}
              {coreStack.length > 0 && (
                <div className="glass-card mb-12 p-6 sm:p-8">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Core stack
                    </p>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    What I reach for first. Anything at level 4 or 5 across the matrix
                    below.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {coreStack.map((s) => {
                      const chipColor =
                        categoryChipColors[s.group] ?? "text-accent border-accent/30 bg-accent/10";
                      return (
                        <span
                          key={s.group + s.name}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                            chipColor,
                          )}
                        >
                          {s.name}
                          <span className="font-mono text-[10px] opacity-70">
                            · {levelLabel(s.level)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grouped matrices */}
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {groupsData.map((g, gi) => (
                  <ScrollReveal
                    as="article"
                    key={g.name}
                    delay={gi * 80}
                    className="relative overflow-hidden rounded-2xl glass-card p-6"
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent opacity-20 blur-2xl",
                        g.accent,
                      )}
                      aria-hidden="true"
                    />
                    <div className="relative flex items-center justify-between">
                      <h2 className={cn("text-base font-semibold", g.color)}>
                        {g.name}
                      </h2>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {g.skills.length} skills
                      </span>
                    </div>
                    <ul className="relative mt-5 space-y-3.5">
                      {g.skills.map((s) => (
                        <li key={s.name}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium">{s.name}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {levelLabel(s.level)}
                              {s.years ? ` · ${s.years}y` : ""}
                            </span>
                          </div>
                          <SkillBar level={s.level} size="sm" className="mt-1.5" />
                        </li>
                      ))}
                    </ul>
                  </ScrollReveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
