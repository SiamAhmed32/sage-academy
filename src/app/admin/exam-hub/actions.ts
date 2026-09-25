"use server";

import type { GridTile } from "@/components/admin/grid/GridTiles";
import { examHubTiles, type ExamHubTileKind } from "@/lib/grid/tiles-exam-hub";
import { adminRoles, requireRole } from "@/lib/rbac";

const KINDS: ExamHubTileKind[] = ["programs", "enrollments", "attempts", "questions"];

/** Fresh tile counts for one Exam Hub tab, scoped to a program when one is chosen. */
export async function examHubTilesAction(kind: ExamHubTileKind, programId = ""): Promise<GridTile[]> {
  await requireRole(adminRoles);
  if (!KINDS.includes(kind)) return [];
  return examHubTiles(kind, typeof programId === "string" ? programId : "");
}
