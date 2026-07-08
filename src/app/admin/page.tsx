import { loadDashboard } from "@/server/dashboard";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { ViewsChart } from "@/components/admin/dashboard/views-chart";
import { TopPostsTable } from "@/components/admin/dashboard/top-posts-table";
import { TopPagesTable } from "@/components/admin/dashboard/top-pages-table";
import { RecentActivity } from "@/components/admin/dashboard/recent-activity";
import { RecentMessages } from "@/components/admin/dashboard/recent-messages";
import { ContentHealth } from "@/components/admin/dashboard/content-health";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const data = await loadDashboard();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A quick read on the portfolio. Tap any tile to jump straight to the
          relevant admin section.
        </p>
      </header>

      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      >
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ViewsChart
            daily={data.daily}
            deltaPct={data.dailyDeltaPct}
            windowLabel={data.windowLabel}
          />
        </div>
        <div className="lg:col-span-1">
          <ContentHealth health={data.health} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopPostsTable posts={data.topPosts} />
        <TopPagesTable pages={data.topPages} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity rows={data.recentActivity} />
        <RecentMessages messages={data.messages} />
      </section>
    </div>
  );
}
