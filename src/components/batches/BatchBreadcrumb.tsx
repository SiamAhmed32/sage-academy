import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Container } from "@/components/shared/Container";

type BatchBreadcrumbProps = {
  title: string;
};

export function BatchBreadcrumb({ title }: BatchBreadcrumbProps) {
  return (
    <div className="border-b border-sage-red-100/50 bg-sage-red-50/50 py-4">
      <Container>
        <div className="flex items-center gap-2 text-xs font-medium text-sage-gray-500">
          <Link href="/" className="hover:text-sage-primary">
            হোম
          </Link>
          <ChevronRight size={12} />
          <Link href="/batches" className="hover:text-sage-primary">
            ব্যাচসমূহ
          </Link>
          <ChevronRight size={12} />
          <span className="text-sage-secondary">{title}</span>
        </div>
      </Container>
    </div>
  );
}
