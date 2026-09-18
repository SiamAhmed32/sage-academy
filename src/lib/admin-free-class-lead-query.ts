/** Shared Mongo filter for admin free-class list + CSV export. */
const MAX_SEARCH_LENGTH = 100;

function escapedRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    const trimmed = q.trim().slice(0, MAX_SEARCH_LENGTH);
    const qDigits = trimmed.replace(/\D/g, "");
    const regex = { $regex: escapedRegex(trimmed), $options: "i" };
    query.$or = [
      { name: regex },
      { subject: regex },
      { classLabel: regex },
      ...(qDigits.length >= 3
        ? [{ phone: { $regex: escapedRegex(qDigits.slice(0, 20)), $options: "i" } }]
        : []),
    ];
  }
  if (["new", "contacted", "scheduled", "attended", "invalid", "closed"].includes(status)) {
    query.status = status;
  }
  if (["guest", "registered"].includes(source)) query.source = source;
  if (classLabel !== "all") query.classLabel = classLabel;

  if (["today", "week", "month"].includes(dateRange)) {
    const now = new Date();
    const start = new Date();
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "week") start.setDate(now.getDate() - 7);
    else if (dateRange === "month") start.setDate(now.getDate() - 30);
    query.createdAt = { $gte: start };
  }

  return query;
}
