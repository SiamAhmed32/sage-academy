"use server";

import { redirect } from "next/navigation";

import { getAuthCookieConfig } from "@/lib/auth";

export async function studentLogoutAction() {
  const cookie = getAuthCookieConfig();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
  redirect("/login");
}
