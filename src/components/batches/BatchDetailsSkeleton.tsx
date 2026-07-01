import { Container } from "@/components/shared/Container";

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-sage-red-50/80 ${className ?? ""}`} />;
}

export function BatchDetailsSkeleton() {
  return (
    <main className="bg-sage-white">
      <div className="border-b border-sage-red-100/50 bg-sage-red-50/50 py-4">
        <Container>
          <Block className="h-4 w-56" />
        </Container>
      </div>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <div className="space-y-10">
              <Block className="aspect-video w-full" />
              <div className="space-y-4">
                <Block className="h-4 w-40" />
                <Block className="h-12 w-full max-w-xl" />
                <Block className="h-4 w-64" />
              </div>
              <div className="space-y-3">
                <Block className="h-10 w-full" />
                <Block className="h-32 w-full" />
              </div>
            </div>

            <aside className="space-y-6">
              <Block className="h-[420px] w-full" />
              <Block className="h-40 w-full" />
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}
