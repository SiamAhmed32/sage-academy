import { RotateCcw } from "lucide-react";
import { restoreAcademicBatchAction } from "@/app/admin/actions";

export function BatchRestoreButton({ batchId }: { batchId: string }) {
  return (
    <form action={restoreAcademicBatchAction}>
      <input type="hidden" name="id" value={batchId} />
      <button 
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-100"
        title="রিস্টোর করুন"
      >
        <RotateCcw size={16} />
      </button>
    </form>
  );
}
