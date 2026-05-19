import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Gift,
  GraduationCap,
  Home,
  Inbox,
  Layout,
  LineChart,
  MessageSquare,
  Quote,
  Shield,
  Users,
} from "lucide-react";

export const adminNavGroups = [
  {
    title: "ওভারভিউ",
    items: [{ label: "ড্যাশবোর্ড", href: "/admin", icon: Home }],
  },
  {
    title: "লিড ও ভর্তি",
    items: [
      { label: "ভর্তি আবেদন", href: "/admin/admissions", icon: Inbox },
      { label: "যোগাযোগ", href: "/admin/contacts", icon: MessageSquare },
      { label: "ফ্রি ক্লাস লিড", href: "/admin/free-class-leads", icon: Gift },
      { label: "টেস্ট/Exam লিড", href: "/admin/assessment-registrations", icon: ClipboardCheck },
      { label: "কুইজ লিড", href: "/admin/quiz-leads", icon: Users },
      { label: "ফানেল / ইভেন্ট", href: "/admin/engagement", icon: LineChart },
    ],
  },
  {
    title: "একাডেমিক অপারেশন",
    items: [
      { label: "শিক্ষার্থী", href: "/admin/students", icon: Users },
      { label: "পেমেন্ট", href: "/admin/payments", icon: CreditCard },
      { label: "ক্লাস রুটিন", href: "/admin/routine", icon: CalendarDays },
      { label: "নোটিশ", href: "/admin/notices", icon: Bell },
      { label: "একাডেমিক ব্যাচ", href: "/admin/academic-batches", icon: BookOpen },
      { label: "শিক্ষক", href: "/admin/teachers", icon: GraduationCap },
    ],
  },
  {
    title: "ওয়েবসাইট কনটেন্ট",
    items: [
      { label: "কুইজ প্রশ্ন", href: "/admin/quizzes", icon: BookOpen },
      { label: "মডেল টেস্ট", href: "/admin/model-tests", icon: ClipboardCheck },
      { label: "Exam", href: "/admin/exams", icon: CalendarDays },
      { label: "প্রমোশন কার্ড", href: "/admin/promotion-cards", icon: Layout },
      { label: "টেস্টিমোনিয়াল", href: "/admin/testimonials", icon: Quote },
    ],
  },
  {
    title: "সিস্টেম",
    items: [
      { label: "ইউজার", href: "/admin/users", icon: Users },
      { label: "রোল গাইড", href: "/admin/roles", icon: Shield },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((group) => group.items);

export const requestStatusOptions = [
  { value: "new", label: "নতুন" },
  { value: "contacted", label: "যোগাযোগ হয়েছে" },
  { value: "qualified", label: "যোগ্য" },
  { value: "closed", label: "বন্ধ" },
  { value: "spam", label: "স্প্যাম" },
];

export const contactStatusOptions = [
  { value: "new", label: "নতুন" },
  { value: "contacted", label: "যোগাযোগ হয়েছে" },
  { value: "closed", label: "বন্ধ" },
  { value: "spam", label: "স্প্যাম" },
];

export const freeClassLeadStatusOptions = [
  { value: "new", label: "নতুন" },
  { value: "contacted", label: "যোগাযোগ হয়েছে" },
  { value: "scheduled", label: "ক্লাস নির্ধারিত" },
  { value: "attended", label: "উপস্থিত" },
  { value: "invalid", label: "ভুল নম্বর/তথ্য" },
  { value: "closed", label: "বন্ধ" },
];

export const userRoleOptions = [
  { value: "student", label: "Student" },
  { value: "guardian", label: "Guardian" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];
