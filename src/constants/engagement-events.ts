/** Stored engagement / funnel signals (not substitute for ContactRequest / AdmissionRequest). */

export const ENGAGEMENT_EVENT_TYPES = [
  "admission_page_view",
  "admission_form_started",
  "cta_click",
] as const;

export type EngagementEventType = (typeof ENGAGEMENT_EVENT_TYPES)[number];

export const engagementEventLabels: Record<EngagementEventType, string> = {
  admission_page_view: "ভর্তি পেজ ভিজিট",
  admission_form_started: "ফর্ম শুরু",
  cta_click: "বাটন / লিংক ক্লিক",
};
