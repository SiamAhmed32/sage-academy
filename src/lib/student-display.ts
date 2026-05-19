import { getClassLabel } from "@/constants/class-levels";

type StudentBatchInfo = {
  title?: string;
  batchCode?: string;
} | null | undefined;

export function formatStudentClass(classLevel?: number) {
  if (!classLevel) return "শ্রেণি নির্ধারিত নেই";
  return getClassLabel(classLevel);
}

export function formatStudentBatchCode(batch?: StudentBatchInfo) {
  if (!batch?.batchCode) return "ব্যাচ কোড নেই";
  return batch.batchCode;
}

export function formatStudentEnrollment(classLevel?: number, batch?: StudentBatchInfo) {
  return {
    classLabel: formatStudentClass(classLevel),
    batchCode: formatStudentBatchCode(batch),
  };
}
