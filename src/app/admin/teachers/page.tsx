import { submitTeacherOrderFormAction, updateTeacherVisibilityAction } from "@/app/admin/actions";
import Image from "next/image";
import { User } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TeacherDeleteButton } from "@/components/admin/teachers/TeacherDeleteButton";
import { TeacherFormModal } from "@/components/admin/teachers/TeacherFormModal";
import { TeacherFilters } from "@/components/admin/teachers/TeacherFilters";
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

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    isFeatured?: string;
    subject?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  await connectDB();
  
  const q = params.q || "";
  const isFeatured = params.isFeatured;
  const subject = params.subject || "";
  const sort = params.sort || "order:asc";
  const page = parseInt(params.page || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { subject: { $regex: q, $options: "i" } },
    ];
  }
  if (isFeatured) {
    query.isFeatured = isFeatured === "true";
  }
  if (subject) {
    query.subject = subject;
  }

  const [sortField, sortOrder] = sort.split(":");
  const sortOption: Record<string, 1 | -1> = {};
  sortOption[sortField || "order"] = sortOrder === "desc" ? -1 : 1;

  const [teachers, total, subjects] = await Promise.all([
    Teacher.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Teacher.countDocuments(query),
    Teacher.distinct("subject"),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <AdminPageHeader
        title="শিক্ষক ম্যানেজমেন্ট"
        description="ফ্যাকাল্টি লিস্ট দেখুন এবং featured teacher নিয়ন্ত্রণ করুন।"
        action={<TeacherFormModal />}
      />

      <TeacherFilters subjects={subjects as string[]} />

      {teachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-border bg-white py-20 text-center">
          <p className="text-lg font-bold text-sage-secondary">কোনো শিক্ষক পাওয়া যায়নি</p>
          <p className="mt-2 text-sm text-sage-gray-500">আপনার সার্চ বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-sage-border bg-white">
            <Table className="min-w-[1120px]">
              <TableHeader className="bg-sage-red-50">
                <TableRow className="hover:bg-sage-red-50">
                  <TableHead>ছবি</TableHead>
                  <TableHead>শিক্ষকের তথ্য</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead>অভিজ্ঞতা</TableHead>
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
                      সেভ
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
                      সেভ
                    </button>
                  </form>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <TeacherFormModal
                      teacher={teacher as any}
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
            ))}
              </TableBody>
            </Table>
          </div>

          <Pagination totalPages={totalPages} currentPage={page} />
        </>
      )}
    </div>
  );
}
