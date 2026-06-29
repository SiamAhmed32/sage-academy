export type ExamHubSession = {
  enrollmentId: string;
  phone: string;
  programSlug: string;
  name?: string;
  status?: string;
  paymentStatus?: string;
  statusLabel?: string;
  adminNote?: string;
  canRegisterAgain?: boolean;
  canStartExam?: boolean;
};

const STORAGE_KEY = "sage-exam-hub-session";

export function saveExamHubSession(session: ExamHubSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readExamHubSession(programSlug?: string): ExamHubSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamHubSession;
    if (programSlug && parsed.programSlug !== programSlug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearExamHubSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function mergeExamHubSession(
  programSlug: string,
  patch: Partial<Omit<ExamHubSession, "programSlug">>
) {
  const current = readExamHubSession(programSlug);
  if (!current) return null;
  const next = { ...current, ...patch, programSlug };
  saveExamHubSession(next);
  return next;
}
