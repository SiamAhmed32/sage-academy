import { Container } from "@/components/shared/Container";

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-sage-red-50/80 ${className ?? ""}`} />;
}

export default function TeachersLoading() {
  return (
    <main className="bg-background">
      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-5">
              <Block className="h-14 w-full max-w-lg" />
              <Block className="h-6 w-full max-w-md" />
              <div className="flex gap-4">
                <Block className="h-12 w-36 rounded-full" />
                <Block className="h-12 w-36 rounded-full" />
              </div>
            </div>
            <Block className="h-[360px] w-full rounded-3xl" />
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <Block className="mx-auto mb-12 h-10 w-64" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Block key={index} className="h-80 w-full" />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
