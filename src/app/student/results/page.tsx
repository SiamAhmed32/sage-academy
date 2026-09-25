import Link from "next/link";
import { FileCheck2, Trophy } from "lucide-react";

import { EmptyState, MiniStat, MiniStats, PageHeading, Panel, StatusChip } from "@/components/admin/sa/ui";
import { formatDate } from "@/lib/academy/codes";
import { getPortalStudent } from "@/lib/academy/portal";
import { getExamResultsForPhone, type StudentExamResultRow } from "@/lib/exam-hub-student";

/** Exam Hub results are stored by phone; check the account and the student's own numbers. */
async function resultsFor(phones: string[]) {
  const seen = new Set<string>();
  const rows: StudentExamResultRow[] = [];
  for (const phone of [...new Set(phones.filter(Boolean))]) {
    for (const row of await getExamResultsForPhone(phone)) {
      if (!seen.has(row.attemptId)) {
        seen.add(row.attemptId);
        rows.push(row);
      }
    }
  }
  return rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export default async function StudentResultsPage() {
  const { ctx, detail } = await getPortalStudent();
  if (!detail) return null;
  const results = await resultsFor([ctx.user.phone ?? "", detail.student.phone, detail.student.whatsapp]);
  const percents = results.map((row) => (row.totalMarks ? Math.round((row.score / row.totalMarks) * 100) : 0));
  const best = percents.length ? Math.max(...percents) : 0;
  const average = percents.length ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length) : 0;

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title="ফলাফল"
        description="Exam Hub অনলাইন পরীক্ষার সব ফলাফল এক জায়গায়।"
        actions={
          <Link href="/exams" className="btn-primary">
            <Trophy size={17} /> নতুন পরীক্ষা দিন
          </Link>
        }
      />
      <MiniStats>
        <MiniStat label="পরীক্ষা" value={results.length} note="জমা দেওয়া" />
        <MiniStat label="সেরা স্কোর" value={`${best}%`} note="সব পরীক্ষার মধ্যে" />
        <MiniStat label="গড়" value={`${average}%`} note="সব পরীক্ষার গড়" />
        <MiniStat label="সর্বশেষ" value={results[0] ? formatDate(results[0].submittedAt) : "—"} note={results[0]?.title ?? "এখনো নেই"} />
      </MiniStats>
      <Panel title="সব ফলাফল" className="data-panel">
        {results.length === 0 ? (
          <EmptyState icon={FileCheck2} title="এখনো কোনো ফলাফল নেই" description="Exam Hub-এ পরীক্ষা দিলে ফলাফল এখানে দেখা যাবে।" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>পরীক্ষা</th>
                  <th>তারিখ</th>
                  <th className="num">নম্বর</th>
                  <th className="num">শতাংশ</th>
                  <th>সময়</th>
                  <th className="actions" />
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={row.attemptId}>
                    <td>
                      <strong>{row.title}</strong>
                    </td>
                    <td>{formatDate(row.submittedAt)}</td>
                    <td className="num">
                      {row.score}/{row.totalMarks}
                    </td>
                    <td className="num">
                      <StatusChip tone={percents[index] >= 80 ? "success" : percents[index] >= 50 ? "info" : "warning"}>{percents[index]}%</StatusChip>
                    </td>
                    <td>
                      {Math.floor(row.durationSeconds / 60)}m {row.durationSeconds % 60}s
                    </td>
                    <td className="actions">
                      <Link href={`/student/results/exam/${row.attemptId}`} className="row-action">
                        দেখুন
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
