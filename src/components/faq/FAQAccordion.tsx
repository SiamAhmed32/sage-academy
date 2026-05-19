"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { faqContent } from "@/constants/faq";
import { cn } from "@/lib/utils";

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <section className="bg-white py-20">
      <Container>
        <div className="mx-auto max-w-4xl">
          {faqContent.categories.map((category, catIndex) => (
            <div key={category.id} className={cn(catIndex > 0 && "mt-12")}>
              <h2 className="mb-8 text-2xl font-bold text-sage-secondary underline decoration-sage-primary/20 decoration-4 underline-offset-8">
                {category.label}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, qIndex) => {
                  const id = `${category.id}-${qIndex}`;
                  const isOpen = openIndex === id;

                  return (
                    <div
                      key={id}
                      className={cn(
                        "overflow-hidden rounded-2xl border transition-all duration-300",
                        isOpen 
                          ? "border-sage-primary/20 bg-sage-red-50/30 shadow-sm" 
                          : "border-sage-red-100 bg-white hover:border-sage-primary/10"
                      )}
                    >
                      <button
                        onClick={() => toggle(id)}
                        className="flex w-full items-center justify-between p-6 text-left"
                      >
                        <span className="text-lg font-bold text-sage-secondary">
                          {item.question}
                        </span>
                        <span className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          isOpen ? "bg-sage-primary text-white" : "bg-sage-red-50 text-sage-primary"
                        )}>
                          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                        </span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="border-t border-sage-primary/5 p-6 pt-0">
                              <p className="text-lg leading-relaxed text-sage-gray-700">
                                {item.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
