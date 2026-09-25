"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Avatar, StatusChip } from "@/components/admin/sa/ui";
import { searchStudentsAction } from "@/app/admin/academy/_actions/students";

export type PickedStudent = {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  className: string;
  batchCode: string;
  status: string;
};

/** Search box with live results; used by collect payment and transfer. */
export function StudentPicker({ onPick, autoFocus = false }: { onPick: (student: PickedStudent) => void; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ query: string; results: PickedStudent[] } | null>(null);
  const text = query.trim();
  const searching = text.length >= 2;
  const loading = searching && found?.query !== text;
  const results = searching && found?.query === text ? found.results : [];

  useEffect(() => {
    if (text.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await searchStudentsAction(text);
      if (!cancelled) setFound({ query: text, results: result.ok ? result.data ?? [] : [] });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text]);

  return (
    <div>
      <div className="field-search" style={{ maxWidth: "none" }}>
        <Search size={17} />
        <input
          className="toolbar-input"
          placeholder="Type a name, student ID (2605001) or phone..."
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="list-rows" style={{ marginTop: 8 }}>
        {loading ? <div className="cell-sub">Searching...</div> : null}
        {searching && !loading && results.length === 0 ? <div className="cell-sub">No student found.</div> : null}
        {results.map((student) => (
          <button
            key={student.id}
            type="button"
            onClick={() => onPick(student)}
            style={{ border: 0, background: "none", width: "100%", textAlign: "left", cursor: "pointer", padding: "10px 4px" }}
          >
            <Avatar name={student.name} size="sm" />
            <span className="grow">
              <b>{student.name}</b>
              <small>
                {student.studentId} · {student.className} · {student.batchCode} · {student.phone}
              </small>
            </span>
            {student.status !== "active" ? <StatusChip tone="neutral">Left</StatusChip> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
