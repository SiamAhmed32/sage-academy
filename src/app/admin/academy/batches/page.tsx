import { BatchesGrid } from "@/components/admin/academy/grids/BatchesGrid";

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  return <BatchesGrid openCreate={create === "1"} />;
}
