import { TeachersGrid } from "@/components/admin/grids/TeachersGrid";
import { teacherTiles } from "@/lib/grid/tiles-content";
import { connectDB } from "@/lib/mongodb";
import AcademySubject from "@/models/academy/AcademySubject";
import Teacher from "@/models/Teacher";

async function teacherSubjects() {
  await connectDB();
  const [used, academy] = await Promise.all([Teacher.distinct("subject"), AcademySubject.distinct("name", { isArchived: { $ne: true } })]);
  const clean = (list: unknown[]) =>
    [...new Set(list.filter((subject): subject is string => typeof subject === "string" && subject.trim() !== "").map((subject) => subject.trim()))].sort((a, b) =>
      a.localeCompare(b)
    );
  return { used: clean(used as unknown[]), academy: clean(academy as unknown[]) };
}

export default async function AdminTeachersPage() {
  const [tiles, subjects] = await Promise.all([teacherTiles(), teacherSubjects()]);

  return (
    <div>
      <TeachersGrid tiles={tiles} subjects={subjects.used} subjectOptions={subjects.academy} />
    </div>
  );
}
