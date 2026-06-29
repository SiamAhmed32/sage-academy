"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { examHubHeroCopy } from "@/constants/exam-hub-page";

export function ExamHubHero() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="border-b border-sage-red-100 bg-gradient-to-b from-sage-red-50/40 to-white py-8 sm:py-10">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <Badge
              variant="outline"
              className="rounded-full border-sage-red-100 bg-white px-3 py-1 text-xs font-semibold text-sage-primary"
            >
              <Sparkles className="mr-1 size-3" />
              {examHubHeroCopy.badge}
            </Badge>

            <h1 className="bn-headline mt-3 text-3xl font-bold text-sage-secondary sm:text-4xl">
              {examHubHeroCopy.title}
            </h1>

            <p className="bn-headline-subline mt-1 text-base font-semibold text-sage-primary sm:text-lg">
              {examHubHeroCopy.subtitle}
            </p>

            <p className="bn-text mt-2 max-w-xl text-sm leading-7 text-sage-gray-600 sm:text-[15px]">
              {examHubHeroCopy.summary}
            </p>
          </motion.div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((value) => !value)}
            className="h-auto shrink-0 self-start rounded-xl px-3 py-2 text-sm font-semibold text-sage-primary hover:bg-sage-red-50 lg:self-end"
          >
            {expanded ? "কম দেখুন" : "বিস্তারিত পড়ুন"}
            <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-sage-red-100/80 bg-white/80 px-5 py-4 sm:px-6">
                {examHubHeroCopy.fullText.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="bn-text text-sm leading-8 text-sage-gray-700 last:mb-0 [&+&]:mt-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Container>
    </section>
  );
}
