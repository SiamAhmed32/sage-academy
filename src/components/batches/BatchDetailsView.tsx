"use client";

import { Container } from "@/components/shared/Container";
import { BatchHero } from "./BatchHero";
import { BatchTabs } from "./BatchTabs";
import { BatchSidebar } from "./BatchSidebar";
import { BatchRelated } from "./BatchRelated";
import { buildPublicSlug } from "@/lib/public-slug";
import type { BatchDetailsResponse } from "@/types/batch";

type BatchDetailsViewProps = {
  data: {
    promotionCard: Record<string, unknown>;
    batch: Record<string, unknown>;
    related: BatchDetailsResponse["data"]["related"];
  };
};

export function BatchDetailsView({ data }: BatchDetailsViewProps) {
  const { promotionCard, batch, related } = data;

  const resolveSlug = (title: string, slug?: string) => {
    return buildPublicSlug({ title, fallback: slug || encodeURIComponent(title) });
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
