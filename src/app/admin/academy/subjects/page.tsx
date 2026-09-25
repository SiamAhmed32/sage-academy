import { SubjectsGrid } from "@/components/admin/academy/grids/SubjectsGrid";
import { listClassOptions } from "@/lib/academy/queries";
import { subjectTiles } from "@/lib/grid/tiles";
import { connectDB } from "@/lib/mongodb";
import AcademySubject from "@/models/academy/AcademySubject";

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const params = await searchParams;
  await connectDB();
  const [tiles, classes, perClass] = await Promise.all([
    subjectTiles(),
    listClassOptions(),
    AcademySubject.aggregate<{ _id: unknown; n: number }>([{ $match: { isArchived: false } }, { $group: { _id: "$classId", n: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(perClass.map((row) => [String(row._id), row.n]));

  return (
    <div>
      <SubjectsGrid tiles={tiles} classes={classes} initialClass={params.class ?? ""} counts={counts} />
    </div>
  );
}
