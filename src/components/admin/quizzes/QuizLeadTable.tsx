"use client";

import { MessageCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { updateQuizSubmissionAction } from "@/app/admin/actions";
import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";
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
  answers: any[];
};

export function QuizLeadTable({ initialLeads }: { initialLeads: QuizLead[] }) {
  const [leads, setLeads] = useState(initialLeads);

  const handleSendWhatsApp = (lead: QuizLead) => {
    const message = `আসসালামু আলাইকুম ${lead.name}! 
SAGE Academy-র কুইজে অংশগ্রহণের জন্য ধন্যবাদ। 
আপনার কুইজ স্কোর: ${lead.score}/${lead.totalQuestions}। 

সঠিক উত্তর এবং ব্যাখ্যাগুলো নিচে দেয়া হলো:
${lead.answers.map((a, i) => `\nQ${i+1}: ${a.question?.questionText}\nসঠিক উত্তর ও ব্যাখ্যা: ${a.question?.explanation || 'সঠিক উত্তর দেয়া হয়েছে।'}`).join('\n')}

আপনার একাডেমিক প্রস্তুতির জন্য কোনো সহযোগিতার প্রয়োজন হলে আমাদের জানান। ধন্যবাদ!`;

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

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-sage-border bg-white p-20 text-center">
        <p className="text-lg font-bold text-sage-secondary">কোনো লিড পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sage-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sage-red-50/50 text-[10px] font-black uppercase tracking-widest text-sage-primary">
              <th className="px-6 py-4">শিক্ষার্থী</th>
              <th className="px-6 py-4">ফোন ও শ্রেণী</th>
              <th className="px-6 py-4 text-center">স্কোর</th>
              <th className="px-6 py-4 text-center">হোয়াটসঅ্যাপ?</th>
              <th className="px-6 py-4 text-center">স্ট্যাটাস</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border/50">
            {leads.map((l) => (
              <tr key={l._id} className="group hover:bg-sage-red-50/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-sage-secondary">{l.name}</p>
                  <p className="text-[10px] text-sage-gray-400">{new Date(l.createdAt).toLocaleDateString("en-GB")}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-sage-secondary">{l.phone}</p>
                  <span className="text-[10px] font-bold text-sage-primary">{getClassLabel(l.classLevel)}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <p className="text-base font-black text-sage-secondary">{toBanglaDigits(l.score)}/{toBanglaDigits(l.totalQuestions)}</p>
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
                    <option value="new">নতুন</option>
                    <option value="contacted">যোগাযোগ হয়েছে</option>
                    <option value="invalid">ভুল নম্বর</option>
                    <option value="qualified">ভর্তি হয়েছে</option>
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
  );
}
