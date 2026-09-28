"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Pencil,
  Plus,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  updateTeacherOrderAction,
  updateTeacherVisibilityAction,
} from "@/app/admin/actions";
import { getTeacherTeachingAction } from "@/app/admin/academy/_actions/setup";
import { PageHeading } from "@/components/admin/sa/ui";
import { TeacherFormFields } from "@/components/admin/teachers/TeacherFormFields";
import type { TeacherTeaching } from "@/lib/academy/queries";
import {
  SaDataGrid,
  type GridContext,
  type SaDataGridHandle,
} from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import {
  ActionIcons,
  IconAction,
  Muted,
  Pill,
  dateCol,
  numberCol,
  setCol,
  textCol,
} from "@/components/admin/grid/cells";
import { Modal } from "@/components/admin/sa/Modal";
import { TeacherForm } from "@/components/admin/teachers/TeacherForm";
import type { AdminTeacher } from "@/components/admin/teachers/types";
import {
  ConfirmDialog,
  ThumbTitle,
  readApiResult,
  useGridRefreshListener,
  yesNoOptions,
  type ConfirmRequest,
} from "./shared";

const SOURCE = "teachers";

type Row = {
  id: string;
  name: string;
  subject: string;
  designation: string;
  experience: string;
  quote: string;
  image: string;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  batchCount: number;
  teaches: string;
  weeklyClasses: number;
};

type Drawer = { mode: "view" | "edit"; row: Row } | { mode: "create" };

const routineHref = (row: Row) => `/admin/academy/timetable?teacher=${row.id}`;

function toTeacher(row: Row): AdminTeacher {
  return {
    _id: row.id,
    name: row.name,
    subject: row.subject,
    designation: row.designation,
    experience: row.experience,
    quote: row.quote,
    image: row.image,
    isFeatured: row.isFeatured,
    order: row.order,
  };
}

/** Display order, saved when the field loses focus or Enter is pressed. */
function OrderCell({
  data,
  context,
}: ICellRendererParams<Row, number, GridContext>) {
  const router = useRouter();
  const [value, setValue] = useState(String(data?.order ?? 0));
  const [saving, setSaving] = useState(false);
  if (!data) return null;

  async function save() {
    if (!data || saving) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next === data.order) {
      setValue(String(data.order));
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("order", String(next));
      const result = await updateTeacherOrderAction(formData);
      if (result && !result.ok) {
        toast.error(result.message);
        setValue(String(data.order));
        return;
      }
      toast.success("Display order saved.");
      context.refresh(false);
      router.refresh();
    } catch {
      toast.error("The order could not be saved.");
      setValue(String(data.order));
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type="number"
      className="input sm"
      aria-label={`Display order for ${data.name}`}
      value={value}
      disabled={saving}
      style={{ width: 72, height: 30 }}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setValue(String(data.order));
      }}
    />
  );
}

