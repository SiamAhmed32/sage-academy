"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

import { navbarActions } from "@/constants/navbar";
import { trackEngagementEvent } from "@/lib/engagement-tracker";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavbarActionsProps = {
  stacked?: boolean;
  onNavigate?: () => void;
  user?: AuthUser | null;
};

const staffRoles = ["manager", "admin", "super_admin"];

function canOpenDashboard(user?: AuthUser | null) {
  return Boolean(user);
}

function dashboardHref(user?: AuthUser | null) {
  return user && staffRoles.includes(user.role) ? "/admin" : "/student";
}

function dashboardLabel(user?: AuthUser | null) {
  return user && staffRoles.includes(user.role) ? "ড্যাশবোর্ড" : "আমার ড্যাশবোর্ড";
}

function trackNavCta(label: string) {
  void trackEngagementEvent({
    eventType: "cta_click",
    label,
    path: typeof window !== "undefined" ? window.location.pathname : "",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function NavbarActions({
  stacked = false,
  onNavigate,
  user,
}: NavbarActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const showDashboardLink = canOpenDashboard(user);

  async function handleLogout() {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      onNavigate?.();
      router.push("/");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (user && stacked) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-sage-red-50 px-4 py-4 ring-1 ring-sage-red-100">
          <p className="text-sm font-bold text-sage-secondary">{user.name}</p>
          <p className="mt-1 text-sm text-sage-gray-700">{user.email}</p>
        </div>

        {showDashboardLink && (
          <Link
            href={dashboardHref(user)}
            onClick={onNavigate}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-red-100 bg-sage-white px-5 py-2.5 text-sm font-semibold text-sage-secondary transition-all duration-200 hover:bg-sage-red-50"
          >
            <LayoutDashboard size={16} />
            {dashboardLabel(user)}
          </Link>
        )}

        <Link
          href={navbarActions[1].href}
          onClick={() => {
            trackNavCta("navbar_admission_stacked");
            onNavigate?.();
          }}
          className="rounded-full bg-sage-primary px-5 py-2.5 text-center text-sm font-semibold text-sage-white shadow-md transition-all duration-200 hover:bg-sage-primary-hover"
        >
          {navbarActions[1].label}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="rounded-full border border-sage-primary px-5 py-2.5 text-sm font-semibold text-sage-primary transition-all duration-200 hover:bg-sage-primary hover:text-sage-white disabled:opacity-60"
        >
          {isPending ? "লগআউট হচ্ছে..." : "লগআউট"}
        </button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-full border border-sage-red-100 bg-sage-white px-3 py-2 text-sm font-semibold text-sage-secondary transition hover:bg-sage-red-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-red-50 text-xs font-bold text-sage-primary">
                {getInitials(user.name)}
              </span>
              <span className="max-w-28 truncate">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-sage-gray-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 min-w-60">
            <DropdownMenuLabel>
              <p className="font-semibold text-sage-secondary">{user.name}</p>
              <p className="mt-1 text-xs font-normal text-sage-gray-700">
                {user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {showDashboardLink && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref(user)} className="text-sage-secondary">
                    <LayoutDashboard className="h-4 w-4" />
                    {dashboardLabel(user)}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isPending}
              className="text-sage-primary"
            >
              <LogOut className="h-4 w-4" />
              {isPending ? "লগআউট হচ্ছে..." : "লগআউট"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href={navbarActions[1].href}
          onClick={() => trackNavCta("navbar_admission")}
          className="rounded-full bg-sage-primary px-5 py-2.5 text-sm font-semibold text-sage-white shadow-md transition-all duration-200 hover:bg-sage-primary-hover"
        >
          {navbarActions[1].label}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", stacked ? "flex-col" : "items-center")}>
      <Link
        href={navbarActions[0].href}
        onClick={() => {
          trackNavCta("navbar_login");
          onNavigate?.();
        }}
        className="rounded-full border border-sage-primary px-5 py-2.5 text-sm font-semibold text-sage-primary transition-all duration-200 hover:bg-sage-primary hover:text-sage-white"
      >
        {navbarActions[0].label}
      </Link>

      <Link
        href={navbarActions[1].href}
        onClick={() => {
          trackNavCta("navbar_admission");
          onNavigate?.();
        }}
        className="rounded-full bg-sage-primary px-5 py-2.5 text-sm font-semibold text-sage-white shadow-md transition-all duration-200 hover:bg-sage-primary-hover"
      >
        {navbarActions[1].label}
      </Link>
    </div>
  );
}
