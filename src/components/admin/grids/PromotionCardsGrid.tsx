"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef } from "ag-grid-community";
import { Archive, Layout, Plus, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";

import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, dateCol, numberCol, setCol, textCol } from "@/components/admin/grid/cells";
import { PromotionCardCreateModal } from "@/components/admin/promotion-cards/PromotionCardCreateModal";
import { PromotionCardEditModal } from "@/components/admin/promotion-cards/PromotionCardEditModal";
import type { PromotionCard } from "@/components/admin/promotion-cards/types";
import { formatPromotionCardBadgeForAdmin } from "@/lib/promotion-card-serialize";
import { ConfirmDialog, ThumbTitle, readApiResult, requestGridRefresh, useGridRefreshListener, yesNoOptions, type ConfirmRequest } from "./shared";

const SOURCE = "promotion-cards";

// Stored badge values are public (Bangla) website copy; the admin sees English labels.
const BADGE_OPTIONS = [
  "ভর্তি চলছে", // admin-language-allow: persisted public content
  "শীঘ্রই শুরু", // admin-language-allow: persisted public content
  "ভর্তি বন্ধ", // admin-language-allow: persisted public content
].map((value) => ({ value, label: formatPromotionCardBadgeForAdmin(value) }));

export type PromotionBatchOption = { _id: string; title: string; batchCode: string; group?: "new" | "old" };

type Row = {
  id: string;
  title: string;
  image: string;
  badge: string;
  features: string[];
  overview: string;
  linkedBatch: string;
  batchLabel: string;
  batchSub: string;
  visibility: "visible" | "hidden" | "archived";
  websiteVisible: boolean;
  featured: boolean;
  order: number;
  isArchived: boolean;
  createdAt: string;
};

function toCard(row: Row): PromotionCard {
  return {
    _id: row.id,
    title: row.title,
    image: row.image,
    badge: row.badge,
    features: row.features,
    overview: row.overview,
    linkedBatch: row.linkedBatch || undefined,
    websiteVisible: row.websiteVisible,
    featured: row.featured,
    order: row.order,
    isArchived: row.isArchived,
  };
}

export function PromotionCardsGrid({ tiles, batches }: { tiles: GridTile[]; batches: PromotionBatchOption[] }) {
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  useGridRefreshListener(SOURCE, gridRef);
  // Stable object: the edit modal resets its preview whenever "card" changes.
  const editingCard = useMemo(() => (editing ? toCard(editing) : undefined), [editing]);

  const reload = useCallback(() => {
    gridRef.current?.refresh(false);
    router.refresh();
  }, [router]);

  const runAction = useCallback(
    async (row: Row, action: "archive" | "restore" | "delete") => {
      try {
        const url = `/api/promotion-cards/${row.id}`;
        if (action === "restore") {
          const formData = new FormData();
          formData.append("isArchived", "false");
          formData.append("websiteVisible", "on");
          await readApiResult(await fetch(url, { method: "PATCH", body: formData }), "The action failed");
        } else {
          await readApiResult(await fetch(action === "delete" ? `${url}?permanent=true` : url, { method: "DELETE" }), "The action failed");
        }
        toast.success(action === "archive" ? "Card archived" : action === "restore" ? "Card restored" : "Card permanently deleted");
        reload();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    },
    [reload]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "title",
        headerName: "Card",
        minWidth: 260,
        flex: 1.4,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <ThumbTitle wide image={data.image} icon={Layout} title={data.title} sub={formatPromotionCardBadgeForAdmin(data.badge)} /> : null,
      },
      {
        field: "badge",
        headerName: "Badge",
        width: 150,
        hide: true,
        ...setCol(BADGE_OPTIONS),
        valueFormatter: ({ value }) => formatPromotionCardBadgeForAdmin(String(value ?? "")),
      },
      {
        field: "batchLabel",
        headerName: "Linked batch",
        width: 190,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.batchLabel ? (
            <span className="sa-grid-title-copy">
              <b>{data.batchLabel}</b>
              {data.batchSub ? <small>{data.batchSub}</small> : null}
            </span>
          ) : (
            <Muted>Not linked</Muted>
          ),
      },
      {
        colId: "features",
        headerName: "Features",
        minWidth: 220,
        flex: 1,
        sortable: false,
        valueGetter: ({ data }) => data?.features.join(" · ") ?? "",
        tooltipValueGetter: ({ data }) => data?.features.join("\n") ?? "",
        context: { exportValue: (row: Row) => row.features.join(" | ") },
      },
      {
        field: "visibility",
        headerName: "Website",
        width: 120,
        ...setCol([
          { value: "visible", label: "Visible" },
          { value: "hidden", label: "Hidden" },
          { value: "archived", label: "Archived" },
        ]),
        cellRenderer: ({ value }: { value?: string }) =>
          value === "visible" ? <Pill tone="success">Visible</Pill> : value === "hidden" ? <Pill tone="warning">Hidden</Pill> : <Pill tone="neutral">Archived</Pill>,
      },
      {
        field: "featured",
        headerName: "Homepage",
        width: 130,
        ...setCol(yesNoOptions("Featured", "Regular")),
        cellRenderer: ({ value }: { value?: boolean }) => (value ? <Pill tone="info">Featured</Pill> : <Muted>Regular</Muted>),
        context: { exportValue: (row: Row) => (row.featured ? "Featured" : "Regular") },
      },
      { field: "order", headerName: "Order", width: 100, ...numberCol() },
      { field: "createdAt", headerName: "Created", width: 130, hide: true, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 130,
        cellRenderer: ({ data }: { data?: Row }) =>
          !data ? null : data.isArchived ? (
            <ActionIcons
              onEdit={() => setEditing(data)}
              onDelete={() =>
                setConfirm({
                  title: "Delete this card permanently?",
                  description: `"${data.title}" will be deleted. This cannot be undone.`,
                  confirmLabel: "Delete permanently",
                  danger: true,
                  run: () => runAction(data, "delete"),
                })
              }
            >
              <IconAction icon={RotateCcw} label="Restore" tone="success" onClick={() => runAction(data, "restore")} />
            </ActionIcons>
          ) : (
            <ActionIcons onEdit={() => setEditing(data)}>
              <IconAction
                icon={Archive}
                label="Archive"
                onClick={() =>
                  setConfirm({
                    title: "Archive this card?",
                    description: `"${data.title}" will be hidden from the website. You can restore it later.`,
                    confirmLabel: "Archive card",
                    run: () => runAction(data, "archive"),
                  })
                }
              />
            </ActionIcons>
          ),
      },
    ],
    [runAction]
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
        searchPlaceholder="Search title, features or batch…"
        emptyTitle="No cards found"
        emptyDescription="Clear the search or filters, or create a new promotion card."
        exportName="sage-promotion-cards"
      />

      {editing ? (
        <PromotionCardEditModal
          key={editing.id}
          card={editingCard}
          batches={batches}
          open
          onClose={() => setEditing(null)}
          onSaved={() => gridRef.current?.refresh(false)}
        />
      ) : null}

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

export function PromotionCardCreateButton({ batches }: { batches: PromotionBatchOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={17} /> New promotion card
      </button>
      {open ? (
        <PromotionCardCreateModal batches={batches} open onClose={() => setOpen(false)} onSaved={() => requestGridRefresh(SOURCE)} />
      ) : null}
    </>
  );
}
