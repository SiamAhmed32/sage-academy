import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone, Wallet } from "lucide-react";

import { DownloadPayslipButton } from "@/components/admin/academy/DownloadPayslipButton";
import { DownloadRoutineButton } from "@/components/admin/academy/DownloadRoutineButton";
import { AddSubjectButton, EditStudentButton, StudentStatusButton } from "@/components/admin/academy/StudentWidgets";
import { StudentActivityGrid, StudentDuesGrid, StudentReceiptsGrid, StudentSubjectsGrid } from "@/components/admin/academy/grids/StudentProfileGrids";
import { WeekTimetable } from "@/components/admin/sa/WeekTimetable";
import { Avatar, MiniStat, MiniStats, PageHeading, StatusChip } from "@/components/admin/sa/ui";
import { DUE_KIND_LABELS, VERSION_LABELS, batchGenderForStudent } from "@/lib/academy/constants";
import { currentMonthKey, formatDate, formatTaka, monthLabel } from "@/lib/academy/codes";
import { getStudentDetail, listBatchOptions, slotsToTimetable } from "@/lib/academy/queries";

const TABS = [
  { key: "overview", label: "Subjects & fees" },
  { key: "routine", label: "Routine" },
  { key: "billing", label: "Bills" },
  { key: "receipts", label: "Receipts" },
  { key: "activity", label: "Activity" },
] as const;

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits.startsWith("88") ? digits : `88${digits}`}`;
}

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab: rawTab }] = await Promise.all([params, searchParams]);
  const detail = await getStudentDetail(id);
  if (!detail) notFound();
  const { student } = detail;
  const tab = TABS.some((item) => item.key === rawTab) ? rawTab : "overview";
  const month = currentMonthKey();

  const batches = student.status === "active" ? await listBatchOptions() : [];
  const takenSubjects = new Set(detail.subjects.filter((row) => row.status === "active").map((row) => row.subjectId));
  const inBatches = new Set(detail.subjects.filter((row) => row.status === "active").map((row) => row.batchId));
  const addOptions = batches
    .filter(
      (batch) =>
        batch.classId === student.classId &&
        batch.version === student.version &&
        batch.gender === batchGenderForStudent(student.gender)
    )
    .flatMap((batch) =>
      batch.subjects
        .filter((subject) => !takenSubjects.has(subject.subjectId))
        .map((subject) => ({
          batchId: batch.id,
          batchCode: batch.code,
          subjectId: subject.subjectId,
          name: subject.name,
          fee: subject.fee,
          full: batch.students >= batch.capacity && !inBatches.has(batch.id),
        }))
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.batchCode.localeCompare(b.batchCode));

  const activeSubjects = detail.subjects.filter((row) => row.status === "active");
  const wa = waLink(student.whatsapp || student.guardianPhone);
  // Grids reload when this changes (every action logs activity or moves a total).
  const version = [detail.activity[0]?.id ?? "", detail.activity.length, detail.outstanding, detail.monthlyTuition, detail.payments.length, detail.dues.length].join(":");

  return (
    <div>
      <PageHeading
        eyebrow="Student profile"
        title={student.name}
        description={`${student.studentId} · ${student.className} · ${VERSION_LABELS[student.version]} · Home batch ${student.homeBatchCode}`}
        back={{ href: "/admin/academy/students", label: "All students" }}
        actions={
          <>
            <StudentStatusButton id={student.id} status={student.status} />
            <EditStudentButton
              id={student.id}
              initial={{
                name: student.name,
                nameBangla: student.nameBangla,
                gender: student.gender,
                phone: student.phone,
                whatsapp: student.whatsapp,
                guardianName: student.guardianName,
                guardianRelation: student.guardianRelation,
                guardianPhone: student.guardianPhone,
                fatherName: student.fatherName,
                motherName: student.motherName,
                schoolName: student.schoolName,
                dateOfBirth: student.dateOfBirth.slice(0, 10),
                address: student.address,
                admissionDate: student.admissionDate.slice(0, 10),
                note: student.note,
              }}
            />
            <DownloadRoutineButton
              slots={slotsToTimetable(detail.routine)}
              fileName={`${student.studentId}-routine`}
              info={[
                { label: "Name", value: student.name },
                { label: "Student ID", value: student.studentId },
                { label: "Class", value: student.className },
                { label: "Version", value: VERSION_LABELS[student.version] },
                { label: "Home batch", value: student.homeBatchCode },
                { label: "Guardian phone", value: student.guardianPhone },
              ]}
            />
            <Link href={`/admin/academy/payments?student=${student.id}`} className="btn-primary">
              <Wallet size={17} /> Collect payment
            </Link>
          </>
        }
      />

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="profile-card">
          <Avatar name={student.name} size="lg" />
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <h2>
              {student.name}
              {student.nameBangla ? <span style={{ fontWeight: 500, color: "var(--muted)", fontSize: 16 }}> · {student.nameBangla}</span> : null}
            </h2>
            <div className="profile-meta">
              <code>{student.studentId}</code>
              <code>{student.homeBatchCode}</code>
              {student.status === "active" ? <StatusChip tone="success">Active</StatusChip> : <StatusChip tone="neutral">Left</StatusChip>}
              {detail.outstanding > 0 ? <StatusChip tone="warning">{formatTaka(detail.outstanding)} due</StatusChip> : <StatusChip tone="success">No dues</StatusChip>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`tel:${student.guardianPhone}`} className="icon-button" title={`Call ${student.guardianPhone}`} aria-label="Call guardian">
              <Phone size={18} />
            </a>
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer" className="icon-button" title="WhatsApp guardian" aria-label="WhatsApp guardian">
                <MessageCircle size={18} />
              </a>
            ) : null}
          </div>
        </div>
        <div className="info-grid">
          <div>
            <span>Guardian</span>
            <strong>
              {student.guardianName}
              {student.guardianRelation ? ` (${student.guardianRelation})` : ""}
            </strong>
          </div>
          <div>
            <span>Guardian phone</span>
            <strong>{student.guardianPhone}</strong>
          </div>
          <div>
            <span>WhatsApp</span>
            <strong>{student.whatsapp || "—"}</strong>
          </div>
          <div>
            <span>School</span>
            <strong>{student.schoolName || "—"}</strong>
          </div>
          <div>
            <span>Admitted</span>
            <strong>{formatDate(student.admissionDate) || "—"}</strong>
          </div>
          <div>
            <span>Gender</span>
            <strong>{student.gender === "female" ? "Female" : "Male"}</strong>
          </div>
          {student.fatherName ? (
            <div>
              <span>Father</span>
              <strong>{student.fatherName}</strong>
            </div>
          ) : null}
          {student.motherName ? (
            <div>
              <span>Mother</span>
              <strong>{student.motherName}</strong>
            </div>
          ) : null}
          {student.address ? (
            <div>
              <span>Address</span>
              <strong>{student.address}</strong>
            </div>
          ) : null}
          {student.note ? (
            <div>
              <span>Note</span>
              <strong>{student.note}</strong>
            </div>
          ) : null}
        </div>
      </section>

      <MiniStats>
        <MiniStat label="Monthly tuition" value={formatTaka(detail.monthlyTuition)} note={`${activeSubjects.length} subjects`} />
        <MiniStat label="Due now" value={formatTaka(detail.outstanding)} note={`Up to ${monthLabel(month)}`} />
        <MiniStat
          label="Paid in advance"
          value={formatTaka(detail.dues.filter((due) => due.month > month && due.status !== "void").reduce((sum, due) => sum + due.paid, 0))}
          note="For future months"
        />
        <MiniStat label="Paid this year" value={formatTaka(detail.paidThisYear)} note={`${detail.payments.filter((payment) => payment.status === "valid").length} receipts`} />
      </MiniStats>

      <section className="panel" style={{ marginBottom: 20 }}>
        <nav className="tabs" aria-label="Profile sections">
          {TABS.map((item) => (
            <Link key={item.key} href={`?tab=${item.key}`} className={tab === item.key ? "active" : ""} scroll={false}>
              {item.label}
            </Link>
          ))}
        </nav>

        {tab === "overview" ? (
          <div className="profile-tab-body">
            <div className="profile-tab-head">
              <div>
                <h2>Subjects</h2>
                <p>Fees follow the {VERSION_LABELS[student.version].toLowerCase()} fee of each subject. Discounts are per subject.</p>
              </div>
              {student.status === "active" ? <AddSubjectButton studentId={student.id} options={addOptions} /> : null}
            </div>
            <StudentSubjectsGrid studentId={student.id} version={version} active={student.status === "active"} />
          </div>
        ) : null}

        {tab === "billing" ? (
          <div className="profile-tab-body">
            <div className="profile-tab-head">
              <div>
                <h2>Bills</h2>
                <p>Tuition is billed on the 1st of every month. Partial payments carry over.</p>
              </div>
              <DownloadPayslipButton
                fileName={`${student.studentId}-payslip`}
                info={[
                  { label: "Name", value: student.name },
                  { label: "Student ID", value: student.studentId },
                  { label: "Class", value: student.className },
                  { label: "Version", value: VERSION_LABELS[student.version] },
                  { label: "Home batch", value: student.homeBatchCode },
                  { label: "Guardian phone", value: student.guardianPhone },
                ]}
                bills={detail.dues
                  .filter((due) => (due.status === "unpaid" || due.status === "partial") && due.month <= month)
                  .sort((a, b) => a.month.localeCompare(b.month))
                  .map((due) => ({
                    id: due.id,
                    month: due.month,
                    label: due.label || DUE_KIND_LABELS[due.kind],
                    details: [
                      ...due.lines.map((line) => `${line.subjectName} ${formatTaka(line.amount)}`),
                      ...(due.adjustment ? [`Adjustment ${due.adjustment > 0 ? "+" : "−"}${formatTaka(Math.abs(due.adjustment))}`] : []),
                    ].join(" · "),
                    amount: due.amount,
                    paid: due.paid,
                  }))}
              />
            </div>
            <StudentDuesGrid
              studentId={student.id}
              version={version}
              months={detail.dues.map((due) => due.month)}
              counts={{
                all: detail.dues.length,
                open: detail.dues.filter((due) => due.status === "unpaid" || due.status === "partial").length,
                owed: detail.outstanding,
              }}
            />
          </div>
        ) : null}

        {tab === "receipts" ? (
          <div className="profile-tab-body">
            <div className="profile-tab-head">
              <div>
                <h2>Receipts</h2>
                <p>Every payment from this student. Receipts are never edited — a mistake is voided and reissued.</p>
              </div>
            </div>
            <StudentReceiptsGrid studentId={student.id} version={version} />
          </div>
        ) : null}

        {tab === "activity" ? (
          <div className="profile-tab-body">
            <StudentActivityGrid studentId={student.id} version={version} />
          </div>
        ) : null}

        {tab === "routine" ? (
          <WeekTimetable
            slots={slotsToTimetable(detail.routine)}
            exportName={`${student.studentId}-routine`}
            emptyText="No classes yet. The routine comes from the student's subjects and their batches."
            id="student-routine"
            embedded
          />
        ) : null}

      </section>

    </div>
  );
}
