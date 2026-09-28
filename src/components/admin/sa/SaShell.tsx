"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  Search,
  UserPlus,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import { studentLogoutAction } from "@/app/student/actions";
import { switchPortalChildAction } from "@/app/student/portal-actions";
import { activeSaNavItem, isSaNavActive, saNavGroups, type AdminNavGroup } from "@/constants/admin-nav";
import { studentPortalNavGroups } from "@/constants/student-nav";
import { adminRoleLabels } from "@/constants/admin-display";
import type { AuthUser } from "@/lib/auth";
import { initials } from "@/lib/academy/codes";
import { prefetchAdminGrid } from "@/components/admin/grid/grid-cache";

const COLLAPSE_KEY = "sage-admin-sidebar-collapsed";

type PortalChildOption = { id: string; name: string; studentId: string };

type SaShellProps = {
  user: AuthUser;
  counts?: { admissionRequests: number };
  fontClassName: string;
  children: ReactNode;
  /** "student" renders the student / guardian portal with the same layout. */
  variant?: "admin" | "student";
  portal?: { children: PortalChildOption[]; currentId: string } | null;
};

const VARIANTS = {
  admin: {
    groups: saNavGroups,
    subtitle: "Admin workspace",
    home: "Admin",
    logout: logoutAction,
  },
  student: {
    groups: studentPortalNavGroups,
    subtitle: "Student portal",
    home: "Portal",
    logout: studentLogoutAction,
  },
} as const;

function initialOpenGroups(pathname: string, groups: AdminNavGroup[]) {
  return Object.fromEntries(
    groups.map((group) => [
      group.title,
      !group.collapsible || group.items.some((item) => isSaNavActive(pathname, item.href)),
    ])
  ) as Record<string, boolean>;
}

// The collapsed state lives in localStorage; read it as an external store so the
// server render (always expanded) and the client agree without an effect.
const collapseListeners = new Set<() => void>();

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // storage unavailable — the toggle still works for this page view
  }
  collapseListeners.forEach((listener) => listener());
}

function subscribeCollapsed(listener: () => void) {
  collapseListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    collapseListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function SaShell({
  user,
  counts = { admissionRequests: 0 },
  fontClassName,
  children,
  variant = "admin",
  portal = null,
}: SaShellProps) {
  const config = VARIANTS[variant];
  const groups: AdminNavGroup[] = config.groups;
  const router = useRouter();
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => initialOpenGroups(pathname, groups));
  const [lastPath, setLastPath] = useState(pathname);
  const mainRef = useRef<HTMLElement>(null);

  // On navigation: close the mobile drawer and open the active page's group.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
    setOpenGroups((current) => {
      const next = { ...current };
      for (const group of groups) {
        if (group.items.some((item) => isSaNavActive(pathname, item.href))) next[group.title] = true;
      }
      return next;
    });
  }

  // The page scrolls inside the shell, not the window, so reset it on navigation.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function toggleCollapsed() {
    writeCollapsed(!collapsed);
  }

  const [liveCounts, setLiveCounts] = useState(counts);

  useEffect(() => {
    if (variant !== "admin") return;
    let cancelled = false;
    fetch("/api/admin/nav-counts")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.admissionRequests === "number") {
          setLiveCounts({ admissionRequests: data.admissionRequests });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [variant]);

  const current = activeSaNavItem(pathname, groups);
  const shellClass = ["sa", fontClassName, collapsed ? "sa-collapsed" : "", drawerOpen ? "sa-drawer-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <aside className="sa-sidebar" aria-label="Admin navigation">
        <div className="sa-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sage-wordmark.png" alt="SAGE" className="sa-brand-logo" />
          <span className="sa-brand-copy">
            <strong>SAGE Academy</strong>
            <small>{config.subtitle}</small>
          </span>
          <button
            type="button"
            className="sa-collapse-toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            type="button"
            className="icon-button sa-menu-button"
            style={{ marginLeft: "auto" }}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sa-nav">
          {groups.map((group, index) => {
            const open = openGroups[group.title];
            return (
              <div key={group.title}>
                {index > 0 ? <span className="sa-nav-group-sep" /> : null}
                {group.bare ? null : group.collapsible ? (
                  <button
                    type="button"
                    className="sa-nav-label"
                    onClick={() => setOpenGroups((value) => ({ ...value, [group.title]: !value[group.title] }))}
                    aria-expanded={open}
                  >
                    {group.title}
                    <ChevronDown
                      size={14}
                      className="sa-nav-chevron"
                      style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 200ms" }}
                    />
                  </button>
                ) : (
                  <p className="sa-nav-label">{group.title}</p>
                )}
                {(group.bare || open || collapsed) &&
                  group.items.map((item) => {
                    const Icon = item.icon;
                    const active = current?.href === item.href;
                    const count = item.countKey ? liveCounts?.[item.countKey] ?? 0 : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        onMouseEnter={() => prefetchAdminGrid(item.href)}
                        className={`sa-nav-item${active ? " active" : ""}`}
                        data-tooltip={item.label}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                        <span className="sa-nav-text">{item.label}</span>
                        {count > 0 ? <b className="sa-nav-count">{count > 99 ? "99+" : count}</b> : null}
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        <div className="sa-side-bottom">
          <div className="sa-side-user">
            <span className="sa-avatar">{initials(user.name)}</span>
            <span className="sa-user-copy">
              <strong>{user.name}</strong>
              <small>{adminRoleLabels[user.role] ?? user.role}</small>
            </span>
            <form action={config.logout}>
              <button type="submit" className="sa-logout" aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="sa-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />

      <section className="sa-main" ref={mainRef}>
        <header className="sa-topbar">
          <button
            type="button"
            className="icon-button sa-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="sa-crumb">
            <span>SAGE</span>
            <i>/</i>
            <strong>{current?.label ?? config.home}</strong>
          </div>
          {variant === "admin" ? (
            <form action="/admin/academy/students" className="sa-top-search" role="search">
              <Search size={17} />
              <input name="q" placeholder="Search student name, ID or phone..." aria-label="Search students" />
            </form>
          ) : (
            <span style={{ marginLeft: "auto" }} />
          )}
          <div className="sa-top-actions">
            {portal && portal.children.length > 1 ? (
              <select
                className="toolbar-select"
                style={{ height: 44, minWidth: 0, maxWidth: 240 }}
                value={portal.currentId}
                aria-label="Choose child"
                onChange={async (event) => {
                  const result = await switchPortalChildAction(event.target.value);
                  if (result.ok) router.refresh();
                }}
              >
                {portal.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} · {child.studentId}
                  </option>
                ))}
              </select>
            ) : null}
            <Link href="/" className="icon-button hide-xs" title="View website" aria-label="View website">
              <ExternalLink size={18} />
            </Link>
            {variant === "admin" ? (
              <Link href="/admin/academy/admission" className="btn-primary hide-xs">
                <UserPlus size={17} />
                <span>New admission</span>
              </Link>
            ) : null}
          </div>
        </header>
        <main className="sa-workspace">{children}</main>
      </section>
    </div>
  );
}
