import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ViewsBarChart,
  type DailyPoint,
} from "@/components/analytics/views-svg-chart";
import { compactCount, cn } from "@/lib/utils";
import { deltaTone, deltaToneClass } from "./delta";

export interface ViewsChartProps {
  daily: DailyPoint[];
  /** Pre-computed signed delta vs. the previous 30 days (server-side). */
  deltaPct: number;
  windowLabel: string;
}

export function ViewsChart({ daily, deltaPct, windowLabel }: ViewsChartProps) {
  const total = daily.reduce((s, p) => s + p.count, 0);
  const tone = deltaTone(deltaPct);
  const Arrow = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Page views</CardTitle>
          <CardDescription>
            {daily.length} days · {compactCount(total)} views
          </CardDescription>
        </div>
        <div
          aria-label={
            tone === "up"
              ? "Increase"
              : tone === "down"
                ? "Decrease"
                : "No change"
          }
          className="text-right"
        >
          <div
            className={cn(
              "inline-flex items-center gap-1 text-sm font-semibold",
              deltaToneClass(tone),
            )}
          >
            <Arrow className="h-4 w-4" />
            {deltaPct === 0 ? "—" : `${deltaPct > 0 ? "+" : ""}${deltaPct}%`}
          </div>
          <p className="text-xs text-muted-foreground">{windowLabel}</p>
        </div>
      </CardHeader>
      <CardContent>
        <ViewsBarChart points={daily} height={200} />
      </CardContent>
    </Card>
  );
}
