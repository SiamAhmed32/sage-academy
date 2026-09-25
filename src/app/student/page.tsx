import Link from "next/link";
import {
  BadgeDollarSign,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Receipt,
  Wallet,
} from "lucide-react";

import { ScheduleBoard } from "@/components/admin/sa/ScheduleBoard";
import { KpiCard, Panel, PanelLink, StatusChip } from "@/components/admin/sa/ui";
import { Avatar } from "@/components/admin/sa/ui";
import { WEEK_DAYS, subjectTone, type WeekDay } from "@/lib/academy/constants";
import { currentMonthKey, dhakaNowMinutes, dhakaParts, formatDate, formatTaka, formatTimeRange, timeToMinutes } from "@/lib/academy/codes";
import { BN_DAYS, BN_DAYS_SHORT, BN_MONTHS, bnMonthLabel } from "@/lib/academy/bn";
import { getPortalNotices, getPortalStudent } from "@/lib/academy/portal";

type Slot = { id: string; day: WeekDay; start: string; end: string; room: string; subjectName: string; batchCode: string; teacherName: string; batchId: string };

/** Next classes from now, walking forward through the SAGE week (Sat–Thu). */
function upcomingClasses(slots: Slot[], today: string, nowMinutes: number, count: number) {
  const order: string[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
  const start = order.indexOf(today);
  const result: (Slot & { offset: number })[] = [];
  for (let offset = 0; offset < 7 && result.length < count; offset += 1) {
    const day = order[(start + offset) % 7];
    const daySlots = slots
      .filter((slot) => slot.day === day && (offset > 0 || timeToMinutes(slot.end) > nowMinutes))
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    for (const slot of daySlots) {
      if (result.length < count) result.push({ ...slot, offset });
    }
  }
  return result;
}

export default async function StudentDashboardPage() {
  const { detail } = await getPortalStudent();
  if (!detail) return null;
  const { student } = detail;

  const now = dhakaParts();
  const nowMinutes = dhakaNowMinutes();
  const today = now.weekday as WeekDay | "fri";
  const month = currentMonthKey();
  const slots = detail.routine as Slot[];
  const boardDay: WeekDay = today === "fri" ? "sat" : today;
  const boardSlots = slots.filter((slot) => slot.day === boardDay);
  const todayCount = today === "fri" ? 0 : boardSlots.length;
  const upcoming = upcomingClasses(slots, today, nowMinutes, 3);
  const notices = await getPortalNotices(detail, 3);
  const activeSubjects = detail.subjects.filter((row) => row.status === "active");
  const lastPayment = detail.payments.find((payment) => payment.status === "valid");
  const thisMonthDue = detail.dues.find((due) => due.month === month && due.kind === "tuition");
  const yearBilled = detail.dues
    .filter((due) => due.status !== "void" && due.month.startsWith(String(now.year)) && due.month <= month)
    .reduce((sum, due) => sum + due.amount, 0);
  const yearPaid = detail.dues
    .filter((due) => due.status !== "void" && due.month.startsWith(String(now.year)) && due.month <= month)
    .reduce((sum, due) => sum + due.paid, 0);
  const paidRatio = yearBilled > 0 ? Math.round((yearPaid / yearBilled) * 100) : 100;
  const classDays = new Set(slots.map((slot) => slot.day));
  const todayIndex = WEEK_DAYS.indexOf(today as WeekDay);

  return (
    <div>
      <section className="welcome-row">
        <div>
          <span className="eyebrow">My learning</span>
          <h1>স্বাগতম, {student.name.split(" ")[0]}!</h1>
          <p>
            {student.className} · {student.homeBatchCode} · {student.studentId}
          </p>
        </div>
        <div className="date-chip">
          <b>{now.day}</b>
          <span>
            <small>{BN_DAYS[today]}</small>
            <em>
              {BN_MONTHS[now.month - 1]} {now.year}
            </em>
          </span>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          label="আজকের ক্লাস"
          value={today === "fri" ? "ছুটি" : todayCount}
          note={upcoming[0] ? `পরের ক্লাস: ${upcoming[0].subjectName}` : "এই সপ্তাহে আর ক্লাস নেই"}
          noteTone="muted"
          icon={CalendarDays}
          tone="purple"
          href="/student/routine"
        />
        <KpiCard
          label="বকেয়া"
          value={formatTaka(detail.outstanding)}
          note={detail.outstanding > 0 ? "অফিসে পরিশোধ করুন" : "কোনো বকেয়া নেই"}
          noteTone={detail.outstanding > 0 ? "warn" : "good"}
          icon={BadgeDollarSign}
          tone="orange"
          href="/student/payments"
        />
        <KpiCard
          label="মাসিক বেতন"
          value={formatTaka(detail.monthlyTuition)}
          note={thisMonthDue ? `${bnMonthLabel(month)}: ${thisMonthDue.status === "paid" ? "পরিশোধিত" : "বাকি"}` : `${activeSubjects.length}টি বিষয়`}
          noteTone={thisMonthDue && thisMonthDue.status !== "paid" ? "warn" : "good"}
          icon={Wallet}
          tone="green"
          href="/student/payments"
        />
        <KpiCard
          label="নোটিশ"
          value={notices.length}
          note={notices[0] ? notices[0].title : "নতুন নোটিশ নেই"}
          noteTone="muted"
          icon={BellRing}
          tone="blue"
          href="/student/notices"
        />
      </section>

      <div className="dashboard-grid">
        <Panel
          className="span-2"
          title={today === "fri" ? `আজ ছুটি · ${BN_DAYS.sat}ের ক্লাস` : "আমার আজকের রুটিন"}
          description={today === "fri" ? "শুক্রবার ক্লাস নেই। আগামীকালের ক্লাসগুলো দেখুন।" : "আজকের সব ক্লাস, সময় অনুযায়ী।"}
          action={<span className="today-chip">{BN_DAYS[boardDay]}</span>}
        >
          <ScheduleBoard
            nowMinutes={today === "fri" ? -1 : nowMinutes}
            emptyText="এই দিনে কোনো ক্লাস নেই।"
            classes={boardSlots.map((slot) => ({
              key: slot.id + slot.batchCode,
              start: slot.start,
              end: slot.end,
              subject: slot.subjectName,
              meta: [slot.room ? `রুম ${slot.room}` : "", slot.teacherName].filter(Boolean).join(" · "),
              tone: subjectTone(slot.subjectName),
            }))}
          />
          <div className="schedule-foot">
            <span>
              <i />
              সপ্তাহে {slots.length}টি ক্লাস · {classDays.size} দিন
            </span>
            <span>
              {upcoming[0] ? (
                <>
                  পরের ক্লাস <b>{upcoming[0].subjectName}</b>, {upcoming[0].offset === 0 ? "আজ" : BN_DAYS[upcoming[0].day]}{" "}
                  <b>{formatTimeRange(upcoming[0].start, upcoming[0].end)}</b>
                </>
              ) : (
                "রুটিন এখনো দেওয়া হয়নি"
              )}
            </span>
          </div>
        </Panel>

        <Panel title="সামনের ক্লাস" action={<PanelLink href="/student/routine">সব দেখুন</PanelLink>} className="full-md">
          <div className="upcoming-list">
            {upcoming.length === 0 ? <p className="cell-sub">কোনো ক্লাস নির্ধারিত নেই।</p> : null}
            {upcoming.map((slot, index) =>
              index === 0 ? (
                <div key={slot.id + slot.batchCode} className="upcoming-card live">
                  <div className="upcoming-main">
                    <span className="upcoming-icon live">
                      <BookOpen size={17} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <b>{slot.subjectName}</b>
                      <small>
                        <Clock3 size={12} /> {formatTimeRange(slot.start, slot.end)}
                      </small>
                    </span>
                    <span className="upcoming-when">{slot.offset === 0 ? "আজ" : BN_DAYS[slot.day]}</span>
                  </div>
                  <Link href="/student/routine" className="connect-class">
                    {slot.room ? `রুম ${slot.room}` : "রুম"} · {slot.teacherName || slot.batchCode}
                    <ChevronRight size={15} />
                  </Link>
                </div>
              ) : (
                <div key={slot.id + slot.batchCode} className="upcoming-card">
                  <span className="upcoming-icon">
                    <BookOpen size={16} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <b>{slot.subjectName}</b>
                    <small>
                      <Clock3 size={12} /> {formatTimeRange(slot.start, slot.end)}
                    </small>
                  </span>
                  <span className="upcoming-when">{slot.offset === 0 ? "আজ" : BN_DAYS[slot.day]}</span>
                </div>
              )
            )}
          </div>
        </Panel>

        <Panel title="আমার বিষয়" action={<PanelLink href="/student/profile">বিস্তারিত</PanelLink>}>
          <div className="course-list">
            {activeSubjects.length === 0 ? <p className="cell-sub">কোনো বিষয় নেই।</p> : null}
            {activeSubjects.map((row) => (
              <Link key={row.enrollmentId} href="/student/routine" className="course-item">
                <span className={`course-icon tone-${subjectTone(row.name)}`}>
                  <BookOpen size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <b>{row.name}</b>
                  <small>
                    {row.teacherName || "শিক্ষক"} · {row.batchCode}
                  </small>
                </span>
                <time>{formatTaka(row.monthly)}</time>
                <i className="play-button">
                  <ChevronRight size={14} />
                </i>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="নোটিশ বোর্ড" action={<PanelLink href="/student/notices">সব নোটিশ</PanelLink>}>
          <div className="panel-body" style={{ paddingTop: 0 }}>
            {notices.length === 0 ? (
              <p className="cell-sub">এখনো কোনো নোটিশ নেই।</p>
            ) : (
              <div className="list-rows">
                {notices.map((notice) => (
                  <Link key={notice.id} href="/student/notices">
                    <span className="dot" style={{ background: notice.type === "exam" ? "#e9873c" : notice.type === "payment" ? "#e14c5a" : "#6857d7" }} />
                    <span className="grow">
                      <b>{notice.title}</b>
                      <small>
                        {formatDate(notice.publishedAt)}
                        {notice.target ? ` · ${notice.target}` : ""}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="প্রোফাইল" className="full-md" action={<PanelLink href="/student/profile">দেখুন</PanelLink>}>
          <div className="student-profile">
            <div className="student-profile-top">
              <span className="avatar-ring" style={{ ["--ring" as string]: `${paidRatio}%` }} title={`এ বছর ${paidRatio}% ফি পরিশোধিত`}>
                <Avatar name={student.name} />
              </span>
              <span style={{ minWidth: 0 }}>
                <b>{student.name}</b>
                <small>{student.schoolName || student.className}</small>
              </span>
              <span className="rank-badge">{student.studentId}</span>
            </div>
            <div className="streak-card">
              <strong>
                <em>{classDays.size}</em>দিন ক্লাস এই সপ্তাহে
              </strong>
              <div className="streak-days">
                {WEEK_DAYS.map((day, index) => {
                  const has = classDays.has(day);
                  const state = !has ? "off" : today !== "fri" && index === todayIndex ? "today" : today === "fri" || index < todayIndex ? "done" : "next";
                  return (
                    <span key={day} className={state}>
                      <b>{BN_DAYS_SHORT[day]}</b>
                      <i>{state === "done" ? "✓" : ""}</i>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="achievement-list">
              <Link href="/student/payments" className="achievement-item">
                <span className={detail.outstanding > 0 ? "tone-3" : "tone-4"}>
                  <Wallet size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <b>{detail.outstanding > 0 ? "বকেয়া আছে" : "সব ফি পরিশোধিত"}</b>
                  <small>{paidRatio}% এ বছরের ফি পরিশোধিত</small>
                </span>
                <em>{formatTaka(detail.outstanding)}</em>
              </Link>
              {lastPayment ? (
                <Link href={`/student/payments/${lastPayment.receiptNo}`} className="achievement-item">
                  <span className="tone-2">
                    <Receipt size={17} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <b>সর্বশেষ রসিদ {lastPayment.receiptNo}</b>
                    <small>{formatDate(lastPayment.paidAt)}</small>
                  </span>
                  <em>{formatTaka(lastPayment.amount)}</em>
                </Link>
              ) : null}
            </div>
            {student.status !== "active" ? (
              <div style={{ marginTop: 12 }}>
                <StatusChip tone="neutral">শিক্ষার্থী সক্রিয় নয়</StatusChip>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
