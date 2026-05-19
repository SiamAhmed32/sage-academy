"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";
import { HiOutlineLightBulb, HiOutlineRocketLaunch } from "react-icons/hi2";

export default function MissionVision() {
  const icons = {
    mission: <HiOutlineRocketLaunch className="size-8 text-sage-primary" />,
    vision: <HiOutlineLightBulb className="size-8 text-sage-primary" />,
  };

  return (
    <section className="bg-sage-red-50 py-20">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {aboutContent.missionVision.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-sage-white p-8 shadow-sm ring-1 ring-sage-red-100"
            >
              <div className="mb-6 inline-flex rounded-2xl bg-sage-red-50 p-4">
                {icons[item.icon as keyof typeof icons]}
              </div>
              <h3 className="mb-4 text-2xl font-bold text-sage-secondary">
                {item.title}
              </h3>
              <p className="text-lg leading-relaxed text-sage-gray-700">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
