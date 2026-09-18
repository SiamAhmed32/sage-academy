import { User, GraduationCap, Phone, Calendar } from "lucide-react";
import { adminGenderLabels, adminVersionLabels } from "@/constants/admin-display";
import { formatAdminDate } from "@/lib/admin-format";
import type { AdmissionRequestItem } from "../types";

/* ─── Single Row — label on left, value on right ─────────────────── */

function Row({ label, value }: { label: string; value?: unknown }) {
  const display = value != null ? String(value).trim() : "";
  if (!display || display === "N/A") return null;

  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 font-medium shrink-0 min-w-[110px]">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-800 text-right leading-snug">
        {display}
      </span>
    </div>
  );
}

/* ─── Card wrapper ───────────────────────────────────────────────── */

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="text-[#8b1a1a]">{icon}</div>
        <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {/* Card Body */}
      <div className="px-4 py-1">
        {children}
      </div>
    </div>
  );
}

/* ─── Main Export ────────────────────────────────────────────────── */

export function AdmissionInfoGrid({ item }: { item: AdmissionRequestItem }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">

      <InfoCard icon={<User size={15} />} title="Student Information">
        <Row label="English name" value={item.studentName} />
        <Row label="Bangla name" value={item.nameBangla} />
        <Row label="Gender" value={adminGenderLabels[item.studentGender] ?? item.studentGender} />
        <Row label="Date of birth" value={item.studentDateOfBirth ? formatAdminDate(item.studentDateOfBirth, "") : ""} />
        <Row label="WhatsApp" value={item.studentWhatsapp} />
        <Row label="Email" value={item.email} />
      </InfoCard>

      <InfoCard icon={<GraduationCap size={15} />} title="Academic Information">
        <Row label="Class" value={item.className} />
        <Row label="Version" value={adminVersionLabels[item.academicVersion] ?? item.academicVersion} />
        <Row label="Section" value={item.section} />
        <Row label="Roll number" value={item.classRoll} />
        <Row label="School / college" value={item.schoolName} />
        <Row label="Subjects of interest" value={item.interestedSubjects} />
      </InfoCard>

      <InfoCard icon={<Phone size={15} />} title="Guardian Information">
        <Row label="Father's name" value={item.fatherName} />
        <Row label="Mother's name" value={item.motherName} />
        <Row label="Guardian's name" value={item.guardianName} />
        <Row label="Phone number" value={item.phone} />
      </InfoCard>

      <InfoCard icon={<Calendar size={15} />} title="Dates and Batch">
        <Row label="Application date" value={formatAdminDate(item.createdAt, "")} />
        <Row label="Admission date" value={item.admissionDate ? formatAdminDate(item.admissionDate, "") : ""} />
        <Row label="Preferred batch" value={item.preferredBatch} />
      </InfoCard>

    </div>
  );
}
