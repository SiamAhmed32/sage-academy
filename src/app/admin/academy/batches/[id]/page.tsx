import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Pencil, UserPlus, UsersRound } from "lucide-react";

import { BatchDrawerButton } from "@/components/admin/academy/BatchDrawer";
import { BatchStatusButton } from "@/components/admin/academy/BatchStatusButton";
import { RoutinePanel } from "@/components/admin/sa/RoutineWeek";
import { Avatar, EmptyState, MiniStat, MiniStats, PageHeading, SeatMeter, StatusChip } from "@/components/admin/sa/ui";
import { BATCH_GENDER_LABELS, VERSION_LABELS, subjectTone } from "@/lib/academy/constants";
import { formatTaka } from "@/lib/academy/codes";
import { loadBatchFormData } from "@/lib/academy/batch-form";
import { getBatchDetail } from "@/lib/academy/queries";

const TABS = [
  { key: "routine", label: "Routine" },
  { key: "students", label: "Students" },
  { key: "subjects", label: "Subjects & teachers" },
] as const;

export default async function BatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const [{ id }, { tab: rawTab, edit }] = await Promise.all([params, searchParams]);
  const [batch, form] = await Promise.all([getBatchDetail(id), loadBatchFormData()]);
  if (!batch) notFound();
  const formClasses = form.classes.some((item) => item.id === batch.classId)
    ? form.classes
    : [...form.classes, { id: batch.classId, name: batch.className, level: batch.classLevel }];
  const tab = TABS.some((item) => item.key === rawTab) ? rawTab : "routine";

  const blocks = batch.routine.map((slot, index) => {
    const subject = batch.subjects.find((item) => item.subjectId === slot.subjectId);
    const name = subject?.name ?? "Subject";
    return {
      key: `${slot.subjectId}-${slot.day}-${slot.start}-${index}`,
      day: slot.day,
      start: slot.start,
      end: slot.end,
      title: name,
      sub: [slot.room ? `Room ${slot.room}` : "", subject?.teacherName ?? ""].filter(Boolean).join(" · "),
      tone: subjectTone(name),
    };
  });
  const monthlyAll = batch.subjects.reduce((sum, subject) => sum + subject.fee, 0);
  const full = batch.students >= batch.capacity;

  return (
    <div>
      <PageHeading
        eyebrow="Batch"
        title={batch.code}
        description={`${batch.className} · ${BATCH_GENDER_LABELS[batch.gender]} · ${VERSION_LABELS[batch.version]} · Batch ${Number(batch.code.slice(-2))}${batch.note ? ` · ${batch.note}` : ""}`}
        back={{ href: "/admin/academy/batches", label: "All batches" }}
        actions={
          <>
            <BatchStatusButton id={batch.id} status={batch.status} />
            <BatchDrawerButton
              className="btn-secondary"
              defaultOpen={edit === "1"}
              data={{ ...form, classes: formClasses, years: [batch.year] }}
              existing={{
                id: batch.id,
                code: batch.code,
                year: batch.year,
                classId: batch.classId,
                gender: batch.gender,
                version: batch.version,
                capacity: batch.capacity,
                note: batch.note,
                students: batch.students,
                subjects: batch.subjects.map((item) => ({ subjectId: item.subjectId, teacherId: item.teacherId })),
                routine: batch.routine,
              }}
            >
              <Pencil size={17} /> Edit batch
            </BatchDrawerButton>
            {batch.status === "active" ? (
              full ? (
                <span className="btn-primary" aria-disabled="true" style={{ opacity: 0.55 }} title="Raise the batch size to enroll more students">
                  <UserPlus size={17} /> Batch full
                </span>
              ) : (
                <Link href={`/admin/academy/admission?batch=${batch.id}`} className="btn-primary">
                  <UserPlus size={17} /> Enroll student
                </Link>
              )
            ) : null}
          </>
        }
      />

      <MiniStats>
        <MiniStat label="Students" value={`${batch.students}/${batch.capacity}`} note={full ? "Full — enrollment blocked" : `${batch.capacity - batch.students} seats left`} />
        <MiniStat label="Subjects" value={batch.subjects.length} note={batch.subjects.map((subject) => subject.name).join(", ") || "None yet"} />
        <MiniStat label="Weekly classes" value={batch.routine.length} note="Saturday to Thursday" />
        <MiniStat label="All subjects, per month" value={formatTaka(monthlyAll)} note={`${VERSION_LABELS[batch.version]} fees`} />
      </MiniStats>

      <section className="panel" style={{ marginBottom: 20 }}>
        <nav className="tabs" aria-label="Batch sections">
          {TABS.map((item) => (
            <Link key={item.key} href={`?tab=${item.key}`} className={tab === item.key ? "active" : ""} scroll={false}>
              {item.label}
              {item.key === "students" ? <small>{batch.students}</small> : null}
            </Link>
          ))}
        </nav>

        {tab === "students" ? (
          batch.roster.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No students yet"
              description="Students appear here once they are admitted into this batch or move a subject here."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Subjects in this batch</th>
                    <th className="num">Monthly (this batch)</th>
                    <th>Type</th>
                    <th className="actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.roster.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <Link href={`/admin/academy/students/${student.id}`} className="person-cell">
                          <Avatar name={student.name} size="sm" />
                          <div>
                            <strong>{student.name}</strong>
                            <span className="cell-sub">{student.phone}</span>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <code>{student.studentId}</code>
                      </td>
                      <td>{student.subjects.join(", ")}</td>
                      <td className="num">
                        <strong>{formatTaka(student.monthly)}</strong>
                      </td>
                      <td>
                        {student.isHome ? <StatusChip tone="success">Home batch</StatusChip> : <StatusChip tone="info">Subject transfer</StatusChip>}
                      </td>
                      <td className="actions">
                        <Link href={`/admin/academy/students/${student.id}`} className="row-action">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "subjects" ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th className="num">Monthly fee</th>
                  <th className="num">Weekly classes</th>
                  <th>Students taking it</th>
                </tr>
              </thead>
              <tbody>
                {batch.subjects.map((subject) => (
                  <tr key={subject.subjectId}>
                    <td>
                      <strong>{subject.name}</strong>
                    </td>
                    <td>{subject.teacherName || <span className="cell-sub">Not set</span>}</td>
                    <td className="num">{formatTaka(subject.fee)}</td>
                    <td className="num">{batch.routine.filter((slot) => slot.subjectId === subject.subjectId).length}</td>
                    <td>
                      <SeatMeter used={batch.subjectStudents[subject.subjectId] ?? 0} capacity={batch.capacity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {tab === "routine" ? (
        <RoutinePanel
          id="batch-routine"
          title={batch.code}
          blocks={blocks}
          exportName={`${batch.code}-routine`}
          emptyText="No class times yet. Use “Set routine” to add them."
          sheetInfo={[
            { label: "Batch", value: batch.code },
            { label: "Class", value: batch.className },
            { label: "Group", value: `${BATCH_GENDER_LABELS[batch.gender]} · ${VERSION_LABELS[batch.version]}` },
            { label: "Subjects", value: batch.subjects.map((subject) => subject.name).join(", ") },
            { label: "Teachers", value: [...new Set(batch.subjects.map((subject) => subject.teacherName).filter(Boolean))].join(", ") },
            { label: "Students", value: `${batch.students} of ${batch.capacity}` },
          ]}
        >
          <Link href={`/admin/academy/batches/${batch.id}/routine`} className="btn-primary">
            <CalendarClock size={17} /> {batch.routine.length ? "Edit routine" : "Set routine"}
          </Link>
        </RoutinePanel>
      ) : null}
    </div>
  );
}
