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
    label: "About Us",
    href: "/about",
  },
  {
    label: "Batches",
    href: "/batches",
  },
  {
    label: "Faculty",
    href: "/teachers",
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
