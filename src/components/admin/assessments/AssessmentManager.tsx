"use client";

import { useMemo, useState } from "react";
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
};

type ConfirmState = {
  isOpen: boolean;
  type: "delete" | "archive";
  item: AdminAssessmentItem | null;
};

export function AssessmentManager({ type, items }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAssessmentItem | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    type: "delete",
    item: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const isExam = type === "exam";
  const baseUrl = isExam ? "/api/exams" : "/api/model-tests";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchQuery = !q || [item.title, item.slug, item.status, item.examType, ...item.schoolFocus].filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchClass = classFilter === "all" || item.classLevels.includes(Number(classFilter));
      return matchQuery && matchStatus && matchClass;
    });
  }, [items, query, statusFilter, classFilter]);

  const confirmCopy = useMemo(() => {
    const title = confirmState.item?.title || "";
    if (confirmState.type === "archive") {
      return {
        title: "আর্কাইভ করতে চান?",
        message: `"${title}" আর্কাইভ লিস্টে পাঠানো হবে। পরে প্রয়োজনে আবার এডিট বা রিস্টোর করা যাবে।`,
        confirmLabel: "আর্কাইভ করুন",
      };
    }
    return {
      title: "চিরতরে মুছে ফেলতে চান?",
      message: `"${title}" এবং এর সম্পর্কিত তথ্য স্থায়ীভাবে মুছে ফেলা হবে।`,
      confirmLabel: "চিরতরে মুছুন",
    };
  }, [confirmState.item?.title, confirmState.type]);

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(item: AdminAssessmentItem) { setEditing(item); setModalOpen(true); }

  async function handleSave(payload: FormData) {
    const res = await fetch(editing ? `${baseUrl}/${editing._id}` : baseUrl, { method: editing ? "PATCH" : "POST", body: payload });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || "সেভ করা যায়নি");
    toast.success(editing ? "আপডেট হয়েছে" : "তৈরি হয়েছে");
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
    toast.success("আর্কাইভ হয়েছে");
    router.refresh();
  }

  async function removeItem(item: AdminAssessmentItem) {
    const res = await fetch(`${baseUrl}/${item._id}?permanent=true`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast.success("ডিলিট হয়েছে");
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
      toast.error(confirmState.type === "archive" ? "আর্কাইভ করা যায়নি" : "ডিলিট করা যায়নি");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-5">
      <AssessmentFilters query={query} onQueryChange={setQuery} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} classFilter={classFilter} onClassFilterChange={setClassFilter} onCreateClick={openCreate} isExam={isExam} />
      <AssessmentTable
        items={filtered}
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
