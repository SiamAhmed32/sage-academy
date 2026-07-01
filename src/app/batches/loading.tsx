import { Container } from "@/components/shared/Container";

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-sage-red-50/80 ${className ?? ""}`} />;
}

export default function BatchesLoading() {
  return (
    <main className="bg-sage-white">
      <section className="border-b border-sage-red-100 bg-gradient-to-b from-sage-red-50 to-sage-white py-20">
        <Container className="space-y-4">
          <Block className="h-8 w-48" />
          <Block className="h-14 w-full max-w-3xl" />
          <Block className="h-6 w-full max-w-2xl" />
        </Container>
      </section>
      <section className="py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Block key={index} className="h-[520px]" />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
