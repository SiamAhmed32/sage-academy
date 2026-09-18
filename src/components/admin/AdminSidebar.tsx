"use client";

import { AdminNavGroups } from "@/components/admin/AdminNavGroups";
import { adminRoleLabels } from "@/constants/admin-display";
import type { AuthUser } from "@/lib/auth";

type AdminSidebarProps = {
  user: AuthUser;
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 border-r border-gray-200 bg-white text-gray-700 lg:flex lg:flex-col">
      <div className="shrink-0 border-b border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-primary text-white font-bold">
            S
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">SAGE Academy</h2>
            <p className="text-xs font-medium text-gray-500">
              {adminRoleLabels[user.role] ?? user.role}
            </p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
        <AdminNavGroups />
      </nav>
    </aside>
  );
}
