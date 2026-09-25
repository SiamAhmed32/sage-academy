"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { examHubTilesAction } from "@/app/admin/exam-hub/actions";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import type { ExamHubTileKind } from "@/lib/grid/tiles-exam-hub";

/**
 * Tiles for one Exam Hub grid. Starts from the server-rendered counts (when
 * given) and reloads them when the selected program changes or after a change.
 */
export function useExamHubTiles(kind: ExamHubTileKind, programId: string, initial?: GridTile[]) {
  const [tiles, setTiles] = useState<GridTile[]>(initial ?? []);
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const call = ++latest.current;
    try {
      const next = await examHubTilesAction(kind, programId);
      if (call === latest.current) setTiles(next);
    } catch {
      // Keep the last counts; the grid itself still shows the error.
    }
  }, [kind, programId]);

  // The server already sent the counts for the first scope.
  const skipFirst = useRef(initial !== undefined);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    void reload();
  }, [reload]);

  return { tiles, reload };
}
