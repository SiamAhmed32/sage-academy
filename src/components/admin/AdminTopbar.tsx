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
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileSidebar user={user} />

        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-gray-400">
            SAGE Academy Admin
          </p>
          <h1 className="truncate text-lg font-bold text-gray-900">
            {user.name}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <ExternalLink size={16} />
          <span className="hidden sm:inline">View website</span>
        </Link>

        <form action={logoutAction}>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-sage-primary px-3 text-sm font-semibold text-white transition hover:bg-sage-primary-hover">
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
