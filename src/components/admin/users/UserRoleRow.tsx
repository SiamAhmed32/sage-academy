"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

import { updateUserRoleAction } from "@/app/admin/actions/user-roles";
import type { AuthRole } from "@/lib/auth";

type RoleOption = {
  value: AuthRole;
  label: string;
};

type UserRoleRowProps = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: AuthRole;
    isActive: boolean;
  };
  roleOptions: RoleOption[];
  isEditable: boolean;
};

export function UserRoleRow({ user, roleOptions, isEditable }: UserRoleRowProps) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!isEditable || isSaving) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", user.id);
      formData.append("role", role);
      if (isActive) {
        formData.append("isActive", "on");
      }

      const result = await updateUserRoleAction(formData);
      if (result.ok) {
        toast.success(`${user.name} এর role সেভ হয়েছে`);
        router.refresh();
      } else {
        toast.error(result.message || "সেভ করা যায়নি");
      }
    } catch {
      toast.error("সার্ভার সমস্যা হয়েছে");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <tr>
      <td className="p-4 font-bold text-sage-secondary">{user.name}</td>
      <td className="p-4">{user.email}</td>
      <td className="p-4">{user.phone || "N/A"}</td>
      <td className="p-4">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AuthRole)}
          disabled={!isEditable || isSaving}
          className="h-9 rounded-lg border border-sage-border px-3 disabled:opacity-40"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-4">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          disabled={!isEditable || isSaving}
          className="h-4 w-4 disabled:opacity-40"
        />
      </td>
      <td className="p-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isEditable || isSaving}
          className="rounded-lg bg-sage-primary px-4 py-2 font-bold text-white disabled:opacity-40"
        >
          {isSaving ? "..." : "সেভ"}
        </button>
      </td>
    </tr>
  );
}
