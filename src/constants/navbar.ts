export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  {
    label: "হোম",
    href: "/",
  },
  {
    label: "আমাদের সম্পর্কে",
    href: "/about",
  },
  {
    label: "ব্যাচসমূহ",
    href: "/batches",
  },
  {
    label: "শিক্ষকবৃন্দ",
    href: "/teachers",
  },

];

export const navbarActions: NavItem[] = [
  {
    label: "লগইন",
    href: "/login",
  },
  {
    label: "ভর্তি আবেদন",
    href: "/admission",
  },
];
