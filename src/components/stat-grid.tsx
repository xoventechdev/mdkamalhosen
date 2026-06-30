import { ScrollReveal } from "@/components/scroll-reveal";

interface Stat {
  value: string;
  label: string;
  color?: string;
}

const stats: Stat[] = [
  { value: "5+", label: "Years international", color: "text-accent" },
  { value: "KAFD", label: "District commissioned", color: "text-cat-bms" },
  { value: "100K+", label: "App downloads", color: "text-cat-android" },
  { value: "6", label: "Honeywell + Tridium certs", color: "text-cat-software" },
];

export function StatGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((s, i) => (
        <ScrollReveal
          key={s.label}
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