export function TeachersGrid({
  tiles = [],
  subjects: initialSubjects = [],
  subjectOptions: initialSubjectOptions = [],
}: {
  tiles?: GridTile[];
  subjects?: string[];
  subjectOptions?: string[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [subjectOptions, setSubjectOptions] = useState(initialSubjectOptions);
  const [loadedTiles, setLoadedTiles] = useState(tiles);
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  useGridRefreshListener(SOURCE, gridRef);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const toggleFeatured = useCallback(
    async (row: Row, context: GridContext) => {
      try {
        const formData = new FormData();
        formData.append("id", row.id);
        if (!row.isFeatured) formData.append("isFeatured", "on");
        await updateTeacherVisibilityAction(formData);
        toast.success(
          row.isFeatured
            ? `${row.name} is no longer featured.`
            : `${row.name} is now featured.`,
        );
        context.refresh(false);
        router.refresh();
      } catch {
        toast.error("The change could not be saved.");
      }
    },
    [router],
  );

  const askDelete = useCallback(
    (row: Row) =>
      setConfirm({
        title: "Delete this teacher?",
        description: `${row.name} will be removed from the website and the faculty list.`,
        confirmLabel: "Delete teacher",
        danger: true,
        run: async () => {
          try {
            const response = await fetch(`/api/admin/teachers/${row.id}`, {
              method: "DELETE",
              credentials: "include",
            });
            await readApiResult(response, "The teacher could not be deleted.");
            toast.success("Teacher deleted.");
            reload();
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "The teacher could not be deleted.",
            );
          }
        },
      }),
    [reload],
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Teacher",
        minWidth: 250,
        flex: 1.4,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ThumbTitle
              image={data.image}
              icon={GraduationCap}
              title={data.name}
              sub={data.designation || "—"}
            />
          ) : null,
      },
      {
        field: "subject",
        headerName: "Teaches",
        width: 160,
        ...setCol(
          subjects.map((subject) => ({ value: subject, label: subject })),
        ),
        cellRenderer: ({ value }: { value?: string }) =>
          value ? value : <Muted>—</Muted>,
      },
      {
        field: "batchCount",
        headerName: "Batches",
        width: 120,
        ...numberCol(),
        sortable: false,
        filter: false,
        tooltipField: "teaches",
        valueFormatter: ({ value }) =>
          value ? `${value} batch${value === 1 ? "" : "es"}` : "None",
      },
      {
        field: "weeklyClasses",
        headerName: "Weekly classes",
        width: 140,
        ...numberCol(),
        sortable: false,
        filter: false,
        valueFormatter: ({ value }) => (value ? String(value) : "—"),
      },
      {
        field: "designation",
        headerName: "Designation",
        width: 170,
        hide: true,
        ...textCol(),
      },
      {
        field: "experience",
        headerName: "Experience",
        minWidth: 160,
        flex: 1,
        hide: true,
        ...textCol(),
        tooltipField: "experience",
        cellRenderer: ({ value }: { value?: string }) =>
          value ? value : <Muted>—</Muted>,
      },
      {
        field: "quote",
        headerName: "Quote",
        minWidth: 200,
        flex: 1.2,
        hide: true,
        ...textCol(),
        tooltipField: "quote",
        cellRenderer: ({ value }: { value?: string }) =>
          value ? value : <Muted>—</Muted>,
      },
      {
        field: "isFeatured",
        headerName: "Featured",
        width: 120,
        ...setCol(yesNoOptions("Featured", "Not featured")),
        cellRenderer: ({ value }: { value?: boolean }) =>
          value ? (
            <Pill tone="success">Featured</Pill>
          ) : (
            <Pill tone="neutral">Regular</Pill>
          ),
        context: { exportValue: (row: Row) => (row.isFeatured ? "Yes" : "No") },
      },
      {
        field: "order",
        headerName: "Order",
        width: 110,
        ...numberCol(),
        cellRenderer: OrderCell,
      },
      {
        field: "createdAt",
        headerName: "Added",
        width: 130,
        hide: true,
        ...dateCol(),
      },
      {
        colId: "actions",
        headerName: "",
        width: 190,
        cellRenderer: ({
          data,
          context,
        }: ICellRendererParams<Row, unknown, GridContext>) =>
          data ? (
            <ActionIcons
              onView={() => setDrawer({ mode: "view", row: data })}
              onEdit={() => setDrawer({ mode: "edit", row: data })}
              onDelete={() => askDelete(data)}
            >
              <IconAction
                icon={CalendarClock}
                label="Show routine"
                href={routineHref(data)}
              />
              <IconAction
                icon={data.isFeatured ? StarOff : Star}
                label={
                  data.isFeatured
                    ? "Remove from featured"
                    : "Feature on the homepage"
                }
                tone={data.isFeatured ? undefined : "success"}
                onClick={() => toggleFeatured(data, context)}
              />
            </ActionIcons>
          ) : null,
      },
    ],
    [subjects, askDelete, toggleFeatured],
  );

  return (
    <>
      <PageHeading
        eyebrow="Academics"
        title="Teachers"
        description="Everyone who teaches at SAGE: what they teach, their weekly routine, and how they appear on the website."
        actions={
          <>
            <Link href="/admin/academy/timetable" className="btn-secondary">
              <CalendarDays size={17} /> Show routine
            </Link>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setDrawer({ mode: "create" })}
            >
              <Plus size={17} /> Add teacher
            </button>
          </>
        }
      />
      <SaDataGrid<Row>
        ref={gridRef}
        source={SOURCE}
        gridId={SOURCE}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={loadedTiles}
        onTiles={setLoadedTiles}
        onMeta={(meta) => {
          if (Array.isArray(meta.subjects)) setSubjects(meta.subjects.filter((subject): subject is string => typeof subject === "string"));
          if (Array.isArray(meta.subjectOptions)) setSubjectOptions(meta.subjectOptions.filter((subject): subject is string => typeof subject === "string"));
        }}
        rowHeight={52}
        onRowClick={(row) => setDrawer({ mode: "view", row })}
        searchPlaceholder="Search name, subject or designation…"
        emptyTitle="No teachers found"
        emptyDescription="Clear the search or filters, or add a new teacher."
        exportName="sage-teachers"
      />

      <Modal
        side
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        eyebrow="Teacher"
        title={
          drawer?.mode === "create"
            ? "Add teacher"
            : drawer?.mode === "edit"
              ? `Edit ${drawer.row.name}`
              : drawer?.mode === "view"
                ? drawer.row.name
                : ""
        }
        description={
          drawer && drawer.mode !== "create"
            ? drawer.row.designation || drawer.row.subject
            : "Name, subject and how they appear on the website."
        }
      >
        {drawer?.mode === "view" ? (
          <TeacherView
            key={drawer.row.id}
            row={drawer.row}
            onEdit={() => setDrawer({ mode: "edit", row: drawer.row })}
          />
        ) : drawer ? (
          <>
            {drawer.mode === "edit" ? (
              <TeachingSummary teacherId={drawer.row.id} />
            ) : null}
            <TeacherForm
              key={drawer.mode === "edit" ? drawer.row.id : "new"}
              teacher={
                drawer.mode === "edit" ? toTeacher(drawer.row) : undefined
              }
              subjectOptions={subjectOptions}
              onSuccess={() => {
                setDrawer(null);
                gridRef.current?.refresh(false);
              }}
              onCancel={() => setDrawer(null)}
            />
          </>
        ) : null}
      </Modal>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

