"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, UserCheck } from "lucide-react";

interface Lead {
  _id: string;
  studentName: string;
  nameBangla?: string;
  phone?: string;
  studentWhatsapp?: string;
  studentGender?: string;
  academicVersion?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  section?: string;
  classRoll?: string;
  schoolName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  className?: string;
  createdAt?: string;
}

interface Props {
  onSelect: (lead: Lead) => void;
  onClear: () => void;
  selectedName?: string;
}

export function AdmissionLeadPicker({ onSelect, onClear, selectedName }: Props) {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch all form-only leads once on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/admission-requests?formOnly=true")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setLeads(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter on query change
  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setFiltered(leads.slice(0, 20));
    } else {
      setFiltered(
        leads.filter(
          (l) =>
            l.studentName?.toLowerCase().includes(q) ||
            l.nameBangla?.toLowerCase().includes(q) ||
            l.phone?.includes(q) ||
            l.studentWhatsapp?.includes(q)
        )
      );
    }
  }, [query, leads]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (selectedName) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <UserCheck size={18} className="text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">আবেদনকারী নির্বাচিত</p>
          <p className="text-sm font-extrabold text-green-800 truncate">{selectedName}</p>
        </div>
        <button
          type="button"
          onClick={() => { onClear(); setQuery(""); }}
          className="flex items-center gap-1 rounded-lg bg-white border border-green-200 px-2.5 py-1.5 text-xs font-bold text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
        >
          <X size={12} /> পরিবর্তন
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-sage-border bg-sage-red-50/20 px-4 py-3">
        <Search size={16} className="text-sage-primary shrink-0" />
        <input
          type="text"
          placeholder={loading ? "লোড হচ্ছে..." : "আবেদনকারীর নাম বা ফোন নম্বর দিয়ে খুঁজুন..."}
          value={query}
          disabled={loading}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}>
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-sage-border bg-white shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {filtered.map((lead) => (
            <button
              key={lead._id}
              type="button"
              onClick={() => { onSelect(lead); setOpen(false); setQuery(""); }}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-sage-red-50/40 transition border-b border-gray-50 last:border-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-red-50 text-sage-primary font-bold text-sm mt-0.5">
                {lead.studentName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{lead.studentName}</p>
                {lead.nameBangla && (
                  <p className="text-xs text-gray-500 truncate">{lead.nameBangla}</p>
                )}
                <p className="text-xs text-sage-primary font-semibold">{lead.phone || lead.studentWhatsapp}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-sage-border bg-white shadow-xl px-4 py-5 text-center text-sm text-gray-400">
          কোনো আবেদনকারী পাওয়া যায়নি
        </div>
      )}
    </div>
  );
}
