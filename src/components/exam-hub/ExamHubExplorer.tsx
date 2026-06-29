"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, MonitorSmartphone, Search } from "lucide-react";

import { ExamProgramCard } from "@/components/exam-hub/ExamProgramCard";
import { Container } from "@/components/shared/Container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type { PublicExamProgram } from "@/lib/exam-hub";

type Props = {
  programs: PublicExamProgram[];
};

export function ExamHubExplorer({ programs }: Props) {
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [onlineFilter, setOnlineFilter] = useState<"all" | "public" | "private">("all");
  const [offlineFilter, setOfflineFilter] = useState<"all" | "weekly" | "monthly">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return programs.filter((program) => {
      if (program.deliveryMode !== mode) return false;
      if (mode === "online" && onlineFilter !== "all" && program.accessType !== onlineFilter) return false;
      if (mode === "offline" && offlineFilter !== "all" && program.offlineType !== offlineFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        program.title.toLowerCase().includes(q) ||
        program.subtitle.toLowerCase().includes(q) ||
        program.description.toLowerCase().includes(q)
      );
    });
  }, [programs, mode, onlineFilter, offlineFilter, query]);

  return (
    <section className="py-10 sm:py-12">
      <Container>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage-gray-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="পরীক্ষার নাম খুঁজুন..."
              className="h-11 rounded-2xl border-sage-border bg-white pl-10"
            />
          </div>
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as "online" | "offline")}>
          <TabsList className="mb-6">
            <TabsTrigger value="online" className="gap-2">
              <MonitorSmartphone className="size-4" />
              Online
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2">
              <Globe2 className="size-4" />
              Offline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online">
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                { id: "all", label: "All online" },
                { id: "public", label: "Public (Free)" },
                { id: "private", label: "Private (Paid)" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOnlineFilter(item.id as typeof onlineFilter)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    onlineFilter === item.id
                      ? "bg-sage-secondary text-white"
                      : "bg-white text-sage-gray-700 ring-1 ring-sage-border hover:bg-sage-red-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ExamGrid items={filtered} empty="কোনো অনলাইন পরীক্ষা পাওয়া যায়নি।" />
          </TabsContent>

          <TabsContent value="offline">
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                { id: "all", label: "All offline" },
                { id: "weekly", label: "Weekly" },
                { id: "monthly", label: "Monthly" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOfflineFilter(item.id as typeof offlineFilter)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    offlineFilter === item.id
                      ? "bg-sage-secondary text-white"
                      : "bg-white text-sage-gray-700 ring-1 ring-sage-border hover:bg-sage-red-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ExamGrid items={filtered} empty="কোনো অফলাইন পরীক্ষা পাওয়া যায়নি।" />
          </TabsContent>
        </Tabs>
      </Container>
    </section>
  );
}

function ExamGrid({ items, empty }: { items: PublicExamProgram[]; empty: string }) {
  if (!items.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl border border-dashed border-sage-border bg-white px-6 py-16 text-center"
      >
        <p className="bn-text text-sage-gray-500">{empty}</p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((program, index) => (
        <ExamProgramCard key={program._id} program={program} index={index} />
      ))}
    </div>
  );
}
