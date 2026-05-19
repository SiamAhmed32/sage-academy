"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  InstructorTab,
  OverviewTab,
} from "@/components/batches/BatchTabPanels";
import { cn } from "@/lib/utils";
import type { Batch } from "@/types/batch";

export type TabType = "overview" | "instructor";

const tabs: Array<{ key: TabType; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "instructor", label: "Instructors" },
];

export function BatchTabs({ promotionCard, batch }: { promotionCard: any; batch: any }) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div className="overflow-hidden rounded-2xl border border-sage-red-100 bg-sage-red-50/35">
      <div className="grid grid-cols-2 border-b border-sage-red-100 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "h-16 border-r border-sage-red-100 text-sm font-black tracking-wide text-sage-secondary last:border-r-0",
              activeTab === tab.key && "bg-sage-primary text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28 }}
          >
            {activeTab === "overview" && (
              <OverviewTab batch={batch} promotionCard={promotionCard} />
            )}
            {activeTab === "instructor" && <InstructorTab batch={batch} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
