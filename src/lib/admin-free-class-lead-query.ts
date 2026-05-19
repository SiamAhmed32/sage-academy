/** Shared Mongo filter for admin free-class list + CSV export. */
export function buildFreeClassLeadFilter(input: {
  q: string;
  status: string;
  source: string;
  classLabel: string;
  dateRange: string;
}): Record<string, unknown> {
  const { q, status, source, classLabel, dateRange } = input;
  const query: Record<string, unknown> = {};

  if (q.trim()) {
    const trimmed = q.trim();
    const qDigits = trimmed.replace(/\D/g, "");
    query.$or = [
      { name: { $regex: trimmed, $options: "i" } },
      { subject: { $regex: trimmed, $options: "i" } },
      { classLabel: { $regex: trimmed, $options: "i" } },
      ...(qDigits.length >= 3 ? [{ phone: { $regex: qDigits, $options: "i" } }] : []),
    ];
  }
  if (status !== "all") query.status = status;
  if (source !== "all") query.source = source;
  if (classLabel !== "all") query.classLabel = classLabel;

  if (dateRange !== "all") {
    const now = new Date();
    const start = new Date();
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "week") start.setDate(now.getDate() - 7);
    else if (dateRange === "month") start.setMonth(now.getMonth() - 1);
    query.createdAt = { $gte: start };
  }

  return query;
}
