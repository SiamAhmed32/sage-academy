import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Inbox,
  ListChecks,
  UserPlus,
  UsersRound,
  Wallet,
  AlertTriangle,
  BadgeDollarSign,
} from "lucide-react";

import { ScheduleBoard } from "@/components/admin/sa/ScheduleBoard";
import { Avatar, EmptyState, KpiCard, Panel, PanelLink, StatusChip } from "@/components/admin/sa/ui";
import { WEEK_DAY_LABELS, subjectTone, type WeekDay } from "@/lib/academy/constants";
import { dhakaParts, formatDate, formatTaka, formatTime, monthLabel, timeToMinutes } from "@/lib/academy/codes";
import { ensureMonthlyDues } from "@/lib/academy/dues";
import { allActiveSlots, getDashboardData } from "@/lib/academy/queries";
import { getCurrentAuthUser } from "@/lib/auth-session";
import { connectDB } from "@/lib/mongodb";
import AdmissionRequest from "@/models/AdmissionRequest";
import ContactRequest from "@/models/ContactRequest";
import FreeClassLead from "@/models/FreeClassLead";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function leadCounts() {
  const start = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date())}T00:00:00+06:00`);
  const [admissions, contacts, freeClass, recentRequests] = await Promise.all([
    AdmissionRequest.countDocuments({ createdAt: { $gte: start } }),
    ContactRequest.countDocuments({ createdAt: { $gte: start } }),
    FreeClassLead.countDocuments({ createdAt: { $gte: start } }),
    AdmissionRequest.find({ status: "new", isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("studentName className phone createdAt")
      .lean<{ _id: unknown; studentName?: string; className?: string; phone?: string; createdAt: Date }[]>(),
  ]);
  return { today: admissions + contacts + freeClass, recentRequests };
}

export default async function AdminDashboardPage() {
  await connectDB();
  // Billing scans every active student. It must not block the dashboard; the dues page still runs it fresh.
  void ensureMonthlyDues().catch(() => undefined);
  const [user, data, slots, leads] = await Promise.all([getCurrentAuthUser(), getDashboardData(), allActiveSlots(), leadCounts()]);

  const now = dhakaParts();
  const nowMinutes = (() => {
    const [hours, minutes] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: false })
      .format(new Date())
      .split(":")
      .map(Number);
    return hours * 60 + minutes;
  })();
  const today = now.weekday as WeekDay | "fri";
  const todaySlots = slots
    .filter((slot) => slot.day === today)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start) || a.batchCode.localeCompare(b.batchCode));
  const nextSlot = todaySlots.find((slot) => timeToMinutes(slot.start) > nowMinutes);

  const activeBatches = data.batches;
  const fullBatches = activeBatches.filter((batch) => batch.students >= batch.capacity);
  const nearlyFull = activeBatches.filter((batch) => batch.students < batch.capacity && batch.students / batch.capacity >= 0.85);
  const noRoutine = activeBatches.filter((batch) => batch.routine.length === 0);
  const collectionRate = data.billed ? Math.round((data.paidAgainstMonth / data.billed) * 100) : 0;
  const firstName = (user?.name ?? "there").split(" ")[0];
  const dateLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", weekday: "long" }).format(new Date());

  const attention = [
    ...data.topOwing
      .filter((row) => row.months >= 2)
      .slice(0, 3)
      .map((row) => ({
        key: `owe-${row.id}`,
        color: "#e9873c",
        title: `${row.name} owes ${formatTaka(row.owed)}`,
        sub: `${row.studentId} · ${row.months} unpaid bills`,
        href: `/admin/academy/payments?student=${row.id}`,
        chip: "Collect",
      })),
    ...fullBatches.slice(0, 2).map((batch) => ({
      key: `full-${batch.id}`,
      color: "#e14c5a",
      title: `${batch.code} is full`,
      sub: `${batch.students}/${batch.capacity} seats — admission is blocked`,
      href: `/admin/academy/batches/${batch.id}/routine`,
      chip: "Resize",
    })),
    ...nearlyFull.slice(0, 2).map((batch) => ({
      key: `near-${batch.id}`,
      color: "#e9873c",
      title: `${batch.code} is nearly full`,
      sub: `${batch.capacity - batch.students} seats left`,
      href: `/admin/academy/batches/${batch.id}`,
      chip: "View",
    })),
    ...noRoutine.slice(0, 2).map((batch) => ({
      key: `routine-${batch.id}`,
      color: "#6857d7",
      title: `${batch.code} has no routine`,
      sub: "Add class times so students see their timetable",
      href: `/admin/academy/batches/${batch.id}/routine`,
      chip: "Add",
    })),
  ].slice(0, 6);

  return (
    <div>
      <section className="welcome-row">
        <div>
          <span className="eyebrow">Admin workspace</span>
          <h1>
            {greeting()}, {firstName}.
          </h1>
          <p>Today&apos;s classes, money owed and what needs attention at SAGE Academy.</p>
        </div>
        <div className="date-chip">
          <b>{now.day}</b>
          <span>
            <small>{dateLabel}</small>
            <em>{monthLabel(`${now.year}-${String(now.month).padStart(2, "0")}`)}</em>
          </span>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          label="Active students"
          value={data.activeStudents}
          note={`+${data.newThisMonth} admitted this month`}
          noteTone={data.newThisMonth > 0 ? "good" : "muted"}
          icon={UsersRound}
          tone="blue"
          href="/admin/academy/students"
        />
        <KpiCard
          label={`Collected in ${monthLabel(data.month, true)}`}
          value={formatTaka(data.collectedThisMonth)}
          note={data.billed ? `${collectionRate}% of ${formatTaka(data.billed)} billed` : "No bills yet this month"}
          noteTone={collectionRate >= 70 ? "good" : "warn"}
          icon={Wallet}
          tone="green"
          href="/admin/academy/receipts"
        />
        <KpiCard
          label="Outstanding dues"
          value={formatTaka(data.outstanding)}
          note={`${data.studentsWithDues} student${data.studentsWithDues === 1 ? "" : "s"} owe money`}
          noteTone={data.outstanding > 0 ? "warn" : "good"}
          icon={BadgeDollarSign}
          tone="orange"
          href="/admin/academy/dues"
        />
        <KpiCard
          label="Classes today"
          value={today === "fri" ? "Off" : todaySlots.length}
          note={today === "fri" ? "Friday — no classes" : nextSlot ? `Next at ${formatTime(nextSlot.start)}` : "No more classes today"}
          noteTone="muted"
          icon={CalendarDays}
          tone="purple"
          href="/admin/academy/timetable"
        />
      </section>

      <div className="dashboard-grid">
        <Panel
          className="span-2"
          title={`Today at SAGE · ${today === "fri" ? "Friday" : WEEK_DAY_LABELS[today as WeekDay]}`}
          description="Classes from every batch's routine, in time order."
          action={<PanelLink href="/admin/academy/timetable">Full class routine</PanelLink>}
        >
          {today === "fri" ? (
            <EmptyState icon={CalendarDays} title="Friday is the weekly off day" description="Classes run Saturday to Thursday." />
          ) : (
            <>
              <ScheduleBoard
                nowMinutes={nowMinutes}
                emptyText={slots.length === 0 ? "Add a routine to your batches to see classes here." : "No classes today."}
                classes={todaySlots.map((slot) => ({
                  key: `${slot.batchId}-${slot.id}`,
                  start: slot.start,
                  end: slot.end,
                  subject: slot.subjectName,
                  meta: [slot.batchCode, slot.room ? `R${slot.room}` : ""].filter(Boolean).join(" · "),
                  tone: subjectTone(slot.subjectName),
                  href: `/admin/academy/batches/${slot.batchId}`,
                }))}
              />
              {todaySlots.length > 0 ? (
                <div className="schedule-foot">
                  <span>
                    <i />
                    {todaySlots.filter((slot) => timeToMinutes(slot.end) <= nowMinutes).length} of {todaySlots.length} classes done today
                  </span>
                  <span>
                    {nextSlot ? (
                      <>
                        Next class <b>{nextSlot.subjectName}</b> at <b>{formatTime(nextSlot.start)}</b>
                      </>
                    ) : (
                      "No more classes today"
                    )}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </Panel>

        <Panel title="Quick actions" className="full-md">
          <div className="quick-grid">
            {[
              { href: "/admin/academy/admission", label: "New admission", icon: UserPlus, tone: 1 },
              { href: "/admin/academy/payments", label: "Collect payment", icon: Wallet, tone: 4 },
              { href: "/admin/academy/batches/new", label: "Create batch", icon: ListChecks, tone: 2 },
              { href: "/admin/admissions", label: "Admission requests", icon: Inbox, tone: 3 },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="quick-action">
                <span className={`qa-icon tone-${action.tone}`}>
                  <action.icon size={17} />
                </span>
                {action.label}
                <ArrowUpRight size={15} className="qa-arrow" />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Needs attention" description="Dues, full batches and missing routines.">
          <div className="panel-body" style={{ paddingTop: 0 }}>
            {attention.length === 0 ? (
              <div className="notice success">
                <span>All clear. Nothing needs attention right now.</span>
              </div>
            ) : (
              <div className="list-rows">
                {attention.map((item) => (
                  <Link key={item.key} href={item.href}>
                    <span className="dot" style={{ background: item.color }} />
                    <span className="grow">
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </span>
                    <StatusChip tone="warning">{item.chip}</StatusChip>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Recent payments" action={<PanelLink href="/admin/academy/receipts">All receipts</PanelLink>}>
          <div className="panel-body" style={{ paddingTop: 0 }}>
            {data.recentPayments.length === 0 ? (
              <p className="cell-sub">No payments yet.</p>
            ) : (
              <div className="list-rows">
                {data.recentPayments.map((payment, index) => (
                  <Link key={payment.id} href={`/admin/academy/receipts/${payment.receiptNo}`}>
                    <span className={`money-icon tone-${(index % 4) + 1}`}>{"৳" /* admin-language-allow */}</span>
                    <span className="grow">
                      <b>{payment.name}</b>
                      <small>
                        {payment.receiptNo} · {payment.months.map((value) => monthLabel(value, true)).join(", ")} · {formatDate(payment.paidAt)}
                      </small>
                    </span>
                    <strong style={{ fontSize: 14 }}>{formatTaka(payment.amount)}</strong>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="New admission requests"
          description={`${leads.today} new lead${leads.today === 1 ? "" : "s"} today from the website`}
          action={<PanelLink href="/admin/admissions">Inbox</PanelLink>}
          className="full-md"
        >
          <div className="panel-body" style={{ paddingTop: 0 }}>
            {leads.recentRequests.length === 0 ? (
              <p className="cell-sub">No new requests.</p>
            ) : (
              <div className="list-rows">
                {leads.recentRequests.map((request) => (
                  <Link key={String(request._id)} href={`/admin/academy/admission?request=${String(request._id)}`}>
                    <Avatar name={request.studentName || "?"} size="sm" />
                    <span className="grow">
                      <b>{request.studentName || "Unnamed"}</b>
                      <small>
                        {request.className || "Class not given"} · {request.phone} · {formatDate(request.createdAt)}
                      </small>
                    </span>
                    <StatusChip tone="info">Admit</StatusChip>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {data.activeStudents === 0 && activeBatches.length === 0 ? (
        <div className="notice" style={{ marginTop: 20 }}>
          <AlertTriangle size={16} />
          <span>
            Getting started: add <Link href="/admin/academy/classes" className="text-button">classes</Link>, then{" "}
            <Link href="/admin/academy/subjects" className="text-button">subjects with Bangla and English fees</Link>, then{" "}
            <Link href="/admin/academy/batches/new" className="text-button">create a batch</Link> and admit students.
          </span>
        </div>
      ) : null}
    </div>
  );
}
