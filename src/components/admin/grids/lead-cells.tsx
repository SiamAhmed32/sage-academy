"use client";

import { useState } from "react";
import type { ICellRendererParams } from "ag-grid-community";
import { MessageCircle, MessageSquare, Phone } from "lucide-react";

import type { GridContext } from "@/components/admin/grid/SaDataGrid";
import { Muted, Pill, type PillTone } from "@/components/admin/grid/cells";
import { Modal } from "@/components/admin/sa/Modal";
import { getAdminStatusLabel } from "@/constants/admin-display";

export type StatusOption = { value: string; label: string };

/** Callbacks every lead grid hands its cells through the grid context. */
export type LeadContext<Row> = GridContext & {
  setStatus: (row: Row, status: string) => Promise<boolean>;
  editNote: (row: Row) => void;
};

/** WhatsApp link for a Bangladeshi number (01XXXXXXXXX → 8801XXXXXXXXX). */
export function waUrl(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("880")
    ? digits
    : digits.startsWith("0")
      ? `88${digits}`
      : digits.length === 10 && digits.startsWith("1")
        ? `880${digits}`
        : digits;
  return `https://wa.me/${international}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function statusTone(status: string): PillTone {
  switch (status) {
    case "new":
      return "info";
    case "contacted":
    case "scheduled":
      return "warning";
    case "qualified":
    case "confirmed":
    case "attended":
    case "closed":
      return "success";
    case "spam":
    case "invalid":
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={statusTone(status)}>{getAdminStatusLabel(status)}</Pill>;
}

/** Call + WhatsApp icon links (plain anchors: tel: and wa.me are not app routes). */
export function ContactLinks({ phone, whatsappText }: { phone: string; whatsappText?: string }) {
  if (!phone) return null;
  return (
    <>
      <a href={`tel:${phone}`} className="sa-grid-icon-btn" title="Call" aria-label="Call">
        <Phone size={15} />
      </a>
      <a
        href={waUrl(phone, whatsappText)}
        target="_blank"
        rel="noreferrer"
        className="sa-grid-icon-btn success"
        title="Open WhatsApp"
        aria-label="Open WhatsApp"
      >
        <MessageCircle size={15} />
      </a>
    </>
  );
}

/** Inline status dropdown. Saves at once, then the row is updated in place. */
export function StatusSelectCell<Row extends { status: string }>(
  props: ICellRendererParams<Row, unknown, LeadContext<Row>> & { options: StatusOption[] }
) {
  const { data, node, context, options } = props;
  const [pending, setPending] = useState(false);
  if (!data) return null;
  const known = options.some((option) => option.value === data.status);
  return (
    <select
      className="sa-grid-cell-select"
      value={data.status}
      disabled={pending}
      aria-label="Status"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onChange={async (event) => {
        const next = event.target.value;
        setPending(true);
        const ok = await context.setStatus(data, next);
        setPending(false);
        if (ok) node.setData({ ...data, status: next });
      }}
    >
      {!known ? <option value={data.status}>{getAdminStatusLabel(data.status || "new")}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Note preview that opens the note editor. */
export function NoteCell<Row extends { adminNote: string }>({ data, context }: ICellRendererParams<Row, unknown, LeadContext<Row>>) {
  if (!data) return null;
  return (
    <button
      type="button"
      className="text-button"
      onClick={(event) => {
        event.stopPropagation();
        context.editNote(data);
      }}
      title={data.adminNote || "Add a follow-up note"}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", overflow: "hidden" }}
    >
      <MessageSquare size={14} style={{ flexShrink: 0 }} />
      {data.adminNote ? (
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.adminNote}</span>
      ) : (
        <Muted>Add note</Muted>
      )}
    </button>
  );
}

/** Follow-up note editor shared by the lead tables. Mount it (with a key per row) only while open. */
export function NoteModal({
  title,
  subtitle,
  initialNote,
  onClose,
  onSave,
}: {
  title: string;
  subtitle?: string;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const ok = await onSave(note.trim());
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Follow-up note"
      title={title}
      description={subtitle}
      actions={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save note"}
          </button>
        </>
      }
    >
      <label className="field">
        Note
        <textarea
          className="textarea"
          rows={5}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Write a follow-up note..."
        />
      </label>
    </Modal>
  );
}
