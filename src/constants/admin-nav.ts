import {
  ArrowLeftRight,
  BadgeDollarSign,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Gift,
  GraduationCap,
  Inbox,
  Layers,
  Layout,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MessageSquare,
  Quote,
  Receipt,
  Shield,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: "admissionRequests";
};

export type AdminNavGroup = {
  title: string;
  /** Collapsible groups start closed unless one of their pages is open. */
  collapsible?: boolean;
  /** Top-level links with no heading. Always shown. */
  bare?: boolean;
  items: AdminNavItem[];
};

// The daily academy workflow sits at the top in the order it is used:
// set up classes → subjects → batches, admit students, then collect fees.
export const saNavGroups: AdminNavGroup[] = [
  {
    title: "Workspace",
    bare: true,
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Admission requests", href: "/admin/admissions", icon: Inbox, countKey: "admissionRequests" },
    ],
  },
  {
    title: "Academics",
    collapsible: true,
    items: [
      { label: "Classes", href: "/admin/academy/classes", icon: Layers },
      { label: "Subjects", href: "/admin/academy/subjects", icon: BookOpen },
      { label: "Batches", href: "/admin/academy/batches", icon: ListChecks },
      { label: "Class routine", href: "/admin/academy/timetable", icon: CalendarDays },
      { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
    ],
  },
  {
    title: "Students",
    collapsible: true,
    items: [
      { label: "New admission", href: "/admin/academy/admission", icon: UserPlus },
      { label: "Students", href: "/admin/academy/students", icon: UsersRound },
      { label: "Transfer subject", href: "/admin/academy/transfer", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Finance",
    collapsible: true,
    items: [
      { label: "Collect payment", href: "/admin/academy/payments", icon: Wallet },
      { label: "Dues", href: "/admin/academy/dues", icon: BadgeDollarSign },
      { label: "Receipts", href: "/admin/academy/receipts", icon: Receipt },
    ],
  },
  {
    title: "Marketing leads",
    collapsible: true,
    items: [
      { label: "Contact messages", href: "/admin/contacts", icon: MessageSquare },
      { label: "Free class leads", href: "/admin/free-class-leads", icon: Gift },
      { label: "Assessment leads", href: "/admin/assessment-registrations", icon: ClipboardCheck },
      { label: "Quiz leads", href: "/admin/quiz-leads", icon: Users },
      { label: "Funnel and events", href: "/admin/engagement", icon: LineChart },
    ],
  },
  {
    title: "Website content",
    collapsible: true,
    items: [
      { label: "Notices", href: "/admin/notices", icon: Bell },
      { label: "Website batches", href: "/admin/academic-batches", icon: BookOpen },
      { label: "Promotion cards", href: "/admin/promotion-cards", icon: Layout },
      { label: "Quiz questions", href: "/admin/quizzes", icon: BookOpen },
      { label: "Model tests", href: "/admin/model-tests", icon: ClipboardCheck },
      { label: "Exam hub", href: "/admin/exam-hub", icon: Trophy },
      { label: "Exams", href: "/admin/exams", icon: CalendarDays },
      { label: "Testimonials", href: "/admin/testimonials", icon: Quote },
    ],
  },
  {
    title: "System",
    collapsible: true,
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Role guide", href: "/admin/roles", icon: Shield },
    ],
  },
];

const ROOT_HREFS = new Set(["/admin", "/student"]);

export function isSaNavActive(pathname: string, href: string) {
  return pathname === href || (!ROOT_HREFS.has(href) && pathname.startsWith(`${href}/`));
}

/** The nav item that best matches the current path (longest prefix wins). */
export function activeSaNavItem(pathname: string, groups: AdminNavGroup[] = saNavGroups) {
  let best: AdminNavItem | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      if (isSaNavActive(pathname, item.href) && (!best || item.href.length > best.href.length)) {
        best = item;
      }
    }
  }
  return best;
}
