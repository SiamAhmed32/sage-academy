import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPageUser();

  return <AdminShell user={user}>{children}</AdminShell>;
}
