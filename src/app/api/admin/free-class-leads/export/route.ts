import { NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { buildFreeClassLeadFilter } from "@/lib/admin-free-class-lead-query";
import { connectDB } from "@/lib/mongodb";
import { requireRole, staffRoles } from "@/lib/rbac";
import FreeClassLead from "@/models/FreeClassLead";

function getParam(sp: URLSearchParams, key: string, fallback = "") {
  return sp.get(key)?.trim() ?? fallback;
}

function csvCell(v: string) {
  const s = v.replace(/"/g, '""');
  return `"${s}"`;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(staffRoles);

  const sp = req.nextUrl.searchParams;
  const q = getParam(sp, "q");
  const status = getParam(sp, "status", "all");
  const source = getParam(sp, "source", "all");
  const classLabel = getParam(sp, "classLabel", "all");
  const sort = getParam(sp, "sort", "desc");
  const dateRange = getParam(sp, "dateRange", "all");

  const query = buildFreeClassLeadFilter({ q, status, source, classLabel, dateRange });

  await connectDB();

  const rows = await FreeClassLead.find(query)
    .sort({ createdAt: sort === "asc" ? 1 : -1 })
    .limit(10_000)
    .lean();

  const header = ["createdAt", "name", "phone", "classLabel", "subject", "status", "source", "adminNote"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        csvCell(new Date(r.createdAt).toISOString()),
        csvCell(String(r.name ?? "")),
        csvCell(String(r.phone ?? "")),
        csvCell(String(r.classLabel ?? "")),
        csvCell(String(r.subject ?? "")),
        csvCell(String(r.status ?? "")),
        csvCell(String(r.source ?? "")),
        csvCell(String(r.adminNote ?? "").replace(/\r?\n/g, " ")),
      ].join(",")
    ),
  ];

  const csv = lines.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="free-class-leads.csv"`,
    },
  });
});
