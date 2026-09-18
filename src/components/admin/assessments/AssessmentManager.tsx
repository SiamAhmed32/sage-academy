"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { AssessmentConfirmModal } from "./AssessmentConfirmModal";
import { AssessmentFilters } from "./AssessmentFilters";
import { AssessmentTable } from "./AssessmentTable";
import { AssessmentFormModal } from "./AssessmentFormModal";

type FeeRow = { classLevel: number; label: string; sageStudentFee: number; outsideStudentFee: number };
type RoutineRow = { day: string; time: string; subject: string };
type ClassInfo = { classLevel: number; subjects: string[]; routine: RoutineRow[] };

export type AdminAssessmentItem = {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  examType?: string;
  classLevels: number[];
  version: "bangla" | "english" | "both";
  schoolFocus: string[];
  startDate: string;
  endDate: string;
  routineTitle?: string;
  routineSubtitle?: string;
  scheduleNote: string;
  fees: FeeRow[];
  classSpecificInfo: ClassInfo[];
  features: string[];
  status: "draft" | "published" | "hidden" | "archived";
  featured: boolean;
  order: number;
};

type Props = {
  type: "modelTest" | "exam";
  items: AdminAssessmentItem[];
  filters: {
    q: string;
    status: string;
    classLevel: string;
    sort: string;
  };
};

type ConfirmState = {
  isOpen: boolean;
  type: "delete" | "archive";
  item: AdminAssessmentItem | null;
};

export function AssessmentManager({ type, items, filters }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAssessmentItem | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    type: "delete",
    item: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const isExam = type === "exam";
  const baseUrl = isExam ? "/api/exams" : "/api/model-tests";

  const confirmCopy = (() => {
    const title = confirmState.item?.title || "";
    if (confirmState.type === "archive") {
      return {
        title: "Archive this item?",
        message: `"${title}" will move to the archive. You can edit or restore it later.`,
        confirmLabel: "Archive",
      };
    }
    return {
      title: "Delete permanently?",
      message: `"${title}" and its related information will be permanently deleted.`,
      confirmLabel: "Delete permanently",
    };
  })();

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(item: AdminAssessmentItem) { setEditing(item); setModalOpen(true); }

  async function handleSave(payload: FormData) {
    const res = await fetch(editing ? `${baseUrl}/${editing._id}` : baseUrl, { method: editing ? "PATCH" : "POST", body: payload });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || "Could not save");
    toast.success(editing ? "Updated successfully" : "Created successfully");
    router.refresh();
  }

  function buildArchivePayload(item: AdminAssessmentItem) {
    const payload = new FormData();
    payload.set("title", item.title);
    payload.set("image", item.image || "");
    payload.set("slug", "");
    payload.set("classLevels", item.classLevels.join(","));
    payload.set("version", item.version);
    payload.set("schoolFocus", item.schoolFocus.join("\n"));
    payload.set("startDate", new Date(item.startDate).toISOString().slice(0, 10));
    payload.set("endDate", new Date(item.endDate).toISOString().slice(0, 10));
    payload.set("routineTitle", item.routineTitle || "");
    payload.set("routineSubtitle", item.routineSubtitle || "");
    payload.set("scheduleNote", item.scheduleNote || "");
    payload.set("feesJson", JSON.stringify(item.fees));
    payload.set("classSpecificInfoJson", JSON.stringify(item.classSpecificInfo || []));
    payload.set("features", item.features.join("\n"));
    payload.set("status", "archived");
    payload.set("order", String(item.order || 0));
    if (isExam) payload.set("examType", item.examType || "Regular Exam");
    return payload;
  }

  async function archiveItem(item: AdminAssessmentItem) {
    const res = await fetch(`${baseUrl}/${item._id}`, { method: "PATCH", body: buildArchivePayload(item) });
    if (!res.ok) throw new Error();
    toast.success("Archived successfully");
    router.refresh();
  }

  async function removeItem(item: AdminAssessmentItem) {
    const res = await fetch(`${baseUrl}/${item._id}?permanent=true`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast.success("Deleted successfully");
    router.refresh();
  }

  async function handleConfirmAction() {
    if (!confirmState.item) return;
    setIsProcessing(true);
    try {
      if (confirmState.type === "archive") {
        await archiveItem(confirmState.item);
      } else {
        await removeItem(confirmState.item);
      }
      setConfirmState({ isOpen: false, type: "delete", item: null });
    } catch {
      toast.error(confirmState.type === "archive" ? "Could not archive" : "Could not delete");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-5">
      <AssessmentFilters filters={filters} onCreateClick={openCreate} isExam={isExam} />
      <AssessmentTable
        items={items}
        isExam={isExam}
        onEdit={openEdit}
        onArchive={(item) => setConfirmState({ isOpen: true, type: "archive", item })}
        onRemove={(item) => setConfirmState({ isOpen: true, type: "delete", item })}
      />
      <AssessmentFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editingItem={editing} isExam={isExam} onSave={handleSave} />
      <AssessmentConfirmModal
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        type={confirmState.type}
        isOpen={confirmState.isOpen}
        isProcessing={isProcessing}
        onClose={() => {
          if (!isProcessing) setConfirmState({ isOpen: false, type: "delete", item: null });
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
