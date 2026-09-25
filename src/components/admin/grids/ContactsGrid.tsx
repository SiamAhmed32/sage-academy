"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

import { updateContactRequestAction } from "@/app/admin/actions";
import { ContactDeleteModal } from "@/components/admin/contacts/ContactDeleteModal";
import { ContactDetailModal } from "@/components/admin/contacts/ContactDetailModal";
import type { ContactRequestItem } from "@/components/admin/contacts/types";
import { SaDataGrid, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, TitleCell, dateCol, setCol, textCol } from "@/components/admin/grid/cells";
import { contactStatusOptions } from "@/constants/admin";
import { formatAdminDateTime } from "@/lib/admin-format";
import { ContactLinks, NoteCell, NoteModal, StatusSelectCell, type LeadContext } from "./lead-cells";

type Row = ContactRequestItem & { id: string; status: string; adminNote: string };

type ContactContext = LeadContext<Row> & {
  view: (row: Row) => void;
  remove: (row: Row) => void;
  canDelete: boolean;
};

function ContactActions({ data, context }: ICellRendererParams<Row, unknown, ContactContext>) {
  if (!data) return null;
  return (
    <ActionIcons onView={() => context.view(data)} onDelete={context.canDelete ? () => context.remove(data) : undefined}>
      <ContactLinks phone={data.phone} />
    </ActionIcons>
  );
}

export function ContactsGrid({ tiles, canDelete, initialSearch }: { tiles: GridTile[]; canDelete: boolean; initialSearch?: string }) {
  const router = useRouter();
  const grid = useRef<SaDataGridHandle>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [noteRow, setNoteRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const reload = useCallback(() => {
    grid.current?.refresh(false);
    router.refresh();
  }, [router]);

  /** The action writes status and note together, so always send both. */
  const save = useCallback(
    async (row: Row, patch: { status?: string; adminNote?: string }, message: string) => {
      const formData = new FormData();
      formData.append("id", row.id);
      formData.append("status", patch.status ?? row.status);
      formData.append("adminNote", patch.adminNote ?? row.adminNote ?? "");
      try {
        await updateContactRequestAction(formData);
        toast.success(message);
        reload();
        return true;
      } catch {
        toast.error("Could not update the contact. Please try again.");
        return false;
      }
    },
    [reload]
  );

  const context = useMemo<Omit<ContactContext, "refresh">>(
    () => ({
      setStatus: (row, status) => save(row, { status }, "Status updated"),
      editNote: setNoteRow,
      view: setDetail,
      remove: setDeleting,
      canDelete,
    }),
    [save, canDelete]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "Sender",
        minWidth: 210,
        flex: 1,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) => (data ? <TitleCell icon={MessageSquare} title={data.name} sub={data.phone} /> : null),
      },
      { field: "phone", headerName: "Phone", width: 145, hide: true, ...textCol() },
      {
        field: "message",
        headerName: "Message",
        minWidth: 260,
        flex: 2,
        tooltipField: "message",
        ...textCol(),
      },
      {
        field: "createdAt",
        headerName: "Received",
        width: 175,
        ...dateCol(),
        valueFormatter: ({ value }) => (value ? formatAdminDateTime(String(value)) : "—"),
      },
      { field: "source", headerName: "Form source", width: 170, hide: true, ...textCol() },
      { field: "utmCampaign", headerName: "Campaign", width: 160, hide: true, ...textCol() },
      { field: "adminNote", headerName: "Note", minWidth: 160, flex: 1, ...textCol(), cellRenderer: NoteCell },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        ...setCol(contactStatusOptions),
        cellRenderer: StatusSelectCell,
        cellRendererParams: { options: contactStatusOptions },
      },
      { colId: "actions", headerName: "", width: 150, cellRenderer: ContactActions },
    ],
    []
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={grid}
        source="contacts"
        gridId="contacts"
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        context={context}
        initialSearch={initialSearch}
        searchPlaceholder="Search name, phone or message…"
        emptyTitle="No messages found"
        emptyDescription="Adjust the search or filters and try again."
        exportName="sage-contact-messages"
      />

      {detail ? <ContactDetailModal key={detail.id} item={detail} onClose={() => setDetail(null)} onSaved={reload} /> : null}

      {deleting ? <ContactDeleteModal item={deleting} onClose={() => setDeleting(null)} onDeleted={reload} /> : null}

      {noteRow ? (
        <NoteModal
          key={noteRow.id}
          title={noteRow.name}
          subtitle={noteRow.phone}
          initialNote={noteRow.adminNote}
          onClose={() => setNoteRow(null)}
          onSave={(adminNote) => save(noteRow, { adminNote }, "Note saved")}
        />
      ) : null}
    </>
  );
}
