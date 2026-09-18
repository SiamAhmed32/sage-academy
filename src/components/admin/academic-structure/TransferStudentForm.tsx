"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import type { StudentRow } from "@/components/admin/academic-structure/types";

type EnrollmentRow = {
  _id: string;
  subjectBatchId: {
    _id: string;
    subjectId?: { _id: string; name: string };
    batchGroupId?: { name: string };
  };
  status: string;
};

type AlternateSlot = {
  _id: string;
  batchGroupId?: { name: string };
  seatsUsed: number;
  maxSeats: number;
  seatsAvailable: number;
};

export function TransferStudentForm({ students }: { students: StudentRow[] }) {
  const [studentId, setStudentId] = useState(students[0]?._id ?? "");
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(Boolean(students[0]?._id));
  const [alternatesFor, setAlternatesFor] = useState<string | null>(null);
  const [alternates, setAlternates] = useState<AlternateSlot[]>([]);
  const [transferring, setTransferring] = useState<string | null>(null);

  const loadEnrollments = useCallback(async (id: string, signal?: AbortSignal) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/enrollments?studentId=${id}`, { signal });
      const json: { data?: EnrollmentRow[] } = await res.json();
      if (!signal?.aborted) {
        setEnrollments((json.data ?? []).filter((e) => e.status === "ACTIVE"));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadEnrollments(studentId, controller.signal);
    return () => controller.abort();
  }, [studentId, loadEnrollments]);

  function showAlternates(enrollment: EnrollmentRow) {
    const subjectId = enrollment.subjectBatchId.subjectId?._id;
    if (!subjectId) return;
    setAlternatesFor(enrollment._id);
    fetch(`/api/subject-batches?subjectId=${subjectId}`)
      .then((res) => res.json())
      .then((json: { data?: AlternateSlot[] }) => {
        setAlternates((json.data ?? []).filter((s) => s._id !== enrollment.subjectBatchId._id));
      });
  }

  async function handleTransfer(enrollmentId: string, newSubjectBatchId: string) {
    setTransferring(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSubjectBatchId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Transfer failed");
      }
      toast.success("Student transferred successfully.");
      setAlternatesFor(null);
      setLoading(true);
      loadEnrollments(studentId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferring(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sage-border bg-white p-4">
        <label className="text-xs font-bold text-sage-secondary">Student</label>
        <select
          value={studentId}
          onChange={(e) => {
            setLoading(true);
            setAlternatesFor(null);
            setStudentId(e.target.value);
          }}
          className="mt-1 h-10 w-full max-w-md rounded-lg border border-sage-border px-3 text-sm"
        >
          {students.map((s) => (
            <option key={s._id} value={s._id}>{s.nameEnglish} — {s.studentId}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sage-red-50/40 text-xs font-black uppercase tracking-wide text-sage-secondary">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Current batch</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <Fragment key={e._id}>
                <tr className="border-t border-sage-border">
                  <td className="px-4 py-3 font-bold text-sage-secondary">{e.subjectBatchId.subjectId?.name ?? "—"}</td>
                  <td className="px-4 py-3">{e.subjectBatchId.batchGroupId?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => showAlternates(e)}
                      className="text-xs font-bold text-sage-primary hover:underline"
                    >
                      Transfer…
                    </button>
                  </td>
                </tr>
                {alternatesFor === e._id && (
                  <tr className="border-t border-sage-border bg-sage-red-50/20">
                    <td colSpan={3} className="px-4 py-3">
                      {alternates.length === 0 ? (
                        <p className="text-xs text-sage-gray-500">No alternate sections found for this subject.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {alternates.map((alt) => {
                            const full = alt.seatsAvailable <= 0;
                            return (
                              <button
                                key={alt._id}
                                type="button"
                                disabled={full || transferring === e._id}
                                onClick={() => handleTransfer(e._id, alt._id)}
                                className="rounded-lg border border-sage-border px-3 py-2 text-xs font-bold disabled:opacity-40"
                              >
                                {alt.batchGroupId?.name} · {alt.seatsUsed}/{alt.maxSeats}
                                {full && " (full)"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!loading && enrollments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sage-gray-400">
                  This student has no active enrollments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
