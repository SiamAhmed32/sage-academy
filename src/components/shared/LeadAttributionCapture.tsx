"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { captureLeadAttribution } from "@/lib/lead-attribution";

function LeadAttributionCaptureInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureLeadAttribution(pathname, searchParams);
  }, [pathname, searchParams]);

  return null;
}

/** Mount once in root layout (inside Suspense for useSearchParams). */
export function LeadAttributionCapture() {
  return (
    <Suspense fallback={null}>
      <LeadAttributionCaptureInner />
    </Suspense>
  );
}
