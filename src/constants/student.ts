import {
  BellRing,
  CalendarDays,
  CreditCard,
  FileCheck2,
  Home,
  UserRound,
} from "lucide-react";

export const studentNavGroups = [
  {
    title: "মূল মেনু",
    items: [
      { label: "ড্যাশবোর্ড", href: "/student", icon: Home },
      { label: "ক্লাস রুটিন", href: "/student/routine", icon: CalendarDays },
      { label: "নোটিশ", href: "/student/notices", icon: BellRing },
      { label: "পেমেন্ট", href: "/student/payments", icon: CreditCard },
      { label: "ফলাফল", href: "/student/results", icon: FileCheck2 },
    ],
  },
  {
    title: "অ্যাকাউন্ট",
    items: [{ label: "প্রোফাইল", href: "/student/profile", icon: UserRound }],
  },
];

export const studentNavItems = studentNavGroups.flatMap((group) => group.items);
