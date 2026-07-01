import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
import type { DynamicTestimonial } from "@/components/home/TestimonialCard";
import { getFeaturedTestimonials } from "@/lib/public-testimonials";

export async function TestimonialSection() {
  let testimonials: DynamicTestimonial[] = [];

  try {
    testimonials = await getFeaturedTestimonials();
  } catch (error) {
    console.error("Testimonial load failed:", error);
  }

  if (testimonials.length === 0) return null;

  return <TestimonialCarousel testimonials={testimonials} />;
}
