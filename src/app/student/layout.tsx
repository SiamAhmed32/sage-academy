import type { ReactNode } from "react";
import { Inter, Libre_Baskerville } from "next/font/google";

import "../admin/admin-theme.css";

import { PortalProblem } from "@/components/student/portal/PortalProblem";
import { SaShell } from "@/components/admin/sa/SaShell";
import { getPortalContext } from "@/lib/academy/portal";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Same formal serif as the admin receipt.
const receiptSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-receipt",
  display: "swap",
});

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const ctx = await getPortalContext();
  const portal = "problem" in ctx ? null : { children: ctx.children, currentId: ctx.child.id };

  return (
    <SaShell variant="student" user={ctx.user} fontClassName={`${inter.variable} ${receiptSerif.variable}`} portal={portal}>
      {"problem" in ctx ? <PortalProblem problem={ctx.problem} /> : children}
    </SaShell>
  );
}
