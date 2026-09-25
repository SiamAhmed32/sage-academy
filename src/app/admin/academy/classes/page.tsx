import { ClassesGrid } from "@/components/admin/academy/grids/ClassesGrid";
import { connectDB } from "@/lib/mongodb";
import { classTiles } from "@/lib/grid/tiles";
import AcademyClass from "@/models/academy/AcademyClass";

export default async function ClassesPage() {
  await connectDB();
  const [tiles, levels] = await Promise.all([classTiles(), AcademyClass.distinct("level")]);

  return (
    <div>
      <ClassesGrid tiles={tiles} usedLevels={levels.map(Number)} />
    </div>
  );
}
