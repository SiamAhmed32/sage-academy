import { Container } from "@/components/shared/Container";
import { CardGridSkeleton, PageHeroSkeleton, SectionTitleSkeleton } from "@/components/shared/PublicSkeletons";

export default function HomeLoading() {
  return (
    <main aria-busy="true">
      <PageHeroSkeleton withImage />
      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitleSkeleton />
          <CardGridSkeleton count={3} />
        </Container>
      </section>
    </main>
  );
}
