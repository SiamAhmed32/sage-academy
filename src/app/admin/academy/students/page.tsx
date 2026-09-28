import { StudentsGrid } from "@/components/admin/academy/grids/StudentsGrid";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  return <StudentsGrid initialSearch={params.q ?? ""} />;
}
