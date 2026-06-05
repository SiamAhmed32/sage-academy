import type { LucideIcon } from "lucide-react";

export type DashboardLead = {
  id: string;
  name: string;
  phone: string;
  className: string;
  source: "Admission" | "Contact" | "Free class" | "Assessment" | "Quiz";
  status: string;
  time: string;
  timestamp: number;
  type: "admission" | "contact" | "free_class" | "assessment" | "quiz";
};

export type DashboardClass = {
  id: string;
  title: string;
  time: string;
  subject: string;
};

export type DashboardMetric = {
  title: string;
  value: string | number;
  note: string;
  href: string;
  icon: LucideIcon;
  urgent?: boolean;
};

export type FinancialStats = {
  expected: number;
  collected: number;
  due: number;
};

export type PaymentTrend = {
  label: string;
  collected: number;
  expected: number;
};

export type Demographics = {
  versionDistribution: {
    bangla: number;
    english: number;
    other: number;
  };
  classDistribution: Array<{
    classLevel: number;
    count: number;
  }>;
};
