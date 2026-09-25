import "server-only";

import { Types } from "mongoose";

import { batchStudentCounts } from "@/lib/academy/queries";
import AcademicBatch from "@/models/AcademicBatch";
import AcademyBatch from "@/models/academy/AcademyBatch";
import AcademySubject from "@/models/academy/AcademySubject";
import Teacher from "@/models/Teacher";

type CardLike = { academyBatch?: unknown; linkedBatch?: unknown };

const OPEN = "ভর্তি চলছে"; // public badge value
const FULL = "ভর্তি বন্ধ"; // public badge value

/**
 * Promotion cards can point at a batch from the new academy system. The
 * public pages were written for the old "website batch" shape, so present
 * the new batch in that shape: status, class, version and subject teachers.
 */
export async function attachAcademyBatches<T extends CardLike>(cards: T[]): Promise<T[]> {
  const ids = cards
    .map((card) => String(card.academyBatch ?? ""))
    .filter((id) => Types.ObjectId.isValid(id));
  if (ids.length === 0) return cards;

  const batches = await AcademyBatch.find({ _id: { $in: ids } }).lean<
    {
      _id: Types.ObjectId;
      code: string;
      classLevel: number;
      gender: "boys" | "girls";
      version: "bangla" | "english";
      capacity: number;
      status: string;
      subjects: { subjectId: Types.ObjectId; teacherId: Types.ObjectId | null }[];
    }[]
  >();
  const subjectIds = batches.flatMap((batch) => batch.subjects.map((item) => item.subjectId));
  const teacherIds = batches.flatMap((batch) => batch.subjects.map((item) => item.teacherId)).filter(Boolean);
  const [subjects, teachers, counts] = await Promise.all([
    AcademySubject.find({ _id: { $in: subjectIds } }).select("name").lean<{ _id: Types.ObjectId; name: string }[]>(),
    Teacher.find({ _id: { $in: teacherIds } })
      .select("name subject designation experience image quote socialLinks")
      .lean<{ _id: Types.ObjectId }[]>(),
    batchStudentCounts(batches.map((batch) => batch._id)),
  ]);
  const subjectName = new Map(subjects.map((subject) => [String(subject._id), subject.name]));
  const teacherById = new Map(teachers.map((teacher) => [String(teacher._id), teacher]));

  const shaped = new Map(
    batches.map((batch) => {
      const students = counts.get(String(batch._id)) ?? 0;
      return [
        String(batch._id),
        {
          _id: batch._id,
          title: batch.code,
          batchCode: batch.code,
          classLevel: batch.classLevel,
          genderGroup: batch.gender === "girls" ? "female" : "male",
          version: batch.version,
          totalSeats: batch.capacity,
          availableSeats: Math.max(0, batch.capacity - students),
          status: batch.status === "active" && students < batch.capacity ? OPEN : FULL,
          subjects: batch.subjects.map((item) => ({
            subjectName: subjectName.get(String(item.subjectId)) ?? "",
            teacher: item.teacherId ? teacherById.get(String(item.teacherId)) ?? null : null,
          })),
        },
      ];
    })
  );

  return cards.map((card) => {
    const batch = shaped.get(String(card.academyBatch ?? ""));
    return batch ? { ...card, linkedBatch: batch } : card;
  });
}

/**
 * The promotion card form sends one batch value: "academy:<id>" for a new
 * academy batch, or a plain id for an old website batch.
 */
export async function resolvePromotionBatchLink(value: string) {
  if (value.startsWith("academy:")) {
    const id = value.slice("academy:".length);
    const batch = Types.ObjectId.isValid(id)
      ? await AcademyBatch.findById(id).select("code classLevel").lean<{ code: string; classLevel: number }>()
      : null;
    return { linkedBatch: null, academyBatch: batch ? id : null, batchCode: batch?.code, classLevel: batch?.classLevel };
  }
  if (!value || !Types.ObjectId.isValid(value)) {
    return { linkedBatch: null, academyBatch: null, batchCode: undefined, classLevel: undefined };
  }
  const batch = await AcademicBatch.findById(value).select("batchCode classLevel").lean<{ batchCode?: string; classLevel?: number }>();
  return { linkedBatch: batch ? value : null, academyBatch: null, batchCode: batch?.batchCode, classLevel: batch?.classLevel };
}
