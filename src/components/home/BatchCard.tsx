import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { HiOutlineUserGroup } from "react-icons/hi2";

export function BatchCard({ card }: { card: any }) {
  const { title, image, features, badge, linkedBatch, slug } = card;
  
  // Real-time operational data from the linked internal batch
  const status = linkedBatch?.status || badge || "ভর্তি চলছে";
  const seatsInfo = "ছেলে ও মেয়েদের আলাদা ব্যাচ";

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-sage-red-100 bg-sage-white shadow-sm transition-all hover:shadow-xl">
      <div className="relative aspect-[1.4/1] w-full overflow-hidden bg-sage-red-50">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="space-y-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 border-b border-sage-red-100 pb-4">
          <h3 className="line-clamp-2 flex-1 text-[1.7rem] font-extrabold leading-tight text-sage-secondary sm:text-[1.9rem]">
            {title}
          </h3>

          <span className="inline-flex shrink-0 rounded-full bg-sage-red-50 px-4 py-1.5 text-xs font-semibold text-sage-primary ring-1 ring-sage-red-100">
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[0.95rem] font-semibold text-sage-gray-500">
          <HiOutlineUserGroup size={18} className="text-sage-primary" />
          <span>{seatsInfo}</span>
        </div>

        <div className="space-y-3">
          {features.map((feature: string) => (
            <div key={feature} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-sage-primary" />
              <p className="line-clamp-2 text-[0.95rem] leading-7 text-sage-gray-700">
                {feature}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/batches/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-sage-secondary"
          >
            বিস্তারিত
          </Link>

          <Link
            href="/admission"
            className="inline-flex items-center gap-2 rounded-full bg-sage-primary px-5 py-3 text-sm font-semibold text-sage-white"
          >
            ভর্তি আবেদন
            <FaArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
