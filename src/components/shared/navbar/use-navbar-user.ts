"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import type { AuthUser } from "@/lib/auth";

type NavUser = Pick<AuthUser, "id" | "name" | "email" | "role"> & Partial<AuthUser>;

const STORAGE_KEY = "sage-nav-user";
const EVENT = "sage-auth-changed";

// Seeded from the last answer so a signed-in user does not flash "Login" on reload.
let current: NavUser | null | undefined = (() => {
  if (typeof window === "undefined") return undefined;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as NavUser) : undefined;
  } catch {
    return undefined;
  }
})();
let inflight: Promise<NavUser | null> | null = null;
const listeners = new Set<() => void>();

function publish(user: NavUser | null) {
  current = user;
  try {
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  listeners.forEach((listener) => listener());
}

function load() {
  inflight ??= fetch("/api/auth/navbar", { cache: "no-store", credentials: "same-origin" })
    .then((res) => (res.ok ? res.json() : { user: null }))
    .then((json: { user: NavUser | null }) => json.user ?? null)
    .catch(() => current ?? null)
    .then((user) => {
      inflight = null;
      publish(user);
      return user;
    });
  return inflight;
}

/** Tell the navbar the session changed (after login or logout). */
export function notifyAuthChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/**
 * The signed-in user for the public navbar, resolved in the browser so the
 * pages themselves can be cached. Shared by the desktop and mobile navbars.
 */
export function useNavbarUser(): AuthUser | null {
  const pathname = usePathname();
  const user = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      const onAuth = () => void load();
      window.addEventListener(EVENT, onAuth);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener(EVENT, onAuth);
      };
    },
    () => current ?? null,
    () => null
  );

  // Re-check on navigation so a login or logout redirect shows straight away.
  useEffect(() => {
    void load();
  }, [pathname]);

  return user as AuthUser | null;
}
