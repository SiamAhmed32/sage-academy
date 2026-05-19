import { FaStar } from "react-icons/fa6";
import { Quote } from "lucide-react";

export type DynamicTestimonial = {
  _id: string;
  name: string;
  role: "student" | "guardian";
  className: string;
  review: string;
  rating: number;
  image: string;
};

interface TestimonialCardProps {
  item: DynamicTestimonial;
  index: number;
}

const cardStyles = [
  {
    surface: "bg-sage-card-lavender",
    ring: "border-sage-card-lavender-border",
    shadow: "shadow-sage-card-lavender-border/35",
    avatar: "bg-sage-card-lavender-avatar",
    rotate: "xl:-rotate-1",
  },
  {
    surface: "bg-sage-card-mint",
    ring: "border-sage-card-mint-border",
    shadow: "shadow-sage-card-mint-border/35",
    avatar: "bg-sage-card-mint-avatar",
    rotate: "xl:rotate-1",
  },
  {
    surface: "bg-sage-card-honey",
    ring: "border-sage-card-honey-border",
    shadow: "shadow-sage-card-honey-border/35",
    avatar: "bg-sage-card-honey-avatar",
    rotate: "xl:-rotate-1",
  },
  {
    surface: "bg-sage-card-rose",
    ring: "border-sage-red-100",
    shadow: "shadow-sage-red-100/50",
    avatar: "bg-sage-red-100",
    rotate: "xl:rotate-1",
  },
  {
    surface: "bg-sage-card-sky",
    ring: "border-sage-card-sky-border",
    shadow: "shadow-sage-card-sky-border/35",
    avatar: "bg-sage-card-sky-avatar",
    rotate: "xl:-rotate-1",
  },
];

export function TestimonialCard({ item, index }: TestimonialCardProps) {
  const style = cardStyles[index % cardStyles.length];
  const stars = Math.max(1, Math.min(5, Math.round(item.rating || 5)));

  return (
    <article
      className={`${index > 0 ? "hidden md:flex" : ""} ${
        index > 1 ? "md:hidden xl:flex" : ""
      } group relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[1.75rem] border ${style.ring} ${style.surface} p-7 shadow-xl ${style.shadow} transition duration-300 hover:-translate-y-1 hover:rotate-0 sm:p-8 ${style.rotate}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/35" />
      <Quote className="pointer-events-none absolute right-7 top-7 h-10 w-10 text-sage-secondary/10" />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-1.5 text-sage-gold">
          {Array.from({ length: stars }).map((_, starIndex) => (
            <FaStar key={starIndex} className="drop-shadow-sm" />
          ))}
        </div>

        <p className="mt-7 line-clamp-5 min-h-40 text-lg font-semibold leading-8 text-sage-gray-700">
          “{item.review}”
        </p>
      </div>

      <div className="relative mt-8 flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${style.avatar} ring-4 ring-white/55`}>
          <img
            src={item.image?.trim() || "/images/testimonials/placeholder.svg"}
            alt={item.name}
            className="h-12 w-12 rounded-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-xl font-black text-sage-secondary">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-sage-gray-500">
            {item.role === "guardian" ? "অভিভাবক" : "শিক্ষার্থী"}
            {item.className ? ` · ${item.className}` : ""}
          </p>
        </div>
      </div>
    </article>
  );
}
