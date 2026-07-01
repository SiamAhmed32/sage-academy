import Image from "next/image";
import { FaArrowRight } from "react-icons/fa6";
import { HiOutlineUserGroup } from "react-icons/hi2";

import { PendingLink } from "@/components/shared/PendingLink";
import { cn } from "@/lib/utils";
import { buildPublicSlug } from "@/lib/public-slug";

type BatchCardData = {
  title: string;
  image: string;
  features: string[];
  badge?: string;
  slug?: string;
  linkedBatch?: {
    status?: string;
    classLevel?: number | string;
  } | null;
};

export function BatchCard({ card }: { card: BatchCardData }) {
  const { title, image, features, badge, linkedBatch, slug } = card;
  const publicSlug = buildPublicSlug({
    title,
    classLevel: linkedBatch?.classLevel,
    fallback: slug?.trim() || "batch",
  });
  const detailsHref = `/batches/${publicSlug}`;

  const status = linkedBatch?.status || badge || "ভর্তি চলছে";
  const seatsInfo = "ছেলে ও মেয়েদের আলাদা ব্যাচ";

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-sage-red-100 bg-sage-white shadow-sm transition-all hover:shadow-xl">
      <PendingLink href={detailsHref} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-sage-red-50 md:aspect-[1.4/1]">
          <Image
            src={image}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </PendingLink>

      <div className="space-y-4 p-4 md:space-y-5 md:p-7">
        <div className="flex items-start justify-between gap-3 border-b border-sage-red-100 pb-3 md:pb-4">
          <h3 className="line-clamp-2 flex-1 text-2xl font-extrabold leading-tight text-sage-secondary md:text-[1.9rem]">
            {title}
          </h3>

          <span className="inline-flex shrink-0 rounded-full bg-sage-red-50 px-3 py-1 text-xs font-semibold text-sage-primary ring-1 ring-sage-red-100 md:px-4 md:py-1.5">
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-sage-gray-500 md:text-[0.95rem]">
          <HiOutlineUserGroup size={18} className="text-sage-primary" />
          <span>{seatsInfo}</span>
        </div>

        <div className="space-y-2.5 md:space-y-3">
          {features.map((feature: string, index: number) => (
            <div
              key={feature}
              className={cn("flex items-start gap-3", index >= 3 && "hidden md:flex")}
            >
              <span className="mt-2 h-2 w-2 rounded-full bg-sage-primary" />
              <p className="line-clamp-2 text-sm leading-6 text-sage-gray-700 md:text-[0.95rem] md:leading-7">
                {feature}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <PendingLink
            href={detailsHref}
            pendingLabel="লোড হচ্ছে..."
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-sage-secondary md:px-5 md:py-3"
          >
            বিস্তারিত
          </PendingLink>

          <PendingLink
            href="/admission"
            pendingLabel="যাচ্ছে..."
            className="inline-flex items-center gap-2 rounded-full bg-sage-primary px-4 py-2.5 text-sm font-semibold text-sage-white md:px-5 md:py-3"
          >
            ভর্তি আবেদন
            <FaArrowRight size={14} />
          </PendingLink>
        </div>
      </div>
    </article>
  );
}
