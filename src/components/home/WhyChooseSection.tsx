"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  MessageCircleQuestion,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/shared/Container";
import { whyChooseContent } from "@/constants/why-choose";
import { cn } from "@/lib/utils";

const iconMap = {
  teacher: GraduationCap,
  exam: CalendarCheck,
  doubt: MessageCircleQuestion,
  homework: ClipboardCheck,
} as const;

const stagger = {
  hidden: { opacity: 0, y: 18 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: index * 0.08 },
  }),
};

function WhyChooseImage({ className, mobile = false }: { className?: string; mobile?: boolean }) {
  return (
    <div className={cn("relative w-full", mobile && "mx-auto max-w-xl", className)}>
      {!mobile && (
        <>
          <div className="absolute -left-5 -top-5 hidden h-14 w-14 rounded-tl-[1.75rem] border-l-[3px] border-t-[3px] border-white/25 lg:block" />
          <div className="absolute -bottom-5 -right-5 hidden h-14 w-14 rounded-br-[1.75rem] border-b-[3px] border-r-[3px] border-white/25 lg:block" />
        </>
      )}

      {mobile && (
        <div className="pointer-events-none absolute -right-2 -top-2 h-14 w-14 rounded-2xl bg-sage-gold/35 ring-1 ring-white/15" />
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden",
          mobile
            ? "aspect-[4/5] min-h-[300px] max-h-[min(420px,62svh)] rounded-[1.65rem] shadow-[0_22px_48px_-18px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
            : "aspect-[4/5] min-h-[320px] rounded-none shadow-[0_28px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/15 sm:min-h-[380px] lg:aspect-[4/5] lg:min-h-[440px] lg:rounded-[1.75rem]"
        )}
      >
        <Image
          src={whyChooseContent.image}
          alt={whyChooseContent.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sage-secondary/30 via-transparent to-transparent" />
      </div>
    </div>
  );
}

export function WhyChooseSection() {
  return (
    <section className="relative overflow-hidden bg-sage-primary py-0 text-white sm:py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-20 hidden grid-cols-5 gap-2 opacity-[0.12] lg:grid">
        {Array.from({ length: 20 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
        ))}
      </div>

      <Container className="relative py-10 sm:py-0 lg:py-0">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center lg:gap-14 xl:gap-16">
          <div className="lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
            >
              <Badge
                variant="outline"
                className="bn-headline mb-5 h-auto rounded-full border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-sage-red-100"
              >
                {whyChooseContent.title}
              </Badge>

              <h2 className="bn-headline text-3xl font-black leading-[1.15] sm:text-4xl lg:text-[2.65rem]">
                {whyChooseContent.subtitle}
              </h2>

              <p className="mt-5 max-w-2xl border-l-2 border-white/25 pl-4 text-base leading-8 text-white/85 sm:text-[1.05rem]">
                {whyChooseContent.description}
              </p>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
              {whyChooseContent.highlights.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? GraduationCap;

                return (
                  <motion.div
                    key={item.title}
                    custom={index}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={stagger}
                  >
                    <Card
                      size="sm"
                      className={cn(
                        "h-full border-white/10 bg-white/[0.07] py-0 text-white shadow-none backdrop-blur-sm",
                        "transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.11]"
                      )}
                    >
                      <CardContent className="flex h-full gap-4 px-4 py-4 sm:px-5 sm:py-5">
                        <div className="flex shrink-0 flex-col items-center gap-2">
                          <span className="text-[10px] font-bold tracking-[0.2em] text-sage-red-100/70">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-sage-red-100 ring-1 ring-white/10">
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold leading-snug text-white">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-sage-red-100/75">
                            {item.desc}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="mt-8 sm:mt-10"
            >
              <Link
                href="/about"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-sage-cream px-7 text-sm font-bold text-sage-primary shadow-lg shadow-black/20 ring-1 ring-white/15 transition hover:bg-white hover:shadow-xl"
              >
                {whyChooseContent.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Desktop: image on the right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto hidden w-full max-w-md lg:order-2 lg:block lg:max-w-none"
          >
            <WhyChooseImage />
          </motion.div>
        </div>
      </Container>

      <Container className="pb-10 lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <WhyChooseImage mobile />
        </motion.div>
      </Container>
    </section>
  );
}
