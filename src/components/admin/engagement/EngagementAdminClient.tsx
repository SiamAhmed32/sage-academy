"use client";

import * as React from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  HelpCircle,
  Link2,
  Mail,
  MousePointerClick,
  Phone,
  UserRound,
} from "lucide-react";

import { engagementEventLabels } from "@/constants/engagement-events";
import type { EngagementAnalytics } from "@/types/engagement-analytics";
import { cn } from "@/lib/utils";
import { formatAdminDateTime, formatAdminNumber } from "@/lib/admin-format";

const EVENT_HELP: Record<
  string,
  { title: string; note: string; icon: React.ComponentType<{ className?: string }> }
> = {
  admission_page_view: {
    title: "Viewed an admission page",
    note: "A visitor opened an admission-related page, the first stage of interest.",
    icon: Eye,
  },
  admission_form_started: {
    title: "Started an admission form",
    note: "A visitor began interacting with an admission form, indicating stronger interest.",
    icon: CheckCircle2,
  },
  cta_click: {
    title: "Clicked a button or link",
    note: "A visitor clicked an admission, sign-in, or other important call to action.",
    icon: MousePointerClick,
  },
};

function formatDayLabel(dateKey: string) {
  const parts = dateKey.split("-").map(Number);
  return `${parts[2]}/${parts[1]}`;
}

function formatDateTime(value: unknown) {
  if (!value) return "Time unavailable";
  return formatAdminDateTime(value as string);
}

function eventHelp(eventType: string) {
  return (
    EVENT_HELP[eventType] ?? {
      title:
        engagementEventLabels[eventType as keyof typeof engagementEventLabels] ??
        eventType,
      note: "An important website action was recorded.",
      icon: Activity,
    }
  );
}

function SummaryCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sage-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-sage-secondary">{value}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-sage-gray-500">{note}</p>
    </div>
  );
}

function TeacherNote() {
  return (
    <div className="rounded-xl border border-sage-red-100 bg-sage-red-50/60 p-4 text-sm leading-7 text-sage-gray-700 sm:p-5">
      <div className="mb-2 flex items-center gap-2 font-bold text-sage-secondary">
        <HelpCircle className="h-4 w-4 text-sage-primary" />
        How to read this page
      </div>
      <p>
        Visitor activity captures small but important website actions, such as viewing an
        admission page, starting a form, or clicking a key button. Email or phone details
        appear only when they are available; otherwise the person is shown as an anonymous visitor.
      </p>
    </div>
  );
}