/** Which batches and subjects a teacher is assigned to (set in each batch's Edit batch). */
function TeachingSummary({ teacherId }: { teacherId: string }) {
  const [teaching, setTeaching] = useState<TeacherTeaching | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeacherTeachingAction(teacherId).then((result) => {
      if (!cancelled)
        setTeaching(
          result.ok && result.data ? result.data : { batches: [], weekly: 0 },
        );
    });
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  // Group by batch: one compact row per batch with its subjects.
  const groups = new Map<string, { batchId: string; code: string; subjects: { name: string; weekly: number }[] }>();
  for (const item of teaching?.batches ?? []) {
    const group = groups.get(item.batchId) ?? { batchId: item.batchId, code: item.code, subjects: [] };
    group.subjects.push({ name: item.subjectName, weekly: item.weekly });
    groups.set(item.batchId, group);
  }
  const subjectCount = teaching?.batches.length ?? 0;

  return (
    <details className="teaching-summary">
      <summary>
        <span>
          <strong>Assigned batches</strong>
          <small>
            {!teaching
              ? "Loading…"
              : groups.size === 0
                ? "Not assigned to any batch yet"
                : `${groups.size} batch${groups.size === 1 ? "" : "es"} · ${subjectCount} subject${subjectCount === 1 ? "" : "s"} · ${teaching.weekly} class${teaching.weekly === 1 ? "" : "es"} a week`}
          </small>
        </span>
        <ChevronDown size={18} />
      </summary>
      <div className="teaching-list">
        {groups.size === 0 ? (
          <p className="cell-sub" style={{ margin: 0 }}>Pick this teacher for a subject in a batch (Batches → Edit batch).</p>
        ) : (
          [...groups.values()].map((group) => (
            <Link key={group.batchId} href={`/admin/academy/batches/${group.batchId}/routine`} className="teaching-row" title="Open this batch's routine">
              <code>{group.code}</code>
              <span>
                {group.subjects.map((subject) => (
                  <em key={subject.name}>
                    {subject.name} <small>{subject.weekly ? `${subject.weekly}/wk` : "no time"}</small>
                  </em>
                ))}
              </span>
            </Link>
          ))
        )}
        <small className="cell-sub">Set per subject in each batch (Batches → Edit batch). Click a batch to open its routine.</small>
      </div>
    </details>
  );
}

/** Read-only teacher panel: what they teach, then the same form, locked. */
function TeacherView({ row, onEdit }: { row: Row; onEdit: () => void }) {
  const teacher = toTeacher(row);

  return (
    <div className="stack" style={{ gap: 18, paddingBottom: 12 }}>
      <TeachingSummary teacherId={row.id} />

      <TeacherFormFields
        formData={teacher}
        setFormData={() => undefined}
        previewUrl={teacher.image}
        onImageFileChange={() => undefined}
        readOnly
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Link href={routineHref(row)} className="btn-secondary">
          <CalendarClock size={17} /> Show routine
        </Link>
        <button type="button" className="btn-primary" onClick={onEdit}>
          <Pencil size={17} /> Edit teacher
        </button>
      </div>
    </div>
  );
}
