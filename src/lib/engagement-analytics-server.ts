import EngagementEvent from "@/models/EngagementEvent";
import { connectDB } from "@/lib/mongodb";
import type { EngagementAnalytics } from "@/types/engagement-analytics";

function startOfDayUtc(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Dashboard + admin engagement analytics (server-only).
 */
export async function getEngagementAnalytics(days: number): Promise<EngagementAnalytics> {
  await connectDB();

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - Math.max(1, Math.min(days, 90)));

  const [totalAllTime, totalInRange, byTypeAgg, dailyAgg, recent] = await Promise.all([
    EngagementEvent.countDocuments(),
    EngagementEvent.countDocuments({ createdAt: { $gte: since } }),
    EngagementEvent.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    EngagementEvent.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    EngagementEvent.find({})
      .sort({ createdAt: -1 })
      .limit(80)
      .lean(),
  ]);

  const countByDay = new Map(dailyAgg.map((row) => [row._id, row.count]));

  const byDay: { dateKey: string; count: number }[] = [];
  const endDay = startOfDayUtc(now);
  const walk = startOfDayUtc(since);
  while (walk <= endDay) {
    const key = formatDateKey(walk);
    byDay.push({ dateKey: key, count: countByDay.get(key) ?? 0 });
    walk.setUTCDate(walk.getUTCDate() + 1);
  }

  return {
    totalAllTime,
    totalInRange,
    byDay,
    byType: byTypeAgg.map((t) => ({ eventType: t._id, count: t.count })),
    recent,
  };
}
