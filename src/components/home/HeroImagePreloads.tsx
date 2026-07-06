import { heroGallerySlides } from "@/constants/hero";

const PRELOAD_COUNT = 3;

export function HeroImagePreloads() {
  return (
    <>
      {heroGallerySlides.slice(0, PRELOAD_COUNT).map((slide) => (
        <link
          key={slide.image}
          rel="preload"
          as="image"
          href={encodeURI(slide.image)}
          fetchPriority={slide.image === heroGallerySlides[0]?.image ? "high" : "low"}
        />
      ))}
    </>
  );
}
