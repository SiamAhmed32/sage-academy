"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";

export default function OurStory() {
  const { ourStory } = aboutContent;

  return (
    <section className="bg-sage-white py-20">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-sage-secondary sm:text-4xl"
          >
            {ourStory.title}
          </motion.h2>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-sage-gray-700">
            {ourStory.content.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
