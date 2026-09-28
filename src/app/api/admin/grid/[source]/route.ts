import { NextRequest, NextResponse } from "next/server";

import { gridBootstrap } from "@/lib/grid/bootstrap";
import { getGridSource } from "@/lib/grid/registry";
import type { GridRequest } from "@/lib/grid/query";
import { AppError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * One endpoint for every admin data grid. The grid sends AG Grid's page
 * window, sort and filter model plus a search term; the named source turns
 * that into a MongoDB query and returns one page and the total count.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ source: string }> }) {
  const { source: name } = await context.params;
  try {
    const source = await getGridSource(name);
    if (!source) return NextResponse.json({ message: "Unknown table" }, { status: 404 });
    const user = await requireRole(source.access === "admin" ? adminRoles : staffRoles);
    const body = (await request.json().catch(() => ({}))) as Partial<GridRequest> & { withTiles?: boolean };
    const gridRequest: GridRequest = {
      startRow: Number(body.startRow) || 0,
      endRow: Number(body.endRow) || 25,
      sortModel: Array.isArray(body.sortModel) ? body.sortModel.slice(0, 3) : [],
      filterModel: body.filterModel && typeof body.filterModel === "object" ? body.filterModel : {},
      search: typeof body.search === "string" ? body.search.slice(0, 100) : "",
      preset: typeof body.preset === "string" ? body.preset.slice(0, 40) : "",
      params: body.params && typeof body.params === "object" ? body.params : {},
    };
    await connectDB();
    const withTiles = body.withTiles === true && gridRequest.startRow === 0;
    const [result, boot] = await Promise.all([
      source.run(gridRequest, user),
      withTiles ? gridBootstrap(name) : Promise.resolve(null),
    ]);
    return NextResponse.json(boot ? { ...result, ...boot } : result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error(`[grid:${name}]`, error);
    return NextResponse.json({ message: "Could not load this table. Please try again." }, { status: 500 });
  }
}
