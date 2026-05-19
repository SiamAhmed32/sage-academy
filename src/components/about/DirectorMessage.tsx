"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";
import Image from "next/image";
import { HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2";

export default function DirectorMessage() {
  const { directorMessage } = aboutContent;

  return (
    <section className="bg-sage-white py-20 lg:py-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] bg-sage-red-50 shadow-2xl ring-1 ring-sage-red-100"
          >
            <Image
              src={directorMessage.image}
              alt={directorMessage.name}
              fill
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <HiOutlineChatBubbleBottomCenterText className="mb-6 size-12 text-sage-primary/20" />
            <h2 className="text-3xl font-bold text-sage-secondary sm:text-4xl">
              পরিচালকের বার্তা
            </h2>
            <div className="mt-8 relative">
              <p className="text-xl italic leading-relaxed text-sage-gray-700">
                &ldquo;{directorMessage.message}&rdquo;
              </p>
            </div>
            <div className="mt-10">
              <h4 className="text-2xl font-bold text-sage-primary">
                {directorMessage.name}
              </h4>
              <p className="mt-1 font-medium text-sage-gray-600">
                {directorMessage.designation}
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
