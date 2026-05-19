import type { ReactNode } from "react";
import type { AuthUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

type AdminShellProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-sage-admin-bg text-sage-gray-700">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[280px_1fr]">
        <AdminSidebar user={user} />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <AdminTopbar user={user} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
