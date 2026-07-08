import Link from "next/link";
import {
  BarChart3,
  Eye,
  FileText,
  FolderGit2,
  Mail,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Minus,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { compactCount, cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import { deltaTone, deltaToneClass } from "./delta";
import type { DashboardKpi, KpiIconName } from "@/server/dashboard";

const ICON_MAP: Record<KpiIconName, LucideIcon> = {
  FolderGit2,
  FileText,
  Eye,
  Mail,
  MessageSquare,
  BarChart3,
};

const DELTA_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const Icon = ICON_MAP[kpi.iconName] ?? BarChart3;
  const tone = deltaTone(kpi.deltaPct);
  const Delta = DELTA_ICON[tone];

  return (
    <Link
      href={kpi.href}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full transition-all group-hover:shadow-md group-hover:border-accent/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs uppercase tracking-wide">
            {kpi.label}
          </CardDescription>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-bold tracking-tight">
              {compactCount(kpi.value)}
            </div>
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                deltaToneClass(tone),
              )}
              aria-label={
                tone === "up" ? "Increase" : tone === "down" ? "Decrease" : "Unchanged"
              }
            >
              <Delta className="h-3 w-3" />
              {kpi.deltaPct !== 0 && (
                <span>
                  {kpi.deltaPct > 0 ? "+" : ""}
                  {kpi.deltaPct}%
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {kpi.hint}
          </p>
          <Sparkline
            points={kpi.spark}
            label={`${kpi.label} — last ${kpi.spark.length} days`}
            className="text-accent"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
