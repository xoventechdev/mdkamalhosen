import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-2.5",
} as const;

export function SkillBar({
  level,
  max = 5,
  size = "md",
  className,
}: {
  level: number;
  max?: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (level / max) * 100));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        sizes[size],
        className,
      )}
      role="img"
      aria-label={`Skill level: ${level} of ${max}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-[rgb(var(--cat-software))] transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}