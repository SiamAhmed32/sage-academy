"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getPortalContext, PORTAL_CHILD_COOKIE } from "@/lib/academy/portal";

/** Guardians with more than one child choose whose portal they are viewing. */
export async function switchPortalChildAction(childId: string) {
  const ctx = await getPortalContext();
  if ("problem" in ctx || !ctx.children.some((child) => child.id === childId)) {
    return { ok: false as const };
  }
  (await cookies()).set(PORTAL_CHILD_COOKIE, childId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/student",
    maxAge: 60 * 60 * 24 * 180,
  });
  revalidatePath("/student", "layout");
  return { ok: true as const };
}
