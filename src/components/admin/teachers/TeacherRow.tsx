"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { TeacherFormModal } from "./TeacherFormModal";
import { TeacherDeleteButton } from "./TeacherDeleteButton";
import { updateTeacherVisibilityAction, updateTeacherOrderAction } from "@/app/admin/actions";
import type { AdminTeacher } from "./types";

export function TeacherRow({ teacher }: { teacher: AdminTeacher }) {
  const router = useRouter();

  async function handleVisibilityUpdate(formData: FormData) {
    try {
      await updateTeacherVisibilityAction(formData);
      toast.success("Visibility updated");
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  async function handleOrderUpdate(formData: FormData) {
    try {
      const result = await updateTeacherOrderAction(formData);
      if (result && !result.ok) {
        toast.error(result.message);
      } else {
        toast.success("সিরিয়াল নম্বর আপডেট হয়েছে");
      }
    } catch {
      toast.error("আপডেট ব্যর্থ হয়েছে");
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-sage-red-50 ring-1 ring-sage-red-100">
          {teacher.image ? (
            <Image src={teacher.image} alt={teacher.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sage-primary/20">
              <User size={26} />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <p className="line-clamp-1 text-sm font-bold text-sage-secondary">{teacher.name}</p>
        <p className="mt-1 text-xs font-semibold text-sage-primary">{teacher.designation || "-"}</p>
      </TableCell>
      <TableCell className="text-sm font-medium text-sage-gray-700">{teacher.subject || "-"}</TableCell>
      <TableCell className="whitespace-normal text-sm text-sage-gray-700">
        <p className="line-clamp-2 max-w-48">{teacher.experience || "-"}</p>
      </TableCell>
      <TableCell className="whitespace-normal text-sm text-sage-gray-700">
        <p className="line-clamp-2 max-w-72">{teacher.quote || "-"}</p>
      </TableCell>
      <TableCell>
        <form action={handleVisibilityUpdate} className="flex items-center gap-2">
          <input type="hidden" name="id" value={teacher._id.toString()} />
          <input
            name="isFeatured"
            type="checkbox"
            defaultChecked={teacher.isFeatured}
            className="h-4 w-4 rounded border-sage-border text-sage-primary focus:ring-sage-primary"
          />
          <button className="rounded-md bg-sage-primary px-2.5 py-1 text-xs font-bold text-white">
            সেভ
          </button>
        </form>
      </TableCell>
      <TableCell>
        <form action={handleOrderUpdate} className="flex items-center gap-2">
          <input type="hidden" name="id" value={teacher._id.toString()} />
          <input
            name="order"
            type="number"
            defaultValue={teacher.order ?? 0}
            className="w-16 rounded border-sage-border px-1.5 py-1 text-xs font-bold text-sage-secondary outline-none focus:ring-1 focus:ring-sage-primary"
          />
          <button className="rounded-md bg-sage-secondary px-2.5 py-1 text-xs font-bold text-white transition hover:bg-sage-primary">
            সেভ
          </button>
        </form>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <TeacherFormModal
            teacher={teacher}
            trigger={
              <button className="rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary transition hover:bg-sage-primary hover:text-white">
                এডিট
              </button>
            }
          />
          <TeacherDeleteButton teacherId={teacher._id.toString()} />
        </div>
      </TableCell>
    </TableRow>
  );
}
