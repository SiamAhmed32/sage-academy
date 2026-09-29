import { Container } from "@/components/shared/Container";
import { CardGridSkeleton, PageHeroSkeleton, SectionTitleSkeleton } from "@/components/shared/PublicSkeletons";

export default function TeachersLoading() {
  return (
    <main className="bg-background" aria-busy="true">
      <PageHeroSkeleton withImage />
      <section className="py-20">
        <Container>
          <SectionTitleSkeleton />
          <CardGridSkeleton count={8} variant="person" />
        </Container>
      </section>
    </main>
  );
}
