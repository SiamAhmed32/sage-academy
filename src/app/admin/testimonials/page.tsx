import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/admin/shared/Pagination";
import { TestimonialsManager } from "@/components/admin/testimonials/TestimonialsManager";
import {
  boundedAdminSearch,
  clampAdminPage,
  escapeAdminRegex,
  getAdminParam,
  parseAdminPage,
  pickAdminSort,
} from "@/lib/admin-query";
import { connectDB } from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;
const sortOptions: Record<string, Record<string, 1 | -1>> = {
  order: { order: 1, createdAt: -1 },
  newest: { createdAt: -1 },
  name: { name: 1, createdAt: -1 },
  rating: { rating: -1, createdAt: -1 },
};

export default async function AdminTestimonialsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = boundedAdminSearch(getAdminParam(params, "q"));
  const role = getAdminParam(params, "role");
  const status = getAdminParam(params, "status");
  const sort = getAdminParam(params, "sort", "order");
  const requestedPage = parseAdminPage(getAdminParam(params, "page"));
  const filter: Record<string, unknown> = {};

  if (q) {
    const regex = new RegExp(escapeAdminRegex(q), "i");
    filter.$or = [{ name: regex }, { className: regex }, { review: regex }];
  }
  if (role === "student" || role === "guardian") filter.role = role;
  if (status === "published") filter.isFeatured = true;
  if (status === "unpublished") filter.isFeatured = false;

  await connectDB();
  const total = await Testimonial.countDocuments(filter);
  const { page, totalPages } = clampAdminPage(requestedPage, total, PAGE_SIZE);
  const testimonials = await Testimonial.find(filter)
    .select("name role className review rating image isFeatured order")
    .sort(pickAdminSort(sort, sortOptions, "order"))
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const serialized = JSON.parse(JSON.stringify(testimonials));

  return (
    <div>
      <AdminPageHeader
        title="Testimonials"
        description="Control which reviews are published on the website."
      />

      <TestimonialsManager initialItems={serialized} filters={{ q, role, status, sort }} />
      <Pagination totalPages={totalPages} currentPage={page} totalItems={total} pageSize={PAGE_SIZE} showWhenSinglePage />
    </div>
  );
}
