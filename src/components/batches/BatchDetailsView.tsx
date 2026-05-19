"use client";

import { Container } from "@/components/shared/Container";
import type { BatchDetailsResponse } from "@/types/batch";
import { BatchHero } from "./BatchHero";
import { BatchTabs } from "./BatchTabs";
import { BatchSidebar } from "./BatchSidebar";
import { BatchRelated } from "./BatchRelated";

type BatchDetailsViewProps = {
  data: {
    promotionCard: any;
    batch: any;
    related: any[];
  };
};

export function BatchDetailsView({ data }: BatchDetailsViewProps) {
  const { promotionCard, batch, related } = data;

  const resolveSlug = (title: string, slug?: string) => {
    if (slug && slug !== "undefined") return slug;
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || encodeURIComponent(title);
  };

  return (
    <main className="bg-sage-white">
      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            {/* Left Content Column */}
            <div className="space-y-10">
              <BatchHero promotionCard={promotionCard} batch={batch} />
              <BatchTabs promotionCard={promotionCard} batch={batch} />
            </div>

            {/* Sidebar Column */}
            <div className="relative">
              <BatchSidebar promotionCard={promotionCard} batch={batch} />
            </div>
          </div>
        </Container>
      </section>

      <BatchRelated related={related} resolveSlug={resolveSlug} />
    </main>
  );
}
