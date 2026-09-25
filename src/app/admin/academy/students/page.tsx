import Link from "next/link";
import { UserPlus } from "lucide-react";

import { StudentsGrid } from "@/components/admin/academy/grids/StudentsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { listClassOptions } from "@/lib/academy/queries";
import { studentTiles } from "@/lib/grid/tiles";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const [tiles, classes] = await Promise.all([studentTiles(), listClassOptions()]);

  return (
    <div>
      <PageHeading
        title="Students"
        description="Everyone admitted through the new admission flow, with their batch, subjects and what they owe."
        actions={
          <Link href="/admin/academy/admission" className="btn-primary">
            <UserPlus size={17} /> Register student
          </Link>
        }
      />
      <StudentsGrid tiles={tiles} classes={classes} initialSearch={params.q ?? ""} />
    </div>
  );
}
