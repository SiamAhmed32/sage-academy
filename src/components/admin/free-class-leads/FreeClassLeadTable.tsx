"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { updateFreeClassLeadAction } from "@/app/admin/actions";
import { freeClassLeadStatusOptions } from "@/constants/admin";

export type FreeClassLeadRow = {
  _id: string;
  name: string;
  phone: string;
  classLabel: string;
  subject: string;
  status: string;
  adminNote: string;
  source: string;
  createdAt: string;
};

function waUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits.startsWith("0") ? digits : `0${digits}`;
  return `https://wa.me/88${local.replace(/^0/, "")}`;
}

export function FreeClassLeadTable({ initialLeads }: { initialLeads: FreeClassLeadRow[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialLeads.map((l) => [l._id, l.adminNote ?? ""]))
  );

  useEffect(() => {
    setLeads(initialLeads);
    setNotes(Object.fromEntries(initialLeads.map((l) => [l._id, l.adminNote ?? ""])));
  }, [initialLeads]);

  const setStatus = async (id: string, status: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", status);
    try {
      await updateFreeClassLeadAction(formData);
      setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
    } catch {
      toast.error("আপডেট ব্যর্থ");
    }
  };

  const saveNote = async (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("adminNote", notes[id] ?? "");
    try {
      await updateFreeClassLeadAction(formData);
      setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, adminNote: notes[id] ?? "" } : l)));
      toast.success("নোট সেভ হয়েছে");
    } catch {
      toast.error("সেভ ব্যর্থ");
    }
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-sage-border bg-white px-6 py-14 pb-16 text-center sm:py-16">
        <p className="text-lg font-bold text-sage-secondary sm:text-xl">কোনো লিড পাওয়া যায়নি</p>
        <p className="mt-2 text-sm text-sage-gray-600 sm:text-base">ফিল্টার বদলে দিন অথবা সার্চ ক্লিয়ার করে আবার চেষ্টা করুন।</p>
      </div>
    );
  }

  const selectCls =
    "box-border w-full min-w-0 max-w-[16rem] rounded-xl border border-sage-border bg-white px-3 py-2.5 text-left text-sm font-bold text-sage-secondary outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15 sm:max-w-[18rem] sm:text-base";

  return (
    <div className="overflow-hidden rounded-2xl border border-sage-border bg-white pb-6 shadow-sm sm:pb-8">
      <div className="overflow-x-auto overscroll-x-contain px-1 pb-1 sm:px-2">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm sm:min-w-[920px] sm:text-base">
          <thead>
            <tr className="border-b border-sage-border bg-sage-red-50/70">
              <th className="box-border w-[18%] px-4 py-4 text-xs font-black uppercase tracking-wide text-sage-primary sm:px-5 sm:py-5 sm:text-sm">
                শিক্ষার্থী
              </th>
              <th className="box-border w-[18%] px-4 py-4 text-xs font-black uppercase tracking-wide text-sage-primary sm:px-5 sm:py-5 sm:text-sm">
                যোগাযোগ
              </th>
              <th className="box-border w-[16%] px-4 py-4 text-xs font-black uppercase tracking-wide text-sage-primary sm:px-5 sm:py-5 sm:text-sm">
                শ্রেণী / বিষয়
              </th>
              <th className="box-border w-[10%] px-4 py-4 text-xs font-black uppercase tracking-wide text-sage-primary sm:px-5 sm:py-5 sm:text-sm">
                উৎস
              </th>
              <th className="box-border w-[14%] px-4 py-4 text-center text-xs font-black uppercase tracking-wide text-sage-primary sm:px-5 sm:py-5 sm:text-sm">
                স্ট্যাটাস
              </th>
              <th className="box-border min-w-[220px] px-4 py-4 text-xs font-black uppercase tracking-wide text-sage-primary sm:min-w-[260px] sm:px-5 sm:py-5 sm:text-sm">
                নোট
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border/60">
            {leads.map((l) => (
              <tr key={l._id} className="align-top transition-colors hover:bg-sage-red-50/25">
                <td className="box-border px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-6">
                  <p className="break-words text-base font-bold leading-snug text-sage-secondary sm:text-lg">{l.name}</p>
                  <p className="mt-1.5 text-xs text-sage-gray-500 sm:text-sm">
                    {new Date(l.createdAt).toLocaleString("bn-BD", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </td>
                <td className="box-border px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-6">
                  <p className="break-all font-mono text-sm font-semibold text-sage-secondary sm:text-base">{l.phone}</p>
                  <div className="mt-3 flex items-center gap-2.5">
                    <a
                      href={`tel:${l.phone}`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-red-50 text-sage-primary ring-1 ring-sage-red-100 transition hover:bg-sage-primary hover:text-white sm:h-11 sm:w-11"
                      title="কল"
                    >
                      <Phone className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
                    </a>
                    <button
                      type="button"
                      onClick={() => window.open(waUrl(l.phone), "_blank")}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm ring-1 ring-green-100 transition hover:bg-green-700 sm:h-11 sm:w-11"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
                    </button>
                  </div>
                </td>
                <td className="box-border max-w-[14rem] px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-6">
                  <p className="break-words text-sm font-bold text-sage-primary sm:text-base">{l.classLabel}</p>
                  <p className="mt-2 break-words text-sm font-semibold leading-snug text-sage-secondary sm:text-base">
                    {l.subject}
                  </p>
                </td>
                <td className="box-border px-4 pb-8 pt-5 sm:px-5 sm:pb-10 sm:pt-6">
                  <span
                    className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-bold sm:px-3 sm:py-1.5 sm:text-sm ${
                      l.source === "registered"
                        ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-100"
                        : "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                    }`}
                  >
                    {l.source === "registered" ? "লগইন" : "অতিথি"}
                  </span>
                </td>
                <td className="box-border px-4 pb-8 pt-5 text-center sm:px-5 sm:pb-10 sm:pt-6">
                  <div className="mx-auto inline-block w-full max-w-[16rem] text-left sm:max-w-[18rem]">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l._id, e.target.value)}
                      className={selectCls}
                    >
                      {freeClassLeadStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="box-border px-4 pb-10 pt-5 sm:px-5 sm:pb-12 sm:pt-6">
                  <div className="flex min-w-0 flex-col gap-3">
                    <textarea
                      rows={3}
                      value={notes[l._id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [l._id]: e.target.value }))}
                      placeholder="ফলো-আপ নোট লিখুন…"
                      className="box-border min-h-[5.5rem] w-full resize-y rounded-xl border border-sage-border px-3 py-2.5 text-sm leading-relaxed text-sage-secondary outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/15 sm:px-4 sm:text-base"
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => saveNote(l._id)}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-sage-secondary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-sage-primary sm:h-11 sm:px-6 sm:text-base"
                      >
                        নোট সেভ
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
