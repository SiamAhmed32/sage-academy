"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles, adminRoles } from "@/lib/rbac";
import AdmissionRequest from "@/models/AdmissionRequest";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateAdmissionRequestAction(formData: FormData) {
  try {
    await requireRole(staffRoles);
    await connectDB();
    const id = text(formData, "id");
    await AdmissionRequest.findByIdAndUpdate(id, {
      status: text(formData, "status"),
      adminNote: text(formData, "adminNote"),
      isRead: true,
    });
    revalidatePath("/admin/admissions");
    revalidatePath(`/admin/admissions/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function archiveAdmissionRequestAction(id: string) {
  try {
    await requireRole(staffRoles);
    await connectDB();
    await AdmissionRequest.findByIdAndUpdate(id, { isArchived: true, archivedAt: new Date() });
    revalidatePath("/admin/admissions");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function restoreAdmissionRequestAction(id: string) {
  try {
    await requireRole(staffRoles);
    await connectDB();
    await AdmissionRequest.findByIdAndUpdate(id, { isArchived: false, archivedAt: null });
    revalidatePath("/admin/admissions");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteAdmissionRequestAction(id: string) {
  try {
    await requireRole(adminRoles);
    await connectDB();
    await AdmissionRequest.findByIdAndDelete(id);
    revalidatePath("/admin/admissions");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
