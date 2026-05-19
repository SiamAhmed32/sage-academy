import type { LucideIcon } from "lucide-react";

export type DashboardLead = {
  id: string;
  name: string;
  phone: string;
  className: string;
  source: "Admission" | "Contact" | "Free class";
  status: string;
  time: string;
  timestamp: number;
  type: "admission" | "contact" | "free_class";
};

export type DashboardClass = {
  id: string;
  title: string;
  time: string;
  subject: string;
};

export type DashboardMetric = {
  title: string;
  value: number;
  note: string;
  href: string;
  icon: LucideIcon;
  urgent?: boolean;
};
