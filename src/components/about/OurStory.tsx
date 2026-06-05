"use client";

import { motion } from "framer-motion";
import { BookOpen, Target, Heart, Users, ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { aboutContent } from "@/constants/about";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  book: BookOpen,
  target: Target,
  heart: Heart,
  users: Users,
};

export default function OurStory() {
  const { philosophy, journey } = aboutContent;

  return (
    <div className="bg-slate-50/50 py-20 space-y-24 lg:py-32 overflow-hidden">
      {/* 1. Philosophy Cards Section */}
      <section className="relative">
        {/* Abstract background shapes */}
        <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-sage-primary/5 blur-3xl" />
        <div className="absolute left-0 bottom-0 -z-10 h-72 w-72 rounded-full bg-sage-secondary/5 blur-3xl" />

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-black tracking-tight text-sage-secondary sm:text-4xl"
            >
              {philosophy.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="mt-4 text-base text-sage-gray-500 sm:text-lg"
            >
              {philosophy.subtitle}
            </motion.p>
          </div>

          {/* Cards Grid */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {philosophy.cards.map((card, index) => {
              const Icon = iconMap[card.icon] || BookOpen;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative rounded-3xl border border-sage-border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-sage-primary hover:shadow-xl hover:shadow-sage-primary/5"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-red-50 text-sage-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-sage-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-sage-secondary transition-colors duration-300 group-hover:text-sage-primary">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-sage-gray-600">
                    {card.text}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Versatility Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-16 rounded-3xl bg-gradient-to-r from-sage-primary to-sage-secondary p-8 text-center text-white shadow-xl shadow-sage-primary/10 relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <p className="relative text-base font-extrabold sm:text-lg lg:text-xl flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">
                Flexible Learning
              </span>
              <span>{philosophy.versatility}</span>
            </p>
          </motion.div>
        </Container>
      </section>

      {/* 2. Timeline Section */}
      <section className="relative">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-black tracking-tight text-sage-secondary sm:text-4xl"
            >
              {journey.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="mt-4 text-base text-sage-gray-500 sm:text-lg"
            >
              {journey.subtitle}
            </motion.p>
          </div>

          {/* Timeline Steps Layout */}
          <div className="relative mt-20">
            {/* Vertical Connecting Line (Centered on Desktop, Left on Mobile) */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-sage-primary/20 via-sage-primary to-sage-secondary/20 md:left-1/2 md:-ml-[1px]" />

            <div className="space-y-12 md:space-y-16">
              {journey.steps.map((step, index) => {
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative flex flex-col md:flex-row items-start md:items-center",
                      isEven ? "md:flex-row-reverse" : ""
                    )}
                  >
                    {/* Visual spacer on desktop to push card to side */}
                    <div className="hidden md:block md:w-1/2" />

                    {/* Timeline Node Point */}
                    <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center z-10">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white border-4 border-sage-primary shadow-md">
                        <span className="h-2 w-2 rounded-full bg-sage-primary animate-pulse" />
                      </span>
                    </div>

                    {/* Timeline Content Card */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      viewport={{ once: true }}
                      className={cn(
                        "w-full pl-12 md:pl-0 md:w-1/2",
                        isEven ? "md:pr-12 lg:pr-16" : "md:pl-12 lg:pl-16"
                      )}
                    >
                      <div className="rounded-3xl border border-sage-border bg-white p-6 shadow-sm hover:shadow-xl hover:border-sage-primary/30 transition-all duration-300 relative group">
                        {/* Interactive glow effect */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sage-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <span className="inline-flex rounded-full bg-sage-red-50 px-3 py-1 text-xs font-bold text-sage-primary">
                          {step.badge}
                        </span>
                        <h3 className="mt-4 text-xl font-black text-sage-secondary flex items-center gap-2">
                          {step.title}
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 text-sage-primary" />
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-sage-gray-600">
                          {step.text}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
