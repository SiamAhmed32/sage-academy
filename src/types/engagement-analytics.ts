/** Shared type for engagement analytics (safe for client + server). */
export type EngagementAnalytics = {
  totalAllTime: number;
  totalInRange: number;
  byDay: { dateKey: string; count: number }[];
  byType: { eventType: string; count: number }[];
  recent: unknown[];
};
