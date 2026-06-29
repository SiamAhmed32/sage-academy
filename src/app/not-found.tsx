import type { Metadata } from "next";

import { NotFoundPage } from "@/components/shared/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found | SAGE Academy",
  description: "The page you requested could not be found on SAGE Academy.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return <NotFoundPage />;
}
