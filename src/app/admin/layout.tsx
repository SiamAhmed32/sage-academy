import type { ReactNode } from "react";
import { Inter, Libre_Baskerville } from "next/font/google";

import "./admin-theme.css";

import { SaShell } from "@/components/admin/sa/SaShell";
import { connectDB } from "@/lib/mongodb";
import { requireAdminPageUser } from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Formal serif for printed money receipts.
const receiptSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-receipt",
  display: "swap",
});

async function navCounts() {
  try {
    await connectDB();
    const admissionRequests = await AdmissionRequest.countDocuments({ status: "new", isArchived: { $ne: true } });
    return { admissionRequests };
  } catch {
    return { admissionRequests: 0 };
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPageUser();
  const counts = await navCounts();

  return (
    <SaShell user={user} counts={counts} fontClassName={`${inter.variable} ${receiptSerif.variable}`}>
      {children}
    </SaShell>
  );
}
