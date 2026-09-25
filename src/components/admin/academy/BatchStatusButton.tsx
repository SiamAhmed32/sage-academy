"use client";

import { Archive, RotateCcw } from "lucide-react";

import { setBatchStatusAction } from "@/app/admin/academy/_actions/setup";
import { useAction } from "./use-action";

export function BatchStatusButton({ id, status }: { id: string; status: "active" | "archived" }) {
  const { pending, run } = useAction();
  const archive = status === "active";
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={pending}
      onClick={() => {
        if (archive && !window.confirm("Archive this batch? It will be hidden from admission. Its code is never reused.")) return;
        run(() => setBatchStatusAction(id, archive ? "archived" : "active"));
      }}
    >
      {archive ? <Archive size={17} /> : <RotateCcw size={17} />}
      {archive ? "Archive" : "Restore"}
    </button>
  );
}
