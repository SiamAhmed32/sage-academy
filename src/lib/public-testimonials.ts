import { unstable_cache } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";
import type { DynamicTestimonial } from "@/components/home/TestimonialCard";

export const PUBLIC_TESTIMONIALS_CACHE_TAG = "public-testimonials";

async function fetchFeaturedTestimonials() {
  await connectDB();

  const testimonials = await Testimonial.find({
    isFeatured: true,
    $or: [{ source: "admin" }, { source: { $exists: false } }, { source: "" }],
  })
    .select("name role className review rating image")
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return testimonials.map((item) => ({
    _id: String(item._id),
    name: item.name,
    role: item.role as DynamicTestimonial["role"],
    className: item.className,
    review: item.review,
    rating: item.rating,
    image: item.image,
  }));
}

export const getFeaturedTestimonials = unstable_cache(
  fetchFeaturedTestimonials,
  ["featured-testimonials"],
  { revalidate: 60, tags: [PUBLIC_TESTIMONIALS_CACHE_TAG] }
);
