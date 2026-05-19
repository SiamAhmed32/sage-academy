import { DashboardMetricCard } from "./DashboardMetricCard";
import type { DashboardMetric } from "./types";

export function DashboardMetricsGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <DashboardMetricCard key={metric.title} metric={metric} />
      ))}
    </section>
  );
}
