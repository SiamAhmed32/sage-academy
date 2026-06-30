"use server";

import { revalidatePath } from "next/cache";

import type { AuthRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  adminRoles,
  assignableUserRoles,
  canManageUsers,
  requireRole,
} from "@/lib/rbac";
import User from "@/models/User";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export type UserRoleSaveResult = { ok: true } | { ok: false; message: string };

function isAuthRole(value: string): value is AuthRole {
  return (
    value === "student" ||
    value === "guardian" ||
    value === "manager" ||
    value === "admin" ||
    value === "super_admin"
  );
}

export async function updateUserRoleAction(
  formData: FormData
): Promise<UserRoleSaveResult> {
  try {
    const currentUser = await requireRole(adminRoles);
    if (!canManageUsers(currentUser.role)) {
      return { ok: false, message: "আপনার role পরিবর্তনের অনুমতি নেই।" };
    }

    const targetUserId = text(formData, "id");
    const nextRole = text(formData, "role");
    const nextIsActive = bool(formData, "isActive");

    if (!targetUserId) {
      return { ok: false, message: "User not found." };
    }
    if (!isAuthRole(nextRole)) {
      return { ok: false, message: "সঠিক role নির্বাচন করুন।" };
    }

    if (!assignableUserRoles(currentUser.role).includes(nextRole)) {
      return { ok: false, message: "এই role আপনি দিতে পারবেন না।" };
    }

    await connectDB();
    const targetUser = await User.findById(targetUserId).select("role").lean<{ role?: string }>();
    if (!targetUser) {
      return { ok: false, message: "User not found." };
    }

    if (targetUser.role === "super_admin" && currentUser.role !== "super_admin") {
      return { ok: false, message: "Super admin user শুধু super admin এডিট করতে পারবে।" };
    }

    if (targetUserId === currentUser.id) {
      if (
        currentUser.role === "super_admin" &&
        (nextRole !== "super_admin" || !nextIsActive)
      ) {
        return { ok: false, message: "নিজের super admin access সরাতে পারবেন না।" };
      }
      if (currentUser.role === "admin" && (nextRole !== "admin" || !nextIsActive)) {
        return { ok: false, message: "নিজের admin access সরাতে পারবেন না।" };
      }
    }

    if (
      targetUser.role === "super_admin" &&
      (nextRole !== "super_admin" || !nextIsActive)
    ) {
      const activeSuperAdmins = await User.countDocuments({
        role: "super_admin",
        isActive: true,
      });
      if (activeSuperAdmins <= 1) {
        return {
          ok: false,
          message: "অন্তত একজন active super admin থাকতে হবে।",
        };
      }
    }

    await User.findByIdAndUpdate(
      targetUserId,
      { role: nextRole, isActive: nextIsActive },
      { runValidators: true }
    );
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "সেভ করা যায়নি।";
    return { ok: false, message };
  }
}
