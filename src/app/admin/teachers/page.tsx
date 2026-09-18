import { submitTeacherOrderFormAction, updateTeacherVisibilityAction } from "@/app/admin/actions";
import Image from "next/image";
import { User } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TeacherDeleteButton } from "@/components/admin/teachers/TeacherDeleteButton";
import { TeacherFormModal } from "@/components/admin/teachers/TeacherFormModal";
import { TeacherFilters } from "@/components/admin/teachers/TeacherFilters";
import type { AdminTeacher } from "@/components/admin/teachers/types";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";

const PAGE_SIZE = 12;
const MAX_SEARCH_LENGTH = 80;
const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  "order:asc": { order: 1, name: 1 },
  "order:desc": { order: -1, name: 1 },
  "name:asc": { name: 1 },
  "name:desc": { name: -1 },
  "createdAt:desc": { createdAt: -1 },
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  await connectDB();
  
  const q = getParam(params, "q").trim().slice(0, MAX_SEARCH_LENGTH);
  const featuredParam = getParam(params, "isFeatured");
  const isFeatured = featuredParam === "true" || featuredParam === "false"
    ? featuredParam
    : "";
  const subject = getParam(params, "subject").trim().slice(0, 100);
  const sortParam = getParam(params, "sort");
  const sort = SORT_OPTIONS[sortParam] ? sortParam : "order:asc";
  const requestedPage = Number.parseInt(getParam(params, "page", "1"), 10);

  const query: Record<string, unknown> = {};
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { subject: { $regex: safe, $options: "i" } },
    ];
  }
  if (isFeatured) {
    query.isFeatured = isFeatured === "true";
  }
  if (subject) {
    query.subject = subject;
  }

  const [total, subjects] = await Promise.all([
    Teacher.countDocuments(query),
    Teacher.distinct("subject"),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    totalPages
  );
  const teachers = await Teacher.find(query)
    .sort(SORT_OPTIONS[sort])
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return (
    <div>
      <AdminPageHeader
        title="Teacher Management"
        description="Manage the faculty list, featured teachers, and display order."
        action={<TeacherFormModal />}
      />

      <TeacherFilters subjects={subjects as string[]} />

      {teachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-border bg-white py-20 text-center">
          <p className="text-lg font-bold text-sage-secondary">No teachers found</p>
          <p className="mt-2 text-sm text-sage-gray-500">Try changing your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-sage-border bg-white">
            <Table className="min-w-[1120px]">
              <TableHeader className="bg-sage-red-50">
                <TableRow className="hover:bg-sage-red-50">
                  <TableHead>Photo</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher._id.toString()}>
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
                  <form action={updateTeacherVisibilityAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={teacher._id.toString()} />
                    <input
                      name="isFeatured"
                      type="checkbox"
                      defaultChecked={teacher.isFeatured}
                      className="h-4 w-4 rounded border-sage-border text-sage-primary focus:ring-sage-primary"
                    />
                    <button className="rounded-md bg-sage-primary px-2.5 py-1 text-xs font-bold text-white">
                      Save
                    </button>
                  </form>
                </TableCell>
                <TableCell>
                  <form action={submitTeacherOrderFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={teacher._id.toString()} />
                    <input
                      name="order"
                      type="number"
                      defaultValue={teacher.order ?? 0}
                      className="w-16 rounded border-sage-border px-1.5 py-1 text-xs font-bold text-sage-secondary outline-none focus:ring-1 focus:ring-sage-primary"
                    />
                    <button className="rounded-md bg-sage-secondary px-2.5 py-1 text-xs font-bold text-white transition hover:bg-sage-primary">
                      Save
                    </button>
                  </form>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <TeacherFormModal
                      teacher={teacher as unknown as AdminTeacher}
                      trigger={
                        <button className="rounded-lg bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary transition hover:bg-sage-primary hover:text-white">
                          Edit
                        </button>
                      }
                    />
                    <TeacherDeleteButton teacherId={teacher._id.toString()} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            totalPages={totalPages}
            currentPage={page}
            totalItems={total}
            pageSize={PAGE_SIZE}
            showWhenSinglePage
          />
        </>
      )}
    </div>
  );
}
