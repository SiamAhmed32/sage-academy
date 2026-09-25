// Admin navigation lives in `constants/admin-nav.ts`.

export const requestStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

export const contactStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

export const freeClassLeadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "attended", label: "Attended" },
  { value: "invalid", label: "Invalid number or information" },
  { value: "closed", label: "Closed" },
];

export const userRoleOptions = [
  { value: "student", label: "Student" },
  { value: "guardian", label: "Guardian" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];
