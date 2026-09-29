import { Container } from "@/components/shared/Container";
import { CardGridSkeleton, PageHeroSkeleton } from "@/components/shared/PublicSkeletons";

export default function ExamsLoading() {
  return (
    <main className="bg-sage-white" aria-busy="true">
      <PageHeroSkeleton />
      <section className="py-16">
        <Container>
          <CardGridSkeleton count={6} variant="text" />
        </Container>
      </section>
    </main>
  );
}
