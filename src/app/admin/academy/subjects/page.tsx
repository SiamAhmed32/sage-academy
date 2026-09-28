import { SubjectsGrid } from "@/components/admin/academy/grids/SubjectsGrid";

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const params = await searchParams;
  return <SubjectsGrid initialClass={params.class ?? ""} />;
}
