import { Container } from "@/components/shared/Container";
import { BatchBreadcrumb } from "./BatchBreadcrumb";
import { BatchHero } from "./BatchHero";
import { BatchTabs } from "./BatchTabs";
import { BatchSidebar } from "./BatchSidebar";
import { BatchRelated } from "./BatchRelated";
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
  const displayTitle =
    (typeof promotionCard.title === "string" && promotionCard.title) ||
    (typeof batch.title === "string" && batch.title) ||
    "SAGE Academy batch";

  return (
    <main className="bg-sage-white">
      <BatchBreadcrumb title={displayTitle} />

      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <div className="space-y-10">
              <BatchHero promotionCard={promotionCard} batch={batch} />
              <BatchTabs promotionCard={promotionCard} batch={batch} />
            </div>

            <div className="relative">
              <BatchSidebar promotionCard={promotionCard} batch={batch} />
            </div>
          </div>
        </Container>
      </section>

      <BatchRelated related={related} />
    </main>
  );
}
