export type AssessmentRegistrationFilterInput = {
  q: string;
  status: string;
  assessmentKind: string;
  assessmentType: string;
  classLabel: string;
  applicantType: string;
  dateRange: string;
};

function escapedRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildAssessmentRegistrationFilter(input: AssessmentRegistrationFilterInput): Record<string, unknown> {
  const { q, status, assessmentKind, assessmentType, classLabel, applicantType, dateRange } = input;
  const query: Record<string, unknown> = {};

  if (q.trim()) {
    const trimmed = q.trim();
    const regex = { $regex: escapedRegex(trimmed), $options: "i" };
    const digits = trimmed.replace(/\D/g, "");

    query.$or = [
      { assessmentTitle: regex },
      { assessmentType: regex },
      { name: regex },
      { phone: regex },
      { classLabel: regex },
      { version: regex },
      { schoolName: regex },
      { selectedSubjects: regex },
      { message: regex },
      { adminNote: regex },
      ...(digits.length >= 3 ? [{ phone: { $regex: escapedRegex(digits), $options: "i" } }] : []),
    ];
  }

  if (status !== "all") query.status = status;
  if (assessmentKind !== "all") query.assessmentKind = assessmentKind;
  if (assessmentType !== "all") query.assessmentType = assessmentType;
  if (classLabel !== "all") query.classLabel = classLabel;
  if (applicantType !== "all") query.applicantType = applicantType;

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
