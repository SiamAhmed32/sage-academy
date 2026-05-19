"use client";

import { useEffect } from "react";

import { trackEngagementEvent } from "@/lib/engagement-tracker";

/** Fire once per tab session when ভর্তি page mounts */
export function AdmissionPageEngagementTracker() {
  useEffect(() => {
    void trackEngagementEvent({
      eventType: "admission_page_view",
      path: "/admission",
      oncePerSession: "admission_view",
    });
  }, []);

  return null;
}
