"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackEngagementEvent } from "@/lib/engagement-tracker";

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  trackingLabel: string;
};

export function TrackedLink({
  trackingLabel,
  href,
  children,
  ...rest
}: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      href={href}
      onClick={() => {
        void trackEngagementEvent({
          eventType: "cta_click",
          label: trackingLabel,
          path: typeof window !== "undefined" ? window.location.pathname : "",
        });
      }}
    >
      {children}
    </Link>
  );
}
