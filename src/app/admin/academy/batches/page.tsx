import { BatchesGrid } from "@/components/admin/academy/grids/BatchesGrid";
import { loadBatchFormData } from "@/lib/academy/batch-form";
import { batchTiles } from "@/lib/grid/tiles";

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const [{ create }, tiles, form] = await Promise.all([searchParams, batchTiles(), loadBatchFormData()]);

  return (
    <div>
      <BatchesGrid tiles={tiles} form={form} openCreate={create === "1"} />
    </div>
  );
}
