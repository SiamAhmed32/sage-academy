"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef } from "ag-grid-community";
import { BellPlus, EyeOff, Megaphone, Send } from "lucide-react";
import { toast } from "react-toastify";

import { deleteNoticeAction, toggleNoticePublishAction } from "@/app/admin/notices/actions";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, setCol, textCol } from "@/components/admin/grid/cells";
import { NoticeCreateForm, type NoticeBatchOption } from "@/components/admin/notices/NoticeCreateForm";
import { NoticeEditDialog, type AdminNoticeItem } from "@/components/admin/notices/NoticeEditDialog";
import { NoticeViewModal } from "@/components/admin/notices/NoticeViewModal";
import { Modal } from "@/components/admin/sa/Modal";
import { adminClassLevelOptions, getAdminClassLabel } from "@/constants/admin-display";
import { ButtonTitle, ConfirmDialog, requestGridRefresh, useGridRefreshListener, type ConfirmRequest } from "./shared";

const SOURCE = "notices";

const TYPE_LABELS: Record<string, string> = {
  general: "General",
  class: "Class",
  batch: "Batch",
  exam: "Exam",
  payment: "Payment",
};

type Row = {
  id: string;
  title: string;
  type: string;
  audience: string;
  classLevel: number | null;
  batchId: string;
  batchCode: string;
  batchClassLevel: number | null;
  topic: string;
  details: string;
  isPublished: boolean;
  status: "published" | "draft";
  examDate: string;
  publishedAt: string;
};

function toNotice(row: Row): AdminNoticeItem {
  return {
    _id: row.id,
    title: row.title,
    type: row.type,
    audience: row.audience,
    classLevel: row.classLevel ?? undefined,
    batch: row.batchId
      ? { _id: row.batchId, title: row.batchCode, batchCode: row.batchCode, classLevel: row.batchClassLevel ?? undefined }
      : undefined,
    topic: row.topic,
    details: row.details,
    isPublished: row.isPublished,
    examDate: row.examDate || undefined,
    publishedAt: row.publishedAt || undefined,
  };
}

export function NoticesGrid({ tiles, batches }: { tiles: GridTile[]; batches: NoticeBatchOption[] }) {
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  useGridRefreshListener(SOURCE, gridRef);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const togglePublish = useCallback(
    async (row: Row) => {
      try {
        const formData = new FormData();
        formData.append("id", row.id);
        if (!row.isPublished) formData.append("isPublished", "on");
        await toggleNoticePublishAction(formData);
        toast.success(row.isPublished ? "Notice moved to drafts." : "Notice published.");
        reload();
      } catch {
        toast.error("The notice could not be updated.");
      }
    },
    [reload]
  );

  const askDelete = useCallback(
    (row: Row) =>
      setConfirm({
        title: "Delete this notice?",
        description: `"${row.title}" will be removed for every student in the batch.`,
        confirmLabel: "Delete notice",
        danger: true,
        run: async () => {
          try {
            const formData = new FormData();
            formData.append("id", row.id);
            await deleteNoticeAction(formData);
            toast.success("Notice deleted.");
            reload();
          } catch {
            toast.error("The notice could not be deleted.");
          }
        },
      }),
    [reload]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "title",
        headerName: "Notice",
        minWidth: 260,
        flex: 1.5,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ButtonTitle onClick={() => setViewing(data)}>
              <TitleCell icon={Megaphone} title={data.title} sub={data.topic ? `Topic: ${data.topic}` : undefined} />
            </ButtonTitle>
          ) : null,
      },
      {
        field: "type",
        headerName: "Type",
        width: 120,
        ...setCol(Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))),
        valueFormatter: ({ value }) => TYPE_LABELS[value as string] ?? String(value ?? ""),
      },
      {
        field: "classLevel",
        headerName: "Class",
        width: 120,
        ...setCol(adminClassLevelOptions),
        valueFormatter: ({ value }) => (value ? getAdminClassLabel(value as number) : "—"),
      },
      {
        field: "batchCode",
        headerName: "Batch",
        width: 170,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? <code>{value}</code> : <Muted>—</Muted>),
      },
      { field: "topic", headerName: "Topic", width: 180, hide: true, ...textCol() },
      { field: "examDate", headerName: "Exam date", width: 130, ...dateCol() },
      { field: "publishedAt", headerName: "Published", width: 130, ...dateCol() },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        ...setCol([
          { value: "published", label: "Published" },
          { value: "draft", label: "Draft" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "published" ? <Pill tone="success">Published</Pill> : <Pill tone="warning">Draft</Pill>,
      },
      {
        colId: "actions",
        headerName: "",
        width: 150,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ActionIcons onView={() => setViewing(data)} onEdit={() => setEditing(data)} onDelete={() => askDelete(data)}>
              <IconAction
                icon={data.isPublished ? EyeOff : Send}
                label={data.isPublished ? "Unpublish" : "Publish"}
                tone={data.isPublished ? undefined : "success"}
                onClick={() => togglePublish(data)}
              />
            </ActionIcons>
          ) : null,
      },
    ],
    [askDelete, togglePublish]
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
        searchPlaceholder="Search title, topic, details or batch…"
        emptyTitle="No notices match"
        emptyDescription="Change the search or filters, or send a new notice."
        exportName="sage-notices"
      />

      {viewing ? <NoticeViewModal notice={toNotice(viewing)} batches={batches} onClose={() => setViewing(null)} /> : null}

      {editing ? (
        <NoticeEditDialog
          key={editing.id}
          notice={toNotice(editing)}
          batches={batches}
          defaultOpen
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      ) : null}

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

export function NoticeCreateButton({ batches }: { batches: NoticeBatchOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <BellPlus size={17} /> New notice
      </button>
      {open ? (
        <Modal
          open
          wide
          onClose={() => setOpen(false)}
          eyebrow="Notice"
          title="Send a notice"
          description="Choose a class and batch. Only students in that batch will see the notice."
        >
          <NoticeCreateForm
            batches={batches}
            embedded
            onSuccess={() => {
              setOpen(false);
              requestGridRefresh(SOURCE);
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}
