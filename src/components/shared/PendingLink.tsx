"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";

type PendingLinkProps = ComponentProps<typeof Link> & {
  pendingLabel?: string;
  children: ReactNode;
};

function PendingLinkContent({
  children,
  pendingLabel,
}: {
  children: ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return <>{children}</>;
  }

  return (
    <>
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{pendingLabel ?? "লোড হচ্ছে..."}</span>
    </>
  );
}

export function PendingLink({ children, pendingLabel, ...props }: PendingLinkProps) {
  return (
    <Link prefetch {...props}>
      <PendingLinkContent pendingLabel={pendingLabel}>{children}</PendingLinkContent>
    </Link>
  );
}
