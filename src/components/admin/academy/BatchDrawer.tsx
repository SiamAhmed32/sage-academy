"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Pencil } from "lucide-react";

import { Modal } from "@/components/admin/sa/Modal";
import type { ClassOption, SubjectOption, TeacherOption } from "@/lib/academy/queries";
import { BatchBuilder, type BatchBuilderExisting, type OtherSlot } from "./BatchBuilder";

export type BatchFormData = {
  classes: ClassOption[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  years: number[];
  otherSlots: OtherSlot[];
  initialPreview?: { code: string; sequence: number } | null;
};

/**
 * Batch side drawer. `view` is read-only (with an Edit button), `edit` changes an existing batch,
 * and with no `existing` it creates one.
 */
export function BatchDrawer({
  open,
  onClose,
  onSaved,
  onEdit,
  data,
  existing,
  view = false,
  className,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Switch a view drawer into edit mode. */
  onEdit?: () => void;
  data: BatchFormData;
  existing?: BatchBuilderExisting;
  view?: boolean;
  className?: string;
}) {
  if (view && existing) {
    return (
      <Modal side open={open} onClose={onClose} eyebrow="Batch" title={existing.code} description={`${className ?? "Class"} · ${existing.students}/${existing.capacity} students · ${existing.routine.length || "no"} weekly classes`}>
        <BatchBuilder
          key={`view-${existing.id}`}
          part="setup"
          {...data}
          existing={existing}
          readOnly
          readOnlyActions={
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Link href={`/admin/academy/batches/${existing.id}/routine`} className="btn-secondary">
                <CalendarClock size={17} /> {existing.routine.length ? "Edit routine" : "Set routine"}
              </Link>
              {onEdit ? (
                <button type="button" className="btn-primary" onClick={onEdit}>
                  <Pencil size={17} /> Edit batch
                </button>
              ) : null}
            </div>
          }
        />
      </Modal>
    );
  }
  return (
    <Modal
      side
      open={open}
      onClose={onClose}
      eyebrow="Batches"
      title={existing ? `Edit ${existing.code}` : "Create batch"}
      description={
        existing
          ? "Change the batch size, note, subjects and teachers. The routine is set from the Routine button."
          : "Pick the class, boys or girls, and version — the code is made for you. Set the weekly routine afterwards."
      }
    >
      <BatchBuilder
        key={existing?.id ?? "new"}
        part="setup"
        {...data}
        existing={existing}
        onSaved={() => {
          onClose();
          onSaved?.();
        }}
      />
    </Modal>
  );
}

/** A button that opens the batch drawer. */
export function BatchDrawerButton({
  data,
  existing,
  className = "btn-primary",
  defaultOpen = false,
  onSaved,
  children,
}: {
  data: BatchFormData;
  existing?: BatchBuilderExisting;
  className?: string;
  defaultOpen?: boolean;
  onSaved?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Open after hydration (the modal only renders in the browser), e.g. for /batches?create=1.
  useEffect(() => {
    if (!defaultOpen) return;
    setOpen(true);
    // Drop ?create=1 / ?edit=1 so a reload doesn't reopen the panel.
    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    url.searchParams.delete("edit");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [defaultOpen]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} disabled={!existing && data.classes.length === 0}>
        {children}
      </button>
      <BatchDrawer open={open} onClose={() => setOpen(false)} onSaved={onSaved} data={data} existing={existing} />
    </>
  );
}

