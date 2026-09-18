import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Gift,
  GraduationCap,
  Home,
  Inbox,
  Layers,
  Layout,
  LineChart,
  ListTree,
  MessageSquare,
  Quote,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

export const adminNavGroups = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: Home }],
  },
  {
    // Everything about getting a student in the door and set up, in one place:
    // the daily New Admission / Create Batch / Transfer screens, the one-time
    // Class/Subject setup they depend on, and the incoming lead inbox from the
    // public admission form — instead of split across two separate dropdowns.
    title: "Admissions",
    items: [
      { label: "New Admission", href: "/admin/academic-structure/admission", icon: UserPlus },
      { label: "Create Batch", href: "/admin/academic-structure/create-batch", icon: ListTree },
      { label: "Transfer Subject Batch", href: "/admin/academic-structure/transfer", icon: ArrowLeftRight },
      { label: "Admission Requests", href: "/admin/admissions", icon: Inbox },
      { label: "Classes", href: "/admin/academic-structure/classes", icon: Layers },
      { label: "Subjects", href: "/admin/academic-structure/subjects", icon: BookOpen },
    ],
  },
  {
    title: "Academic Operations",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Class Routine", href: "/admin/routine", icon: CalendarDays },
      { label: "Notices", href: "/admin/notices", icon: Bell },
      { label: "Academic Batches", href: "/admin/academic-batches", icon: BookOpen },
      { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
    ],
  },
  {
    // Marketing-side lead capture, unrelated to the student admission pipeline above.
    title: "Marketing Leads",
    items: [
      { label: "Contact Messages", href: "/admin/contacts", icon: MessageSquare },
      { label: "Free Class Leads", href: "/admin/free-class-leads", icon: Gift },
      { label: "Assessment Leads", href: "/admin/assessment-registrations", icon: ClipboardCheck },
      { label: "Quiz Leads", href: "/admin/quiz-leads", icon: Users },
      { label: "Funnel and Events", href: "/admin/engagement", icon: LineChart },
    ],
  },
  {
    title: "Website Content",
    items: [
      { label: "Quiz Questions", href: "/admin/quizzes", icon: BookOpen },
      { label: "Model Tests", href: "/admin/model-tests", icon: ClipboardCheck },
      { label: "Exam Hub", href: "/admin/exam-hub", icon: Trophy },
      { label: "Exams", href: "/admin/exams", icon: CalendarDays },
      { label: "Promotion Cards", href: "/admin/promotion-cards", icon: Layout },
      { label: "Testimonials", href: "/admin/testimonials", icon: Quote },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Role Guide", href: "/admin/roles", icon: Shield },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((group) => group.items);

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
