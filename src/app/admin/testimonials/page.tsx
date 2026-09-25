import { TestimonialCreateButton, TestimonialsGrid } from "@/components/admin/grids/TestimonialsGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { testimonialTiles } from "@/lib/grid/tiles-content";

export default async function AdminTestimonialsPage() {
  const tiles = await testimonialTiles();

  return (
    <div>
      <PageHeading
        title="Testimonials"
        description="Control which reviews are published on the website."
        actions={<TestimonialCreateButton />}
      />
      <TestimonialsGrid tiles={tiles} />
    </div>
  );
}
