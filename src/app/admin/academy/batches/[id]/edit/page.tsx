import { redirect } from "next/navigation";

// The routine now lives at /routine (week grid editor).
export default async function OldBatchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/academy/batches/${id}/routine`);
}
