"use client";

import { ArrowUpDown, Calendar, Filter, MessageCircle, RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateQuizSubmissionAction } from "@/app/admin/actions";
import { getAdminClassLabel, getAdminStatusLabel } from "@/constants/admin-display";
import { formatAdminDate, formatAdminNumber } from "@/lib/admin-format";
import { toast } from "react-toastify";

export type QuizLead = {
  _id: string;
  name: string;
  phone: string;
  classLevel: number;
  score: number;
  totalQuestions: number;
  whatsappRequested: boolean;
  status: string;
  adminNote: string;
  createdAt: string;
  answers: Array<{
    question?: {
      questionText?: string;
      explanation?: string;
    } | null;
  }>;
};

type QuizLeadFilters = {
  q: string;
  status: string;
  classLevel: string;
  whatsapp: string;
  dateRange: string;
  sort: string;
  limit: number;
  pageSizeOptions: number[];
  classLevels: number[];
};

export function QuizLeadTable({
  initialLeads,
  filters,
}: {
  initialLeads: QuizLead[];
  filters: QuizLeadFilters;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [searchValue, setSearchValue] = useState(filters.q);
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && !(key === "sort" && value === "newest")) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchValue.trim() !== filters.q) updateParam("q", searchValue.trim());
    }, 450);
    return () => window.clearTimeout(timer);
  }, [filters.q, searchValue, updateParam]);

  const handleSendWhatsApp = (lead: QuizLead) => {
    // Dynamic communication exception: this Bengali outreach is intentionally sent to Bengali leads.
    const message = `আসসালামু আলাইকুম ${lead.name}!${" " /* admin-language-allow */}
SAGE Academy-র কুইজে অংশগ্রহণের জন্য ধন্যবাদ।${" " /* admin-language-allow */}
আপনার কুইজ স্কোর: ${lead.score}/${lead.totalQuestions}।${" " /* admin-language-allow */}

সঠিক উত্তর এবং ব্যাখ্যাগুলো নিচে দেয়া হলো:${"" /* admin-language-allow */}
${lead.answers.map((a, i) => `\nQ${i+1}: ${a.question?.questionText}\nসঠিক উত্তর ও ব্যাখ্যা: ${a.question?.explanation || 'সঠিক উত্তর দেয়া হয়েছে।' /* admin-language-allow */}`).join('\n')}

আপনার একাডেমিক প্রস্তুতির জন্য কোনো সহযোগিতার প্রয়োজন হলে আমাদের জানান। ধন্যবাদ!${"" /* admin-language-allow */}`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/88${lead.phone.replace(/^0/, '')}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const handleStatusChange = async (id: string, status: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", status);
    
    try {
      await updateQuizSubmissionAction(formData);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const filterPanel = (
    <div className="rounded-2xl border border-sage-border bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative md:col-span-2">
          <span className="sr-only">Search quiz leads</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-gray-400" aria-hidden />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by name or phone..."
            className="h-11 w-full rounded-xl border border-sage-border bg-white pl-10 pr-4 text-sm outline-none focus:border-sage-primary"
          />
        </label>
        <label className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sage-gray-400" aria-hidden />
          <span className="sr-only">Status</span>
          <select value={filters.status} onChange={(event) => updateParam("status", event.target.value)} className="h-11 w-full rounded-xl border border-sage-border px-3 text-sm">
            <option value="all">All statuses</option>
            {["new", "contacted", "invalid", "qualified"].map((status) => (
              <option key={status} value={status}>{getAdminStatusLabel(status)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Class</span>
          <select value={filters.classLevel} onChange={(event) => updateParam("classLevel", event.target.value)} className="h-11 w-full rounded-xl border border-sage-border px-3 text-sm">
            <option value="all">All classes</option>
            {filters.classLevels.map((level) => (
              <option key={level} value={level}>{getAdminClassLabel(level)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">WhatsApp requested</span>
          <select value={filters.whatsapp} onChange={(event) => updateParam("whatsapp", event.target.value)} className="h-11 w-full rounded-xl border border-sage-border px-3 text-sm">
            <option value="all">Any WhatsApp preference</option>
            <option value="yes">WhatsApp requested</option>
            <option value="no">WhatsApp not requested</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sage-gray-400" aria-hidden />
          <span className="sr-only">Date range</span>
          <select value={filters.dateRange} onChange={(event) => updateParam("dateRange", event.target.value)} className="h-11 w-full rounded-xl border border-sage-border px-3 text-sm">
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-sage-gray-400" aria-hidden />
          <span className="sr-only">Sort</span>
          <select value={filters.sort} onChange={(event) => updateParam("sort", event.target.value)} className="h-11 w-full rounded-xl border border-sage-border px-3 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score-desc">Highest score first</option>
            <option value="score-asc">Lowest score first</option>
          </select>
        </label>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Leads per page</span>
            <select value={String(filters.limit)} onChange={(event) => updateParam("limit", event.target.value)} className="h-11 w-full rounded-xl border border-sage-border px-3 text-sm">
              {filters.pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => router.push("/admin/quiz-leads")} className="grid h-11 w-11 place-items-center rounded-xl border border-sage-border text-sage-gray-500 hover:text-sage-primary" title="Clear filters" aria-label="Clear filters">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        {filterPanel}
        <div className="rounded-2xl border border-sage-border bg-white p-20 text-center">
          <p className="text-lg font-bold text-sage-secondary">No quiz leads found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filterPanel}
      <div className="rounded-2xl border border-sage-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sage-red-50/50 text-[10px] font-black uppercase tracking-widest text-sage-primary">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Phone and class</th>
              <th className="px-6 py-4 text-center">Score</th>
              <th className="px-6 py-4 text-center">WhatsApp?</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border/50">
            {leads.map((l) => (
              <tr key={l._id} className="group hover:bg-sage-red-50/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-sage-secondary">{l.name}</p>
                  <p className="text-[10px] text-sage-gray-400">{formatAdminDate(l.createdAt)}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-sage-secondary">{l.phone}</p>
                  <span className="text-[10px] font-bold text-sage-primary">{getAdminClassLabel(l.classLevel)}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <p className="text-base font-black text-sage-secondary">{formatAdminNumber(l.score)}/{formatAdminNumber(l.totalQuestions)}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  {l.whatsappRequested ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">Yes</span>
                  ) : (
                    <span className="text-[10px] text-sage-gray-400">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <select
                    value={l.status}
                    onChange={(e) => handleStatusChange(l._id, e.target.value)}
                    className="h-8 rounded-lg border border-sage-border bg-white px-2 text-[10px] font-bold outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="invalid">Invalid</option>
                    <option value="qualified">Qualified</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleSendWhatsApp(l)}
                      className="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-green-600 transition shadow-sm"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
