export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Batches",
    href: "/batches",
  },
  {
    label: "Exams",
    href: "/exams",
  },
  {
    label: "Teachers",
    href: "/teachers",
  },
  {
    label: "About Us",
    href: "/about",
  },
  {
    label: "Contact Us",
    href: "/contact",
  },
];

export const navbarActions: NavItem[] = [
  {
    label: "Login",
    href: "/login",
  },
  {
    label: "Admission",
    href: "/admission",
  },
];
