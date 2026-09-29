import { Container } from "@/components/shared/Container";

/** One shimmering placeholder block. */
export function Skel({ className = "" }: { className?: string }) {
  return <span className={`sage-skel block ${className}`} />;
}

/** Page header: eyebrow, title, one line of text. */
export function PageHeroSkeleton({ withImage = false }: { withImage?: boolean }) {
  return (
    <section className="border-b border-sage-red-100 bg-gradient-to-b from-sage-red-50 to-sage-white py-16 sm:py-20">
      <Container className={withImage ? "grid items-center gap-10 lg:grid-cols-2" : ""}>
        <div className="space-y-4">
          <Skel className="h-7 w-36 rounded-full" />
          <Skel className="h-12 w-full max-w-2xl rounded-xl sm:h-14" />
          <Skel className="h-12 w-4/5 max-w-xl rounded-xl sm:hidden" />
          <Skel className="h-5 w-full max-w-xl" />
          <Skel className="h-5 w-3/5 max-w-md" />
          <div className="flex gap-3 pt-3">
            <Skel className="h-12 w-36 rounded-full" />
            <Skel className="h-12 w-32 rounded-full" />
          </div>
        </div>
        {withImage ? <Skel className="aspect-[4/3] w-full rounded-[2rem]" /> : null}
      </Container>
    </section>
  );
}

/** A card shaped like a batch or exam card: image, tag, title, details, button. */
function MediaCardSkeleton({ image = true }: { image?: boolean }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-sage-red-100 bg-white shadow-sm">
      {image ? <Skel className="aspect-[16/10] w-full rounded-none" /> : null}
      <div className="space-y-4 p-6">
        <Skel className="h-6 w-24 rounded-full" />
        <Skel className="h-6 w-4/5" />
        <div className="space-y-2.5">
          <Skel className="h-4 w-full" />
          <Skel className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between border-t border-sage-red-50 pt-4">
          <Skel className="h-6 w-20" />
          <Skel className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** A teacher card: portrait, name, subject. */
function PersonCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-sage-red-100 bg-white shadow-sm">
      <Skel className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2.5 p-5 text-center">
        <Skel className="mx-auto h-5 w-2/3" />
        <Skel className="mx-auto h-4 w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  variant = "media",
}: {
  count?: number;
  variant?: "media" | "text" | "person";
}) {
  const grid = variant === "person" ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3";
  return (
    <div className={`grid gap-6 ${grid}`}>
      {Array.from({ length: count }, (_, index) =>
        variant === "person" ? (
          <PersonCardSkeleton key={index} />
        ) : (
          <MediaCardSkeleton key={index} image={variant === "media"} />
        )
      )}
    </div>
  );
}

/** Section title placeholder (centred). */
export function SectionTitleSkeleton() {
  return (
    <div className="mb-10 space-y-3 text-center">
      <Skel className="mx-auto h-6 w-32 rounded-full" />
      <Skel className="mx-auto h-9 w-72 max-w-full rounded-xl" />
    </div>
  );
}
