import type { ReactNode } from "react";
import { Inter, Libre_Baskerville } from "next/font/google";
import { unstable_cache } from "next/cache";

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

const admissionBadgeCount = unstable_cache(
  async () => {
    await connectDB();
    return AdmissionRequest.countDocuments({ status: "new", isArchived: { $ne: true } });
  },
  ["admin-admission-badge"],
  { revalidate: 30 }
);

async function navCounts() {
  try {
    const admissionRequests = await admissionBadgeCount();
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
