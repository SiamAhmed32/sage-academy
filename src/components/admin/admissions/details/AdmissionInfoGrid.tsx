import { User, GraduationCap, Phone, Calendar } from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatDate(value?: Date | string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const genderMap: Record<string, string> = {
  male: "পুরুষ",
  female: "মহিলা",
  other: "অন্যান্য",
};

const versionMap: Record<string, string> = {
  bangla: "বাংলা ভার্সন",
  english: "ইংলিশ ভার্সন",
  other: "অন্যান্য",
};

/* ─── Single Row — label on left, value on right ─────────────────── */

function Row({ label, value }: { label: string; value?: any }) {
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

export function AdmissionInfoGrid({ item }: { item: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">

      {/* ১. শিক্ষার্থীর তথ্য */}
      <InfoCard icon={<User size={15} />} title="শিক্ষার্থীর তথ্য">
        <Row label="ইংরেজি নাম"    value={item.studentName} />
        <Row label="বাংলা নাম"      value={item.nameBangla} />
        <Row label="লিঙ্গ"          value={genderMap[item.studentGender] ?? item.studentGender} />
        <Row label="জন্ম তারিখ"    value={formatDate(item.studentDateOfBirth)} />
        <Row label="হোয়াটসঅ্যাপ"  value={item.studentWhatsapp} />
        <Row label="ইমেইল"          value={item.email} />
      </InfoCard>

      {/* ২. একাডেমিক তথ্য */}
      <InfoCard icon={<GraduationCap size={15} />} title="একাডেমিক তথ্য">
        <Row label="শ্রেণী"          value={item.className} />
        <Row label="ভার্সন"           value={versionMap[item.academicVersion] ?? item.academicVersion} />
        <Row label="সেকশন"           value={item.section} />
        <Row label="রোল নম্বর"       value={item.classRoll} />
        <Row label="স্কুল / কলেজ"    value={item.schoolName} />
        <Row label="আগ্রহী বিষয়"   value={item.interestedSubjects} />
      </InfoCard>

      {/* ৩. অভিভাবকের তথ্য */}
      <InfoCard icon={<Phone size={15} />} title="অভিভাবকের তথ্য">
        <Row label="পিতার নাম"         value={item.fatherName} />
        <Row label="মাতার নাম"          value={item.motherName} />
        <Row label="অভিভাবকের নাম"     value={item.guardianName} />
        <Row label="ফোন নম্বর"         value={item.phone} />
      </InfoCard>

      {/* ৪. তারিখ ও ব্যাচ */}
      <InfoCard icon={<Calendar size={15} />} title="তারিখ ও ব্যাচ">
        <Row label="আবেদনের তারিখ"   value={formatDate(item.createdAt)} />
        <Row label="ভর্তির তারিখ"     value={formatDate(item.admissionDate)} />
        <Row label="পছন্দের ব্যাচ"    value={item.preferredBatch} />
      </InfoCard>

    </div>
  );
}
