import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademySubject from "@/models/academy/AcademySubject";

export const dynamic = "force-dynamic";

/**
 * Public list for the website admission form: the classes SAGE teaches and
 * each class's subjects. Parents choose a class and the subjects they want;
 * the batch is chosen by the admin at admission, not by the parent.
 */
export async function GET() {
  try {
    await connectDB();
    const [classes, subjects] = await Promise.all([
      AcademyClass.find({ isArchived: { $ne: true } }).select("name level").sort({ level: 1 }).lean(),
      AcademySubject.find({ isArchived: { $ne: true } }).select("name classId").sort({ name: 1 }).lean(),
    ]);

    const byClass = new Map<string, string[]>();
    for (const subject of subjects) {
      const key = String(subject.classId);
      const names = byClass.get(key) ?? [];
      if (!names.includes(subject.name)) names.push(subject.name);
      byClass.set(key, names);
    }

    const items = classes.map((item) => ({
      level: item.level,
      name: item.name,
      subjects: byClass.get(String(item._id)) ?? [],
    }));

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("[admission-classes]", error);
    return NextResponse.json({ success: false, message: "Could not load classes" }, { status: 500 });
  }
}