function EventTypeGuide({ analytics }: { analytics: EngagementAnalytics }) {
  const countMap = new Map(analytics.byType.map((row) => [row.eventType, row.count]));
  const eventTypes = ["admission_page_view", "admission_form_started", "cta_click"];
  const max = Math.max(1, ...eventTypes.map((type) => countMap.get(type) ?? 0));

  return (
    <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-sage-secondary">
            Which actions happen most?
          </h3>
          <p className="mt-1 text-sm leading-6 text-sage-gray-500">
            Use this section to understand where admission interest is concentrated.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {eventTypes.map((type) => {
          const help = eventHelp(type);
          const Icon = help.icon;
          const count = countMap.get(type) ?? 0;
          const width = `${Math.max(6, (count / max) * 100)}%`;

          return (
            <div key={type}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sage-secondary">{help.title}</p>
                    <p className="text-xs leading-5 text-sage-gray-500">{help.note}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-sage-red-50 px-3 py-1 text-sm font-bold text-sage-primary ring-1 ring-sage-red-100">
                  {formatAdminNumber(count)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sage-red-50">
                <div
                  className="h-full rounded-full bg-sage-primary"
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyActivity({ analytics, days }: { analytics: EngagementAnalytics; days: number }) {
  const max = Math.max(1, ...analytics.byDay.map((row) => row.count));
  const hasData = analytics.byDay.some((row) => row.count > 0);

  return (
    <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-sage-secondary">
            How much activity occurred each day?
          </h3>
          <p className="mt-1 text-sm leading-6 text-sage-gray-500">
            This shows which days had the most interest during the last {formatAdminNumber(days)} days.
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="flex h-64 items-end gap-2 overflow-x-auto rounded-xl bg-sage-red-50/40 px-3 pb-4 pt-8 sm:gap-3">
          {analytics.byDay.map((row) => {
            const height = `${Math.max(5, (row.count / max) * 100)}%`;

            return (
              <div
                key={row.dateKey}
                className="flex h-full min-w-9 flex-1 flex-col items-center justify-end gap-2"
                title={`${row.dateKey}: ${formatAdminNumber(row.count)}`}
              >
                <span className="text-xs font-bold text-sage-secondary">
                  {formatAdminNumber(row.count)}
                </span>
                <div className="flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-sage-primary shadow-sm"
                    style={{ height }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-sage-gray-500">
                  {formatDayLabel(row.dateKey)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-sage-border bg-sage-red-50/30 px-4 py-10 text-center text-sm leading-6 text-sage-gray-600">
          No activity yet. Bars will appear after visitors view admission pages, start forms,
          or click important buttons.
        </div>
      )}
    </div>
  );
}

function VisitorIdentity({ row }: { row: Record<string, unknown> }) {
  const email = String(row.contactEmail || "");
  const phone = String(row.contactPhone || "");

  if (!email && !phone) {
    return (
      <div className="flex items-center gap-2 text-sm text-sage-gray-500">
        <UserRound className="h-4 w-4" />
        Anonymous visitor
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm text-sage-gray-600">
      {email && (
        <p className="flex items-center gap-2 break-all">
          <Mail className="h-4 w-4 shrink-0 text-sage-primary" />
          {email}
        </p>
      )}
      {phone && (
        <p className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-sage-primary" />
          {phone}
        </p>
      )}
    </div>
  );
}

function EngagementEventCard({ row }: { row: Record<string, unknown> }) {
  const eventType = String(row.eventType ?? "");
  const help = eventHelp(eventType);
  const Icon = help.icon;
  const label = String(row.label || "");
  const path = String(row.path || "");

  return (
    <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sage-secondary">{help.title}</h4>
            <p className="mt-1 text-sm leading-6 text-sage-gray-500">{help.note}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {path && (
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-sage-red-50 px-3 py-1 text-sage-secondary ring-1 ring-sage-red-100">
                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{path}</span>
                </span>
              )}
              {label && (
                <span className="rounded-full bg-sage-white px-3 py-1 text-sage-gray-700 ring-1 ring-sage-border">
                  {label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-sage-border pt-4 lg:min-w-72 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <VisitorIdentity row={row} />
          <p className="text-sm font-semibold text-sage-gray-500">
            {formatDateTime(row.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function EngagementEventsList({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-sage-border bg-white px-4 py-10 text-center text-sm leading-6 text-sage-gray-600">
        No visitor activity has been recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <EngagementEventCard key={String(row._id ?? i)} row={row} />
      ))}
    </div>
  );
}

type TabKey = "analytics" | "events";

export function EngagementAdminClient({
  analytics,
  days,
}: {
  analytics: EngagementAnalytics;
  days: number;
}) {
  const [tab, setTab] = React.useState<TabKey>("analytics");

  return (
    <div className="space-y-6">
      <TeacherNote />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={`Activity in the last ${formatAdminNumber(days)} days`}
          value={formatAdminNumber(analytics.totalInRange)}
          note="Total admission-page views, form starts, and important button clicks in this period."
          icon={Activity}
        />
        <SummaryCard
          title="All-time activity"
          value={formatAdminNumber(analytics.totalAllTime)}
          note="All important activity recorded since tracking began."
          icon={BarChart3}
        />
        <SummaryCard
          title="Recent activity list"
          value={formatAdminNumber(analytics.recent.length)}
          note="The latest recorded actions are listed below."
          icon={MousePointerClick}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-sage-red-50 p-1 ring-1 ring-sage-red-100">
          <button
            type="button"
            onClick={() => setTab("analytics")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              tab === "analytics"
                ? "bg-white text-sage-primary shadow-sm"
                : "text-sage-gray-600 hover:text-sage-secondary"
            )}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setTab("events")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold transition",
              tab === "events"
                ? "bg-white text-sage-primary shadow-sm"
                : "text-sage-gray-600 hover:text-sage-secondary"
            )}
          >
            Activity log
          </button>
        </div>

        <p className="text-sm leading-6 text-sage-gray-500">
          Report range: last {formatAdminNumber(days)} days
        </p>
      </div>

      {tab === "analytics" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <EventTypeGuide analytics={analytics} />
          <DailyActivity analytics={analytics} days={days} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-sage-border bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-base font-bold text-sage-secondary">
              Recent Visitor Activity
            </h3>
            <p className="mt-1 text-sm leading-6 text-sage-gray-500">
              Newest actions appear first. Email and phone details are shown only when
              the visitor is signed in or the information is otherwise available.
            </p>
          </div>
          <EngagementEventsList rows={analytics.recent as Record<string, unknown>[]} />
        </div>
      )}

      <div className="rounded-xl border border-sage-border bg-white p-4 text-sm leading-7 text-sage-gray-600 shadow-sm sm:p-5">
        <p className="font-bold text-sage-secondary">Note</p>
        <p className="mt-1">
          This is not the complete admission-application or contact-message list. Use
          Admission Requests or Contact Messages for the full records.
        </p>
      </div>
    </div>
  );
}
