import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import type { AuthUser } from "@/lib/auth";
import { AdminMobileSidebar } from "./AdminMobileSidebar";

type AdminTopbarProps = {
  user: AuthUser;
};

export function AdminTopbar({ user }: AdminTopbarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-sage-border bg-sage-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileSidebar user={user} />

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase text-sage-gray-500">
            SAGE Academy Admin
          </p>
          <h1 className="truncate text-lg font-bold text-sage-secondary">
            {user.name}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-sage-border px-3 text-sm font-semibold text-sage-secondary"
        >
          <ExternalLink size={16} />
          <span className="hidden sm:inline">ওয়েবসাইট</span>
        </Link>

        <form action={logoutAction}>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-sage-primary px-3 text-sm font-semibold text-sage-white">
            <LogOut size={16} />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </form>
      </div>
    </header>
  );
}
