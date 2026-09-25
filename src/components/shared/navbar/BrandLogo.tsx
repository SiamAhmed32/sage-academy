import Image from "next/image";
import Link from "next/link";

/**
 * Header brand mark: the SAGE wordmark on its own, transparent background,
 * no badge and no accompanying text. Source asset is a trimmed transparent
 * PNG (1040x411) generated from public/finalLogo.jpeg.
 */
export function BrandLogo() {
  return (
    <Link
      href="/"
      aria-label="SAGE Academy homepage"
      className="group inline-flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary/40 focus-visible:ring-offset-4"
    >
      <Image
        src="/sage-wordmark.png"
        alt="SAGE Academy"
        width={1040}
        height={411}
        priority
        sizes="(min-width: 640px) 92px, 82px"
        className="h-8 w-auto transition-opacity duration-200 group-hover:opacity-85 sm:h-9"
      />
    </Link>
  );
}
