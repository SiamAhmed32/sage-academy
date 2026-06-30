import { redirect } from "next/navigation";

import { getCurrentAuthUser } from "@/lib/auth-session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { AuthRole, AuthUser } from "@/lib/auth";

export const staffRoles: AuthRole[] = ["manager", "admin", "super_admin"];
export const adminRoles: AuthRole[] = ["admin", "super_admin"];

export const allAuthRoles: AuthRole[] = [
  "student",
  "guardian",
  "manager",
  "admin",
  "super_admin",
];

export function canManageUsers(role: AuthRole) {
  return role === "admin" || role === "super_admin";
}

export function assignableUserRoles(role: AuthRole): AuthRole[] {
  if (role === "super_admin") {
    return allAuthRoles;
  }
  if (role === "admin") {
    return ["student", "guardian", "manager", "admin"];
  }
  return [];
}

export function canDeleteRecords(role: AuthRole) {
  return role === "admin" || role === "super_admin";
}

export function hasAllowedRole(role: AuthRole, allowedRoles: AuthRole[]) {
  return allowedRoles.includes(role);
}

export async function requireAuthUser() {
  const user = await getCurrentAuthUser();
  if (!user) {
    throw new UnauthorizedError("Please login first");
  }
  return user;
}

export async function requireRole(allowedRoles: AuthRole[]) {
  const user = await requireAuthUser();
  if (!hasAllowedRole(user.role, allowedRoles)) {
    throw new ForbiddenError("You do not have permission for this action");
  }
  return user;
}

export async function requireAdminPageUser(): Promise<AuthUser> {
  const user = await getCurrentAuthUser();
  if (!user) {
    redirect("/login");
  }
  if (!staffRoles.includes(user.role)) {
    redirect("/");
  }
  return user;
}
