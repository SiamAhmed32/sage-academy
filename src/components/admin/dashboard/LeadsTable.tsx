import Link from "next/link";
import { ArrowUpRight, Eye, MessageCircle, Phone } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import type { DashboardLead } from "./types";

function whatsappUrl(phone: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

function leadHref(type: DashboardLead["type"]) {
  if (type === "admission") return "/admin/admissions";
  if (type === "free_class") return "/admin/free-class-leads";
  if (type === "assessment") return "/admin/assessment-registrations";
  if (type === "quiz") return "/admin/quiz-leads";
  return "/admin/contacts";
}

function LeadCard({ lead }: { lead: DashboardLead }) {
  return (
    <article className="rounded-xl border border-sage-border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid min-w-0 gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="truncate font-bold text-sage-secondary">
              {lead.name || "নাম পাওয়া যায়নি"}
            </h4>
            <StatusBadge value={lead.status} />
            <span className="rounded-full bg-sage-red-50 px-2 py-0.5 text-[11px] font-bold text-sage-primary">
              {lead.source === "Admission"
                ? "ভর্তি"
                : lead.source === "Free class"
                  ? "ফ্রি ক্লাস"
                  : lead.source === "Assessment"
                    ? "টেস্ট/Exam"
                    : lead.source === "Quiz"
                      ? "কুইজ"
                      : "যোগাযোগ"}
            </span>
          </div>
          <p className="text-sm font-semibold text-sage-primary">
            {lead.phone || "ফোন নেই"}
          </p>
          <p className="text-xs text-sage-gray-500">
            {lead.className ? `${lead.className} · ` : ""}
            {lead.time}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {lead.phone && (
            <>
              <a
                href={`tel:${lead.phone}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
                title="Call"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href={whatsappUrl(lead.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-600 hover:text-white"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </>
          )}
          <Link
            href={leadHref(lead.type)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-red-50 text-sage-gray-600 transition hover:bg-sage-secondary hover:text-white"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function LeadsTable({ leads }: { leads: DashboardLead[] }) {
  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-sage-secondary">
              ফলো-আপ কিউ
            </h3>
            <p className="mt-1 text-sm leading-6 text-sage-gray-500">
              আগে কল করার মতো সাম্প্রতিক লিডগুলো।
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/admissions"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-border bg-white px-3 py-1.5 text-xs font-bold text-sage-secondary transition hover:bg-sage-red-50"
            >
              ভর্তি
            </Link>
            <Link
              href="/admin/free-class-leads"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-border bg-white px-3 py-1.5 text-xs font-bold text-sage-secondary transition hover:bg-sage-red-50"
            >
              ফ্রি ক্লাস
            </Link>
            <Link
              href="/admin/assessment-registrations"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-border bg-white px-3 py-1.5 text-xs font-bold text-sage-secondary transition hover:bg-sage-red-50"
            >
              টেস্ট/Exam
            </Link>
            <Link
              href="/admin/quiz-leads"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sage-secondary"
            >
              কুইজ
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {leads.length ? (
        leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
      ) : (
        <div className="rounded-xl border border-dashed border-sage-border bg-white px-4 py-10 text-center text-sm text-sage-gray-500">
          এখনো কোনো নতুন লিড নেই।
        </div>
      )}
    </section>
  );
}
