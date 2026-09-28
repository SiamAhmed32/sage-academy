import "server-only";

import type { GridTile } from "@/components/admin/grid/GridTiles";
import { loadBatchFormData } from "@/lib/academy/batch-form";
import { currentMonthKey } from "@/lib/academy/codes";
import { ensureMonthlyDues } from "@/lib/academy/dues";
import { listClassOptions } from "@/lib/academy/queries";
import { connectDB } from "@/lib/mongodb";
import { batchTiles, classTiles, dueTiles, receiptTiles, studentTiles, subjectTiles } from "@/lib/grid/tiles";
import { admissionTiles } from "@/lib/grid/tiles-leads";
import { teacherTiles } from "@/lib/grid/tiles-content";
import AcademyClass from "@/models/academy/AcademyClass";
import AcademySubject from "@/models/academy/AcademySubject";
import Teacher from "@/models/Teacher";

export type GridBootstrap = {
  tiles?: GridTile[];
  meta?: Record<string, unknown>;
};

function cleanNames(list: unknown[]) {
  return [...new Set(list.filter((subject): subject is string => typeof subject === "string" && subject.trim() !== "").map((subject) => subject.trim()))].sort(
    (a, b) => a.localeCompare(b)
  );
}

/** Tiles and the small extras a table needs, loaded beside the first page of rows. */
export async function gridBootstrap(source: string): Promise<GridBootstrap> {
  switch (source) {
    case "admissions":
      return { tiles: await admissionTiles() };
    case "academy-classes": {
      await connectDB();
      const [tiles, levels] = await Promise.all([classTiles(), AcademyClass.distinct("level")]);
      return { tiles, meta: { usedLevels: levels.map(Number) } };
    }
    case "academy-subjects": {
      await connectDB();
      const [tiles, classes, perClass] = await Promise.all([
        subjectTiles(),
        listClassOptions(),
        AcademySubject.aggregate<{ _id: unknown; n: number }>([{ $match: { isArchived: false } }, { $group: { _id: "$classId", n: { $sum: 1 } } }]),
      ]);
      return {
        tiles,
        meta: { classes, counts: Object.fromEntries(perClass.map((row) => [String(row._id), row.n])) },
      };
    }
    case "academy-batches": {
      const [tiles, form] = await Promise.all([batchTiles(), loadBatchFormData()]);
      return { tiles, meta: { form } };
    }
    case "academy-students": {
      const [tiles, classes] = await Promise.all([studentTiles(), listClassOptions()]);
      return { tiles, meta: { classes } };
    }
    case "teachers": {
      await connectDB();
      const [tiles, used, academy] = await Promise.all([
        teacherTiles(),
        Teacher.distinct("subject"),
        AcademySubject.distinct("name", { isArchived: { $ne: true } }),
      ]);
      return { tiles, meta: { subjects: cleanNames(used as unknown[]), subjectOptions: cleanNames(academy as unknown[]) } };
    }
    case "academy-dues":
      await ensureMonthlyDues(currentMonthKey());
      return { tiles: await dueTiles() };
    case "academy-receipts":
      return { tiles: await receiptTiles() };
    default:
      return {};
  }
}
