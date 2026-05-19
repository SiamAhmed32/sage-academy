import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TestimonialsManager } from "@/components/admin/testimonials/TestimonialsManager";
import { connectDB } from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";

export default async function AdminTestimonialsPage() {
  await connectDB();
  const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 }).lean();

  const serialized = JSON.parse(JSON.stringify(testimonials));

  return (
    <div>
      <AdminPageHeader
        title="টেস্টিমোনিয়াল"
        description="ওয়েবসাইটে কোন review প্রকাশিত থাকবে তা নিয়ন্ত্রণ করুন।"
      />

      <TestimonialsManager initialItems={serialized} />
    </div>
  );
}
