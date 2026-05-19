"use client";

import Link from "next/link";
import { ExternalLink, MapPin, Phone, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { FaFacebookF } from "react-icons/fa";

import { HomeContactForm } from "@/components/home/HomeContactForm";
import { Container } from "@/components/shared/Container";
import { homeContactContent, homeContactMeta, homeContactPoints } from "@/constants/contact";

const mapUrl =
  "https://www.google.com/maps/place/SAGE+Academy/@23.7625324,90.4281258,17z/data=!3m1!4b1!4m20!1m13!4m12!1m4!2m2!1d90.3584768!2d23.7888291!4e1!1m6!1m2!1s0x3755b900660ec555:0xd63c5e1c10792bd9!2sSAGE+Academy,+block-+C,+House-36+Road+No.+3,+Dhaka+1230!2m2!1d90.4307007!2d23.7625275!3m5!1s0x3755b900660ec555:0xd63c5e1c10792bd9!8m2!3d23.7625275!4d90.4307007!16s%2Fg%2F11ywk8r62f?entry=ttu&g_ep=EgoyMDI2MDUwMi4wIKXMDSoASAFQAw%3D%3D";

const facebookUrl = "https://www.facebook.com/profile.php?id=61578740664623";

const addressText = "SAGE Academy, Block-C, House-36, Road No. 3, Dhaka 1230";
const entranceViewport = { once: false, amount: 0.25 };

export function ContactPageContent() {
  return (
    <main className="bg-sage-red-50 py-14 sm:py-18">
      <Container>
        <div className="rounded-[2rem] bg-sage-white px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={entranceViewport}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="lg:pt-3"
            >
              <p className="inline-flex rounded-full bg-sage-red-50 px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
                {homeContactContent.badge}
              </p>
              <h1 className="mt-5 text-3xl font-bold leading-tight text-sage-secondary sm:text-4xl">
                {homeContactContent.titleStart}
                <span className="block text-sage-primary">{homeContactContent.titleAccent}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-sage-gray-700 sm:text-lg">
                ভর্তি, ব্যাচ, ক্লাস রুটিন বা লোকেশন সম্পর্কিত যেকোনো তথ্যের জন্য আমাদের
                সাথে সরাসরি যোগাযোগ করুন।
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
                        <h3 className="text-base font-bold text-sage-secondary">{item.title}</h3>
                        <p className="mt-1 text-sm leading-7 text-sage-gray-700">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-sage-red-50 px-4 py-3 ring-1 ring-sage-red-100">
                  <MapPin className="mt-0.5 h-4 w-4 text-sage-primary" />
                  <p className="text-sm text-sage-gray-700">{addressText}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {homeContactMeta.map((item) => {
                    const Icon = item.label === "ফোন" ? Phone : Clock3;
                    return (
                      <div
                        key={item.label}
                        className="inline-flex items-center gap-2 rounded-full bg-sage-red-50 px-4 py-3 text-sm text-sage-gray-700 ring-1 ring-sage-red-100"
                      >
                        <Icon className="h-4 w-4 text-sage-primary" />
                        <span>
                          <span className="font-semibold text-sage-secondary">{item.label}:</span>{" "}
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sage-primary px-5 py-3 text-sm font-semibold text-sage-primary transition hover:bg-sage-primary hover:text-sage-white"
                >
                  ম্যাপে লোকেশন দেখুন
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-sage-primary px-5 py-3 text-sm font-semibold text-sage-white transition hover:bg-sage-primary-hover"
                >
                  Facebook পেজ
                  <FaFacebookF className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={entranceViewport}
              transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-[2rem] border border-sage-red-100 bg-sage-red-50 p-3 sm:p-4">
                <iframe
                  src="https://www.google.com/maps?q=23.7625275,90.4307007&z=16&output=embed"
                  title="SAGE Academy Location Map"
                  className="h-64 w-full rounded-2xl border-0 sm:h-72"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="rounded-[2rem] bg-sage-red-50 p-3 sm:p-4">
                <HomeContactForm placementSource="contact-page" />
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </main>
  );
}
