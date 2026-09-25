"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef } from "ag-grid-community";
import { Eye, EyeOff, Plus } from "lucide-react";
import { toast } from "react-toastify";

import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, dateCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { Modal } from "@/components/admin/sa/Modal";
import { TestimonialDeleteModal } from "@/components/admin/testimonials/TestimonialDeleteModal";
import { TestimonialFormPanel } from "@/components/admin/testimonials/TestimonialFormPanel";
import type { AdminTestimonial } from "@/components/admin/testimonials/types";
import { ThumbTitle, readApiResult, requestGridRefresh, useGridRefreshListener, yesNoOptions } from "./shared";

const SOURCE = "testimonials";

type Row = Omit<AdminTestimonial, "_id"> & { id: string; source: string; createdAt: string };

const toItem = (row: Row): AdminTestimonial => ({ ...row, _id: row.id });

export function TestimonialsGrid({ tiles }: { tiles: GridTile[] }) {
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  useGridRefreshListener(SOURCE, gridRef);
  // Stable object: the form resets whenever its "initial" prop changes.
  const editingItem = useMemo(() => (editing ? toItem(editing) : null), [editing]);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const togglePublish = useCallback(
    async (row: Row) => {
      try {
        const response = await fetch(`/api/testimonials/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: !row.isFeatured }),
        });
        await readApiResult(response, "The testimonial could not be updated.");
        toast.success(row.isFeatured ? "Testimonial unpublished." : "Testimonial published.");
        reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The testimonial could not be updated.");
      }
    },
    [reload]
  );

  async function deleteOne() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/testimonials/${deleteTarget.id}`, { method: "DELETE" });
      await readApiResult(response, "Delete failed");
      toast.success("Testimonial deleted.");
      setDeleteTarget(null);
      reload();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Reviewer",
        minWidth: 230,
        flex: 1.2,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <ThumbTitle image={data.image} avatar={data.name} title={data.name} sub={data.className || "—"} /> : null,
      },
      {
        field: "role",
        headerName: "Role",
        width: 120,
        ...setCol([
          { value: "student", label: "Student" },
          { value: "guardian", label: "Guardian" },
        ]),
        valueFormatter: ({ value }) => (value === "guardian" ? "Guardian" : "Student"),
      },
      { field: "className", headerName: "Class", width: 140, hide: true, ...textCol() },
      {
        field: "review",
        headerName: "Review",
        minWidth: 280,
        flex: 2,
        ...textCol(),
        tooltipField: "review",
      },
      {
        field: "rating",
        headerName: "Rating",
        width: 110,
        ...numberCol(),
        valueFormatter: ({ value }) => (value ? `${value}/5` : "—"),
      },
      {
        field: "isFeatured",
        headerName: "Status",
        width: 130,
        ...setCol(yesNoOptions("Published", "Unpublished")),
        cellRenderer: ({ value }: { value?: boolean }) => (value ? <Pill tone="success">Published</Pill> : <Pill tone="neutral">Unpublished</Pill>),
        context: { exportValue: (row: Row) => (row.isFeatured ? "Published" : "Unpublished") },
      },
      { field: "order", headerName: "Order", width: 100, ...numberCol() },
      {
        field: "source",
        headerName: "Source",
        width: 120,
        hide: true,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? value : <Muted>—</Muted>),
      },
      { field: "createdAt", headerName: "Added", width: 130, hide: true, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 130,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ActionIcons
              onEdit={() => setEditing(data)}
              onDelete={() => {
                setDeleteError("");
                setDeleteTarget(data);
              }}
            >
              <IconAction
                icon={data.isFeatured ? EyeOff : Eye}
                label={data.isFeatured ? "Unpublish" : "Publish on the website"}
                tone={data.isFeatured ? undefined : "success"}
                onClick={() => togglePublish(data)}
              />
            </ActionIcons>
          ) : null,
      },
    ],
    [togglePublish]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={gridRef}
        source={SOURCE}
        gridId={SOURCE}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        rowHeight={52}
        searchPlaceholder="Search names, classes or reviews…"
        emptyTitle="No testimonials found"
        emptyDescription="Clear the search or filters, or add a new testimonial."
        exportName="sage-testimonials"
      />

      {editing ? (
        <Modal open wide onClose={() => setEditing(null)} eyebrow="Testimonial" title="Edit testimonial">
          <TestimonialFormPanel
            mode="edit"
            initial={editingItem}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        </Modal>
      ) : null}

      <TestimonialDeleteModal
        open={Boolean(deleteTarget)}
        deleting={deleting}
        name={deleteTarget?.name}
        error={deleteError}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={deleteOne}
      />
    </>
  );
}

export function TestimonialCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> New testimonial
      </button>
      {open ? (
        <Modal open wide onClose={() => setOpen(false)} eyebrow="Testimonial" title="New testimonial" description="Add feedback from a student or guardian.">
          <TestimonialFormPanel
            mode="create"
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              requestGridRefresh(SOURCE);
              router.refresh();
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}
