"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";

export default function StatsSection() {
  return (
    <section className="bg-sage-secondary py-20">
      <Container>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {aboutContent.stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white sm:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium text-sage-red-100/80 sm:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
