import { BookOpen } from "lucide-react";

import { PageHeading, Panel, StatusChip } from "@/components/admin/sa/ui";
import { VERSION_LABELS, subjectTone } from "@/lib/academy/constants";
import { formatDate, formatTaka, initials } from "@/lib/academy/codes";
import { bnMonthLabel } from "@/lib/academy/bn";
import { getPortalStudent } from "@/lib/academy/portal";

export default async function StudentProfilePage() {
  const { detail } = await getPortalStudent();
  if (!detail) return null;
  const { student } = detail;
  const active = detail.subjects.filter((row) => row.status === "active");

  const info: [string, string][] = [
    ["বাংলা নাম", student.nameBangla],
    ["অভিভাবক", `${student.guardianName}${student.guardianRelation ? ` (${student.guardianRelation})` : ""}`],
    ["অভিভাবকের ফোন", student.guardianPhone],
    ["হোয়াটসঅ্যাপ", student.whatsapp],
    ["শিক্ষার্থীর ফোন", student.phone],
    ["স্কুল", student.schoolName],
    ["বাবার নাম", student.fatherName],
    ["মায়ের নাম", student.motherName],
    ["জন্ম তারিখ", formatDate(student.dateOfBirth)],
    ["ঠিকানা", student.address],
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title="প্রোফাইল"
        description="তথ্য পরিবর্তন করতে অফিসে যোগাযোগ করুন।"
      />
      <div className="profile-layout">
        <section className="panel profile-hero">
          <div className="profile-cover" />
          <div className="profile-hero-body">
            <span className="sa-avatar profile-avatar">{initials(student.name)}</span>
            <h2>{student.name}</h2>
            <p>
              {student.className} · {VERSION_LABELS[student.version]}
            </p>
            {student.status === "active" ? <StatusChip tone="success">সক্রিয়</StatusChip> : <StatusChip tone="neutral">সক্রিয় নয়</StatusChip>}
            <div className="profile-meta">
              <span>
                শিক্ষার্থী আইডি <b>{student.studentId}</b>
              </span>
              <span>
                ব্যাচ <b>{student.homeBatchCode}</b>
              </span>
              <span>
                ভর্তির তারিখ <b>{formatDate(student.admissionDate) || "—"}</b>
              </span>
              <span>
                মাসিক বেতন <b>{formatTaka(detail.monthlyTuition)}</b>
              </span>
            </div>
          </div>
        </section>

        <div className="stack">
          <Panel title="ব্যক্তিগত তথ্য">
            <div className="info-grid">
              {info
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
            </div>
          </Panel>
          <Panel title="আমার বিষয়" description={`${active.length}টি চলমান বিষয়`}>
            <div className="course-list">
              {active.map((row) => (
                <div key={row.enrollmentId} className="course-item" style={{ gridTemplateColumns: "40px minmax(0,1fr) auto" }}>
                  <span className={`course-icon tone-${subjectTone(row.name)}`}>
                    <BookOpen size={17} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <b>{row.name}</b>
                    <small>
                      {row.teacherName || "শিক্ষক"} · {row.batchCode} · {bnMonthLabel(row.startMonth)} থেকে
                    </small>
                  </span>
                  <time>{formatTaka(row.monthly)}</time>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
