import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa6";

export function BrandLogo() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-3"
      aria-label="SAGE Academy homepage"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sage-primary text-sage-white shadow-md">
        <FaGraduationCap className="size-6" aria-hidden="true" />
      </span>

      <span className="min-w-0">
        <span className="block text-xl font-bold leading-tight text-sage-secondary sm:text-2xl">
          SAGE Academy
        </span>
        <span className="block truncate text-xs font-medium text-sage-gray-500">
          একাডেমিক ও অ্যাডমিশন কেয়ার
        </span>
      </span>
    </Link>
  );
}
