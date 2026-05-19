"use client";

import { motion } from "framer-motion";

import { HomeContactForm } from "@/components/home/HomeContactForm";
import { TrackedLink } from "@/components/engagement/TrackedLink";
import { Container } from "@/components/shared/Container";
import {
  homeContactContent,
  homeContactMeta,
  homeContactPoints,
} from "@/constants/contact";

const entranceViewport = { once: false, amount: 0.25 };

export function ContactSection() {
  return (
    <section id="contact" className="bg-sage-red-50 py-16 sm:py-20">
      <Container>
        <div className="rounded-[2rem] bg-sage-white px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={entranceViewport}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="lg:pt-4"
            >
              <p className="inline-flex rounded-full bg-sage-red-50 px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
                {homeContactContent.badge}
              </p>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-sage-secondary sm:text-4xl">
                {homeContactContent.titleStart}
                <span className="block text-sage-primary">
                  {homeContactContent.titleAccent}
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-sage-gray-700 sm:text-lg">
                {homeContactContent.description}
              </p>

              <div className="mt-8 space-y-4">
                {homeContactPoints.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-red-50 text-sage-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-sage-secondary">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-sage-gray-700">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {homeContactMeta.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full bg-sage-red-50 px-4 py-3 text-sm text-sage-gray-700 ring-1 ring-sage-red-100"
                  >
                    <span className="font-semibold text-sage-secondary">
                      {item.label}:
                    </span>{" "}
                    {item.value}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <TrackedLink
                  href="/admission"
                  trackingLabel="contact_section_admission_cta"
                  className="inline-flex rounded-full border border-sage-primary px-6 py-3 text-sm font-semibold text-sage-primary transition hover:bg-sage-primary hover:text-sage-white"
                >
                  ভর্তি আবেদন পেজে যান
                </TrackedLink>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={entranceViewport}
              transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
              className="rounded-[2rem] bg-sage-red-50 p-3 sm:p-4"
            >
              <HomeContactForm placementSource="home-contact-section" />
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
