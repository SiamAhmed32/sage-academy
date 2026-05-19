"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";

export default function ValuesSection() {
  return (
    <section className="bg-sage-white py-20">
      <Container>
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-sage-secondary sm:text-4xl">
            আমাদের মূল বৈশিষ্ট্যসমূহ
          </h2>
          <p className="mt-4 text-lg text-sage-gray-600">
            শিক্ষার্থীদের ভবিষ্যতের জন্য গড়ে তুলতে আমরা এই নীতিগুলো মেনে চলি।
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aboutContent.values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-sage-red-50 p-6 text-center ring-1 ring-sage-red-100 transition-shadow hover:shadow-md"
            >
              <h4 className="text-xl font-bold text-sage-secondary">
                {value.title}
              </h4>
              <p className="mt-3 text-sage-gray-600">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
