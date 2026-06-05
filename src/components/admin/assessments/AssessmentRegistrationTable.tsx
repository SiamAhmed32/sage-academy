"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "react-toastify";

import { assessmentLeadStatusOptions } from "@/schemas/assessment";

type Registration = {
  _id: string;
  assessmentKind: "modelTest" | "exam";
  assessmentTitle: string;
  assessmentType?: string;
  name: string;
  phone: string;
  classLabel: string;
  version: string;
  schoolName: string;
  selectedSubjects: string[];
  applicantType: "sage" | "outside";
  message: string;
  status: string;
  adminNote: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  new: "নতুন",
  contacted: "যোগাযোগ হয়েছে",
  confirmed: "কনফার্মড",
  attended: "উপস্থিত",
  cancelled: "বাতিল",
  invalid: "ভুল তথ্য",
};

function waUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits.startsWith("0") ? digits : `0${digits}`;
  return `https://wa.me/88${local.replace(/^0/, "")}`;
}

export function AssessmentRegistrationTable({ initialItems }: { initialItems: Registration[] }) {
  const [items, setItems] = useState(initialItems);
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialItems.map((item) => [item._id, item.adminNote || ""]))
  );

  async function update(id: string, payload: Record<string, string>) {
    try {
      const res = await fetch(`/api/assessment-registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "আপডেট ব্যর্থ");
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...json.data } : item)));
      toast.success("আপডেট হয়েছে");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "আপডেট ব্যর্থ");
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-sage-red-50/70 text-sage-primary">
              <tr>
                <th className="p-4">রেজিস্ট্রেশন</th>
                <th className="p-4">শিক্ষার্থী</th>
                <th className="p-4">শ্রেণি / স্কুল</th>
                <th className="p-4">বিষয়</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4">নোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-border">
              {items.map((item) => (
                <tr key={item._id} className="align-top hover:bg-sage-red-50/20">
                  <td className="p-4">
                    <p className="text-base font-black text-sage-secondary">{item.assessmentTitle}</p>
                    <p className="mt-1 text-xs font-bold text-sage-primary">{item.assessmentType || (item.assessmentKind === "modelTest" ? "Model Test" : "Exam")}</p>
                    <p className="mt-1 text-xs text-sage-gray-500">{new Date(item.createdAt).toLocaleString("bn-BD")}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-base font-bold text-sage-secondary">{item.name}</p>
                    <p className="mt-1 font-mono text-sm text-sage-gray-700">{item.phone}</p>
                    <div className="mt-3 flex gap-2">
                      <a href={`tel:${item.phone}`} className="grid h-9 w-9 place-items-center rounded-lg bg-sage-red-50 text-sage-primary">
                        <Phone className="h-4 w-4" />
                      </a>
                      <button type="button" onClick={() => window.open(waUrl(item.phone), "_blank")} className="grid h-9 w-9 place-items-center rounded-lg bg-green-600 text-white">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-sage-secondary">{item.classLabel}</p>
                    <p className="mt-1 text-xs text-sage-gray-500">{item.version}</p>
                    <p className="mt-2 text-sm font-semibold text-sage-primary">{item.schoolName || "স্কুল দেওয়া হয়নি"}</p>
                    <p className="mt-1 text-xs text-sage-gray-500">{item.applicantType === "sage" ? "SAGE student" : "Outside student"}</p>
                  </td>
                  <td className="max-w-[240px] p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.selectedSubjects.map((subject) => (
                        <span key={subject} className="rounded-full bg-sage-red-50 px-2 py-1 text-xs font-bold text-sage-secondary ring-1 ring-sage-red-100">{subject}</span>
                      ))}
                    </div>
                    {item.message ? <p className="mt-3 text-xs leading-5 text-sage-gray-500">{item.message}</p> : null}
                  </td>
                  <td className="p-4">
                    <select value={item.status} onChange={(e) => update(item._id, { status: e.target.value })} className="h-10 rounded-xl border border-sage-border px-3 text-sm font-bold outline-none">
                      {assessmentLeadStatusOptions.map((status) => (
                        <option key={status} value={status}>{statusLabels[status] || status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="min-w-[260px] p-4">
                    <textarea
                      rows={3}
                      value={notes[item._id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [item._id]: e.target.value }))}
                      className="w-full rounded-xl border border-sage-border px-3 py-2 text-sm outline-none focus:border-sage-primary"
                    />
                    <button type="button" onClick={() => update(item._id, { adminNote: notes[item._id] ?? "" })} className="mt-2 rounded-xl bg-sage-secondary px-4 py-2 text-xs font-bold text-white">
                      নোট সেভ
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center font-bold text-sage-gray-500">কোনো রেজিস্ট্রেশন পাওয়া যায়নি</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
