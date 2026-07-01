import { TeachersShowcase } from "@/components/teachers/TeachersShowcase";
import { getPublicTeachers } from "@/lib/public-teachers";
import type { Teacher } from "@/types/teacher";

export const revalidate = 60;

export default async function TeachersPage() {
  let teachers: Teacher[] = [];

  try {
    teachers = await getPublicTeachers();
  } catch (error) {
    console.error("Teachers page fetch failed:", error);
  }

  return <TeachersShowcase teachers={teachers} />;
}
