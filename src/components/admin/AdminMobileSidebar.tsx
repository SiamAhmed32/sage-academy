"use client";

import { Menu } from "lucide-react";

import { AdminNavGroups } from "@/components/admin/AdminNavGroups";
import { adminRoleLabels } from "@/constants/admin-display";
import type { AuthUser } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type AdminMobileSidebarProps = {
  user: AuthUser;
};

export function AdminMobileSidebar({ user }: AdminMobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sage-border text-sage-secondary lg:hidden"
          aria-label="Open admin navigation"
        >
          <Menu size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-[280px] flex-col gap-0 border-gray-200 bg-white p-0 text-gray-700"
      >
        <div className="shrink-0 border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-primary text-white font-bold">
              S
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                SAGE Academy
              </h2>
              <p className="text-xs font-medium text-gray-500">
                {adminRoleLabels[user.role] ?? user.role}
              </p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <AdminNavGroups closeOnNavigate />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
