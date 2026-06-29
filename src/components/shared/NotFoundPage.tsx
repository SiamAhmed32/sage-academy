"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  GraduationCap,
  Home,
  MapPin,
  Sparkles,
} from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notFoundCopy, notFoundQuickLinks } from "@/constants/not-found-page";
import { sanitizeRequestPath } from "@/lib/sanitize-request-path";
import { cn } from "@/lib/utils";

export function NotFoundPage() {
  const pathname = usePathname();
  const loggedRef = useRef(false);
  const safePath = useMemo(() => sanitizeRequestPath(pathname), [pathname]);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    const referrer = typeof document !== "undefined" ? document.referrer.slice(0, 600) : "";

    fetch("/api/site/not-found", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: safePath, referrer }),
      keepalive: true,
    }).catch(() => {
      /* non-blocking analytics */
    });
  }, [safePath]);

  return (
    <section className="relative min-h-[calc(100vh-12rem)] overflow-hidden bg-[linear-gradient(160deg,#fff8f8_0%,#ffffff_45%,#fff7e7_100%)] py-12 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#7a1015_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-sage-red-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-sage-gold-soft/70 blur-3xl" />

      <Container className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center lg:text-left"
          >
            <Badge className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sage-primary ring-1 ring-sage-red-100 hover:bg-white">
              <Sparkles className="mr-1 size-3" />
              {notFoundCopy.badge}
            </Badge>

            <div className="relative mt-6 inline-flex items-end justify-center gap-1 lg:justify-start">
              {["4", "0", "4"].map((digit, index) => (
                <motion.span
                  key={`${digit}-${index}`}
                  initial={{ opacity: 0, y: 30, rotate: index === 1 ? 0 : -8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.08 + index * 0.08, type: "spring", stiffness: 120 }}
                  className={cn(
                    "font-heading text-[5.5rem] font-black leading-none tracking-tighter sm:text-[7rem] lg:text-[8rem]",
                    index === 1
                      ? "bg-gradient-to-b from-sage-primary to-sage-secondary bg-clip-text text-transparent"
                      : "text-sage-red-100"
                  )}
                >
                  {digit}
                </motion.span>
              ))}
            </div>

            <h1 className="bn-headline mt-4 text-2xl font-bold text-sage-secondary sm:text-3xl">
              {notFoundCopy.titleBn}
            </h1>
            <p className="mt-2 text-lg font-semibold text-sage-primary">{notFoundCopy.titleEn}</p>
            <p className="bn-text mx-auto mt-4 max-w-xl text-sm leading-7 text-sage-gray-600 sm:text-base lg:mx-0">
              {notFoundCopy.description}
            </p>

            {safePath !== "/" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-5 inline-flex max-w-full flex-col items-center gap-1 rounded-2xl border border-sage-border bg-white/80 px-4 py-3 text-left lg:items-start"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-sage-gray-500">
                  {notFoundCopy.pathLabel}
                </span>
                <code className="truncate font-mono text-sm text-sage-secondary">{safePath}</code>
              </motion.div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Button asChild size="lg" className="rounded-xl bg-sage-primary hover:bg-sage-secondary">
                <Link href="/">
                  <Home className="size-4" />
                  {notFoundCopy.homeCta}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-sage-border">
                <Link href="/contact">{notFoundCopy.contactCta}</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-sage-red-50 via-white to-amber-50 blur-sm" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-sage-red-100/80 bg-white p-6 shadow-xl shadow-sage-red-100/30 sm:p-8">
              <FloatingIcon icon={GraduationCap} className="right-6 top-6 text-sage-primary/20" delay={0} />
              <FloatingIcon icon={BookOpen} className="left-5 top-16 text-amber-600/20" delay={0.4} />
              <FloatingIcon icon={Compass} className="bottom-16 right-8 text-emerald-600/15" delay={0.8} />
              <FloatingIcon icon={MapPin} className="bottom-8 left-8 text-sage-primary/15" delay={1.2} />

              <div className="relative flex flex-col items-center py-6 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="flex size-24 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sage-primary to-sage-secondary text-white shadow-lg shadow-sage-red-200/50"
                >
                  <Compass className="size-11" />
                </motion.div>
                <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-sage-gray-500">
                  Quick shortcuts
                </p>
                <p className="mt-1 text-xs text-sage-gray-500">Jump to a popular section</p>
              </div>

              <div className="relative grid gap-2 sm:grid-cols-2">
                {notFoundQuickLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between rounded-xl border border-sage-border/80 bg-sage-cream/20 px-4 py-3 text-sm font-semibold text-sage-secondary transition hover:border-sage-primary/30 hover:bg-sage-red-50/50 hover:text-sage-primary"
                    >
                      {link.label}
                      <ArrowLeft className="size-4 rotate-180 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function FloatingIcon({
  icon: Icon,
  className,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      className={cn("pointer-events-none absolute", className)}
      animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <Icon className="size-10 sm:size-12" />
    </motion.div>
  );
}
