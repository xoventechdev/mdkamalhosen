/**
 * Pure-SVG bar chart for daily page-view counts. No JS, no charting
 * library — server-renderable so the analytics page stays fast.
 *
 * The chart always renders the full series passed in, so the caller
 * is responsible for pre-padding any zero days (see
 * `getAnalyticsSummary` in `src/server/queries.ts`).
 */

export interface DailyPoint {
  day: string; // ISO date "YYYY-MM-DD"
  count: number;
}

export interface ViewsBarChartProps {
  points: DailyPoint[];
  /** Optional fixed height in px; default 180. */
  height?: number;
}

/**
 * Render a `<svg>` bar chart with one bar per day. Bars share the
 * same baseline; tall bars are clamped to the height. Y-axis ticks
 * are derived from the data.
 */
export function ViewsBarChart({ points, height = 180 }: ViewsBarChartProps) {
  const safe = points.length > 0 ? points : [{ day: "", count: 0 }];
  const max = Math.max(1, ...safe.map((p) => p.count));
  const total = safe.reduce((s, p) => s + p.count, 0);
  const width = 720; // viewBox; the SVG scales fluidly to container
  const padX = 24;
  const padTop = 12;
  const padBottom = 28;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const barGap = 6;
  const barW = Math.max(
    4,
    (innerW - barGap * (safe.length - 1)) / safe.length,
  );

  // Y-axis ticks: 0, mid, max (rounded up). Use 4 ticks max for
  // readability on a small inline chart.
  const yTicks = [0, Math.round(max * 0.5), max];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Daily views for the last ${safe.length} days; total ${total}.`}
        className="h-[180px] w-full"
      >
        {/* Y grid lines + labels */}
        {yTicks.map((tick, i) => {
          const y = padTop + innerH - (tick / max) * innerH;
          return (
            <g key={`yt-${i}`}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={i === 0 ? 0.4 : 0.15}
                strokeWidth={1}
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {safe.map((p, i) => {
          const h = (p.count / max) * innerH;
          const x = padX + i * (barW + barGap);
          const y = padTop + innerH - h;
          return (
            <g key={p.day || `empty-${i}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx={2}
                className="fill-accent"
              >
                <title>{`${p.day}: ${p.count} view${p.count === 1 ? "" : "s"}`}</title>
              </rect>
              {i % Math.ceil(safe.length / 7) === 0 && (
                <text
                  x={x + barW / 2}
                  y={padTop + innerH + 16}
                  textAnchor="start"
                  className="fill-muted-foreground"
                  fontSize={10}
                >
                  {p.day.slice(5)}
                </text>
              )}
            </g>
          );
        })}

        {/* Total label */}
        <text
          x={width - padX}
          y={padTop + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={11}
        >
          total {total}
        </text>
      </svg>
    </div>
  );
}