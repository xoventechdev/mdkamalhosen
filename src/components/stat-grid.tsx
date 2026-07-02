import { ScrollReveal } from "@/components/scroll-reveal";

export interface Stat {
  value: string;
  label: string;
  color?: string;
}

export interface StatGridProps {
  stats: Stat[];
}

export function StatGrid({ stats }: StatGridProps) {
  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        No stats configured yet. Add some in{" "}
        <a href="/admin/profile" className="text-accent hover:underline">
          Admin → Profile
        </a>
        .
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((s, i) => (
        <ScrollReveal
          key={`${s.value}-${s.label}`}
          delay={i * 80}
          as="div"
          className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5"
        >
          <div
            className={`text-2xl font-semibold tracking-tight sm:text-3xl ${s.color ?? "text-foreground"}`}
          >
            {s.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {s.label}
          </div>
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-accent/5 blur-xl" />
        </ScrollReveal>
      ))}
    </div>
  );
}