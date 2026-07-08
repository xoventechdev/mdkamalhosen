import { cn } from "@/lib/utils";

/**
 * Inline SVG sparkline. Server-renderable, zero JS. The polyline is drawn in
 * `currentColor` so callers can tint via `className` (e.g. `text-accent`,
 * `text-emerald-500`, etc.). Includes a hidden `<title>` for screen readers.
 */
export interface SparklineProps {
  points: number[];
  /** viewBox width; height is fixed at 30 to keep tiles compact. */
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  /** Accessible label, e.g. "Activity trend last 14 days". */
  label?: string;
}

export function Sparkline({
  points,
  width = 120,
  height = 30,
  strokeWidth = 1.75,
  className,
  label,
}: SparklineProps) {
  const safe = points.length > 0 ? points : [0];
  const max = Math.max(1, ...safe);
  const min = Math.min(0, ...safe);
  const range = max - min || 1;
  const stepX = safe.length > 1 ? width / (safe.length - 1) : 0;

  const coords = safe.map((v, i) => {
    const x = i * stepX;
    // Flip Y so higher = up.
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const pointsAttr = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const last = coords[coords.length - 1] ?? [0, height / 2];
  const total = safe.reduce((a, b) => a + b, 0);
  const peak = Math.max(...safe);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block h-7 w-full text-accent", className)}
      preserveAspectRatio="none"
    >
      {label && (
        <title>{`${label}: ${total} total, peak ${peak}`}</title>
      )}
      <polyline
        points={pointsAttr}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2}
        className="fill-accent"
      />
    </svg>
  );
}
