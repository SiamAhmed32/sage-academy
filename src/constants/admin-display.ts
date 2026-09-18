export const adminClassLevelOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `Class ${index + 1}`,
}));

export function getAdminClassLabel(level: number | string) {
  const value = Number(level);
  return Number.isFinite(value) ? `Class ${value}` : "Class not set";
}

export const adminRoleLabels: Record<string, string> = {
  student: "Student",
  guardian: "Guardian",
  manager: "Manager",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const adminStatusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  confirmed: "Confirmed",
  closed: "Closed",
  spam: "Spam",
  scheduled: "Scheduled",
  attended: "Attended",
  invalid: "Invalid",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
  draft: "Draft",
  published: "Published",
  hidden: "Hidden",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  submitted: "Submitted",
  started: "Started",
  completed: "Completed",
  expired: "Expired",
  paid: "Paid",
  partial: "Partially Paid",
  unpaid: "Unpaid",
  due: "Due",
  reversed: "Reversed",
};

export function getAdminStatusLabel(value: string) {
  return (
    adminStatusLabels[value] ??
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export const adminGenderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  combined: "Combined",
  other: "Other",
};

export const adminVersionLabels: Record<string, string> = {
  bangla: "Bangla Version",
  english: "English Version",
  both: "Bangla and English Versions",
  other: "Other",
};

export const adminWeekdayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
