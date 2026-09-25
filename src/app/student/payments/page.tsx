import Link from "next/link";
import { PhoneCall, Receipt } from "lucide-react";

import { EmptyState, MiniStat, MiniStats, PageHeading, Panel, StatusChip, dueTone } from "@/components/admin/sa/ui";
import { ACADEMY_CONTACT, subjectTone } from "@/lib/academy/constants";
import { currentMonthKey, dhakaParts, formatDate, formatTaka } from "@/lib/academy/codes";
import { BN_DUE_KIND, BN_METHOD, bnMonthLabel } from "@/lib/academy/bn";
import { getPortalStudent } from "@/lib/academy/portal";

const BN_DUE_STATUS: Record<string, string> = { paid: "পরিশোধিত", partial: "আংশিক", unpaid: "বাকি", void: "বাতিল" };

export default async function StudentPaymentsPage() {
  const { detail } = await getPortalStudent();
  if (!detail) return null;
  const month = currentMonthKey();
  const { year } = dhakaParts();

  const valid = detail.payments.filter((payment) => payment.status === "valid");
  const lastPayment = valid[0];
  const paidThrough = detail.dues
    .filter((due) => due.kind === "tuition" && due.status === "paid")
    .map((due) => due.month)
    .sort()
    .at(-1);
  const yearDues = detail.dues.filter((due) => due.status !== "void" && due.month.startsWith(String(year)) && due.month <= month);
  const billed = yearDues.reduce((sum, due) => sum + due.amount, 0);
  const paid = yearDues.reduce((sum, due) => sum + due.paid, 0);
  const ratio = billed > 0 ? Math.round((paid / billed) * 100) : 100;
  const bills = detail.dues.filter((due) => due.status !== "void");

  return (
    <div>
      <PageHeading
        eyebrow="Student workspace"
        title="ফি ও রসিদ"
        description="মাসিক বেতন, বকেয়া এবং প্রতিটি পেমেন্টের রসিদ। রসিদ খুলে প্রিন্ট বা PDF ডাউনলোড করুন।"
        actions={
          <a href={`tel:${ACADEMY_CONTACT.phones[1]}`} className="btn-primary">
            <PhoneCall size={17} /> ফি দিতে অফিসে যোগাযোগ
          </a>
        }
      />
      <MiniStats>
        <MiniStat label="বকেয়া" value={formatTaka(detail.outstanding)} note={detail.outstanding > 0 ? "এ মাস পর্যন্ত" : "কোনো বকেয়া নেই"} />
        <MiniStat label="সর্বশেষ পেমেন্ট" value={lastPayment ? formatTaka(lastPayment.amount) : "—"} note={lastPayment ? formatDate(lastPayment.paidAt) : "এখনো নেই"} />
        <MiniStat label="যে মাস পর্যন্ত পরিশোধিত" value={paidThrough ? bnMonthLabel(paidThrough) : "—"} note="মাসিক বেতন" />
        <MiniStat label="রসিদ" value={valid.length} note="ডাউনলোড করা যায়" />
      </MiniStats>

      <div className="two-panels">
        <div className="stack">
          <Panel title="পেমেন্ট ইতিহাস" description="প্রতিটি রসিদ খুলে প্রিন্ট করতে পারবেন।">
            {detail.payments.length === 0 ? (
              <EmptyState icon={Receipt} title="এখনো কোনো পেমেন্ট নেই" />
            ) : (
              <div className="transaction-list">
                {detail.payments.map((payment, index) => (
                  <Link key={payment.id} href={`/student/payments/${payment.receiptNo}`}>
                    <span className={`money-icon tone-${(index % 4) + 1}`}>{"৳"}</span>
                    <span className="grow">
                      <b>{payment.months.map((value) => bnMonthLabel(value)).join(", ")}</b>
                      <small>
                        রসিদ {payment.receiptNo} · {BN_METHOD[payment.method] ?? payment.method} · {formatDate(payment.paidAt)}
                      </small>
                    </span>
                    <strong style={payment.status === "void" ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>
                      {formatTaka(payment.amount)}
                    </strong>
                    {payment.status === "void" ? <StatusChip tone="danger">বাতিল</StatusChip> : <StatusChip tone="success">পরিশোধিত</StatusChip>}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="সব বিল" description="প্রতি মাসের ১ তারিখে মাসিক বেতনের বিল তৈরি হয়। আংশিক পরিশোধের বাকি অংশ পরের মাসে যোগ হয়।">
            {bills.length === 0 ? (
              <EmptyState icon={Receipt} title="কোনো বিল নেই" />
            ) : (
              <div className="table-wrap">
                <table className="data-table" style={{ minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th>মাস</th>
                      <th>বিল</th>
                      <th className="num">মোট</th>
                      <th className="num">পরিশোধ</th>
                      <th className="num">বাকি</th>
                      <th>অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((due) => (
                      <tr key={due.id}>
                        <td>
                          <strong>{bnMonthLabel(due.month)}</strong>
                          {due.month > month ? <span className="cell-sub">অগ্রিম</span> : null}
                        </td>
                        <td>
                          {BN_DUE_KIND[due.kind] ?? due.label}
                          {due.lines.length > 0 ? (
                            <span className="cell-sub">{due.lines.map((line) => line.subjectName).join(", ")}</span>
                          ) : null}
                        </td>
                        <td className="num">{formatTaka(due.amount)}</td>
                        <td className="num">{formatTaka(due.paid)}</td>
                        <td className="num">
                          <strong>{formatTaka(Math.max(0, due.amount - due.paid))}</strong>
                        </td>
                        <td>
                          <StatusChip tone={dueTone(due.status)}>{BN_DUE_STATUS[due.status] ?? due.status}</StatusChip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <Panel title="ফি অ্যাকাউন্ট" description={`${detail.student.studentId} · ${detail.student.homeBatchCode}`}>
          <div className="payroll-progress">
            <div>
              <span>{year} সালের ফি</span>
              <span>{ratio}%</span>
            </div>
            <progress value={ratio} max={100} />
            <small>
              {formatTaka(paid)} পরিশোধিত, মোট {formatTaka(billed)}
            </small>
          </div>
          <div className="payment-methods">
            {detail.subjects
              .filter((row) => row.status === "active")
              .map((row) => (
                <div key={row.enrollmentId}>
                  <b>
                    <span className={`dot tone-${subjectTone(row.name)}`} style={{ display: "inline-block", marginRight: 6 }} />
                    {row.name}
                  </b>
                  <small>{formatTaka(row.monthly)} / মাস</small>
                  {row.discount > 0 ? <small>ছাড় {formatTaka(row.discount)}</small> : null}
                </div>
              ))}
          </div>
          <div className="panel-body" style={{ paddingTop: 0 }}>
            <div className="summary-list">
              <div>
                <span>মাসিক মোট</span>
                <span>{formatTaka(detail.monthlyTuition)}</span>
              </div>
              <div className="total">
                <span>এখন বকেয়া</span>
                <span>{formatTaka(detail.outstanding)}</span>
              </div>
            </div>
            <div className="notice" style={{ marginTop: 14 }}>
              <span>
                ফি জমা দিতে অফিসে আসুন বা {ACADEMY_CONTACT.phones.join(", ")} নম্বরে যোগাযোগ করুন। পেমেন্টের পর রসিদ এখানে দেখা যাবে।
              </span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
