import { BellRing, CalendarDays, FileCheck2, LayoutDashboard, UserRound, Wallet } from "lucide-react";

import type { AdminNavGroup } from "@/constants/admin-nav";

// Student / guardian portal navigation (Bangla labels for families).
export const studentPortalNavGroups: AdminNavGroup[] = [
  {
    title: "Workspace",
    collapsible: true,
    items: [
      { label: "ড্যাশবোর্ড", href: "/student", icon: LayoutDashboard },
      { label: "ক্লাস রুটিন", href: "/student/routine", icon: CalendarDays },
      { label: "ফি ও রসিদ", href: "/student/payments", icon: Wallet },
      { label: "নোটিশ", href: "/student/notices", icon: BellRing },
      { label: "ফলাফল", href: "/student/results", icon: FileCheck2 },
    ],
  },
  {
    title: "Account",
    collapsible: true,
    items: [{ label: "প্রোফাইল", href: "/student/profile", icon: UserRound }],
  },
];
