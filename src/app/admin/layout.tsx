import type { ReactNode } from "react";
import { Inter, Libre_Baskerville } from "next/font/google";
import { redirect } from "next/navigation";

import "./admin-theme.css";

import { SaShell } from "@/components/admin/sa/SaShell";
import { getNavbarAuthUser } from "@/lib/auth-session";
import { staffRoles } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const receiptSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-receipt",
  display: "swap",
});

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getNavbarAuthUser();
  if (!user) redirect("/login");
  if (!staffRoles.includes(user.role)) redirect("/");

  return (
    <SaShell user={user} fontClassName={`${inter.variable} ${receiptSerif.variable}`}>
      {children}
    </SaShell>
  );
}
