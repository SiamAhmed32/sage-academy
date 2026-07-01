import { Container } from "@/components/shared/Container";

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-sage-red-50/80 ${className ?? ""}`} />;
}

export default function HomeLoading() {
  return (
    <main>
      <section className="border-b border-sage-red-100 bg-gradient-to-b from-sage-red-50 to-sage-white py-16 sm:py-20">
        <Container className="space-y-5">
          <Block className="h-8 w-40" />
          <Block className="h-16 w-full max-w-3xl" />
          <Block className="h-6 w-full max-w-2xl" />
          <div className="flex gap-4 pt-4">
            <Block className="h-12 w-36 rounded-full" />
            <Block className="h-12 w-36 rounded-full" />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="space-y-8">
          <Block className="h-10 w-72" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Block key={index} className="h-[420px]" />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
