import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SkillBar } from "@/components/skill-bar";
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

const groups: Array<{
  name: string;
  color: string;
  accent: string;
  skills: Array<{ name: string; platform?: string; years?: number; level: number }>;
}> = [
  {
    name: "Building Automation",
    color: "text-cat-bms",
    accent: "from-cat-bms",
    skills: [
      { name: "Honeywell Alerton", platform: "Alerton", years: 5, level: 5 },
      { name: "Tridium Niagara 4", platform: "Niagara 4", years: 5, level: 5 },
      { name: "DDC Controllers", years: 5, level: 5 },
      { name: "BACnet (IP/MSTP)", years: 5, level: 5 },
      { name: "Modbus (RTU/TCP)", years: 4, level: 4 },
      { name: "M-Bus", years: 2, level: 3 },
      { name: "HVAC Control Logic", years: 5, level: 5 },
      { name: "Functional Testing", years: 5, level: 5 },
      { name: "Energy Optimisation", years: 3, level: 4 },
      { name: "System Fault Analysis", years: 5, level: 5 },
      { name: "Network Debugging", years: 5, level: 4 },
      { name: "Graphics", years: 4, level: 4 },
    ],
  },
  {
    name: "Programming",
    color: "text-cat-software",
    accent: "from-cat-software",
    skills: [
      { name: "Java", years: 3, level: 4 },
      { name: "JavaScript", years: 4, level: 4 },
      { name: "Python", years: 2, level: 3 },
      { name: "Node.js", years: 3, level: 4 },
      { name: "React", years: 3, level: 4 },
      { name: "Next.js", years: 3, level: 4 },
      { name: "PHP", years: 2, level: 3 },
      { name: "MySQL", years: 3, level: 3 },
      { name: "SQLite", years: 2, level: 3 },
      { name: "MongoDB", years: 2, level: 3 },
      { name: "Prisma", years: 2, level: 4 },
    ],
  },
  {
    name: "IoT",
    color: "text-cat-iot",
    accent: "from-cat-iot",
    skills: [
      { name: "ESP8266", years: 2, level: 3 },
      { name: "MQTT", years: 2, level: 3 },
      { name: "REST API", years: 3, level: 4 },
      { name: "Sensor integration", years: 2, level: 3 },
    ],
  },
  {
    name: "AI Tools",
    color: "text-cat-android",
    accent: "from-cat-android",
    skills: [
      { name: "ChatGPT", years: 2, level: 5 },
      { name: "Claude", years: 2, level: 5 },
      { name: "Gemini", years: 1, level: 4 },
      { name: "Cursor", years: 1, level: 4 },
      { name: "GitHub Copilot", years: 1, level: 4 },
    ],
  },
  {
    name: "Cloud & Tooling",
    color: "text-accent",
    accent: "from-accent",
    skills: [
      { name: "Firebase", years: 2, level: 3 },
      { name: "Supabase", years: 1, level: 4 },
      { name: "Linux", years: 3, level: 3 },
      { name: "Git", years: 4, level: 4 },
      { name: "GitHub", years: 4, level: 4 },
    ],
  },
];

const levelLabel = (l: number) =>
  l >= 5 ? "Expert" : l >= 4 ? "Advanced" : l >= 3 ? "Proficient" : "Learning";

const groupColorByName: Record<string, { color: string; accent: string }> = {
  "Building Automation": { color: "text-cat-bms", accent: "from-cat-bms" },
  "Programming": { color: "text-cat-software", accent: "from-cat-software" },
  "IoT": { color: "text-cat-iot", accent: "from-cat-iot" },
  "AI Tools": { color: "text-cat-android", accent: "from-cat-android" },
  "Cloud & Tooling": { color: "text-accent", accent: "from-accent" },
};
const defaultGroupColor = { color: "text-accent", accent: "from-accent" };

async function loadGroups() {
  try {
    const rows = await getSkillGroups();
    if (rows.length === 0) return groups;
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
  } catch (e) {
    console.error("[skills] loadGroups failed:", e);
    return groups;
  }
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

  // Core stack — top 2 skills per group, level 4+.
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
          {/* Core stack hero strip */}
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
        </div>
      </section>
    </>
  );
}