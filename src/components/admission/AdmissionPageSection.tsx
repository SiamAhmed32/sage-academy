"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Clock3, HeartHandshake, MapPin, Phone, ShieldCheck } from "lucide-react";

import { AdmissionForm } from "@/components/admission/AdmissionForm";
import { AdmissionHighlightItem } from "@/components/admission/AdmissionHighlightItem";
import { AdmissionPageEngagementTracker } from "@/components/engagement/AdmissionPageEngagementTracker";
import { Container } from "@/components/shared/Container";
import {
  admissionGuardianNote,
  admissionHighlights,
  admissionPageContent,
} from "@/constants/admission";

export function AdmissionPageSection() {
  return (
    <section className="overflow-hidden bg-[#fffafa] pb-14 sm:pb-18 lg:pb-24">
      <AdmissionPageEngagementTracker />
      <Container className="max-w-[358px] sm:max-w-7xl">
        <div className="grid min-w-0 items-center gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-w-0 max-w-2xl"
          >
            <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-sage-primary ring-1 ring-sage-red-100">
              {admissionPageContent.badge}
            </p>
            <h1 className="mt-5 break-words text-3xl font-black leading-tight text-sage-secondary 2xs:text-4xl sm:text-5xl lg:text-6xl">
              {admissionPageContent.titleStart}
              <span className="block text-sage-primary">{admissionPageContent.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl break-words text-base leading-8 text-sage-gray-700 sm:text-lg">
              {admissionPageContent.description}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Clock3, label: "দ্রুত ফলোআপ" },
                { icon: ShieldCheck, label: "নিরাপদ তথ্য" },
                { icon: HeartHandshake, label: "অভিভাবক সহায়তা" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-sage-red-100 bg-white px-4 py-3 text-sm font-bold text-sage-secondary shadow-sm"
                >
                  <Icon className="h-4 w-4 text-sage-primary" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative min-h-[300px] min-w-0 overflow-hidden rounded-lg border border-sage-red-100 bg-sage-red-50 shadow-xl shadow-sage-red-100/40 sm:min-h-[390px] lg:min-h-[460px]"
          >
            <Image
              src="/sagePictures/teamPicture.jpg"
              alt="SAGE Academy team with students"
              fill
              preload
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sage-secondary/90 via-sage-secondary/45 to-transparent p-5 text-white sm:p-7">
              <p className="max-w-md break-words text-base font-bold leading-7 sm:text-lg">
                ভর্তি প্রক্রিয়ায় প্রয়োজনীয় তথ্য দিন, বাকিটা আমাদের টিম দ্রুত গাইড করবে।
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-lg border border-sage-red-100 bg-white shadow-sm"
        >
          <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
            <div className="border-b border-sage-red-100 bg-sage-red-50/60 px-5 py-5 sm:px-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-primary text-sage-white">
                  <HeartHandshake size={20} />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-sage-primary">
                    {admissionGuardianNote.eyebrow}
                  </p>
                  <h3 className="text-xl font-bold text-sage-secondary">
                    {admissionGuardianNote.greeting}
                  </h3>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-white px-4 py-2.5 text-center text-sm font-bold text-sage-secondary ring-1 ring-sage-red-100">
                {admissionGuardianNote.welcome}
              </p>
            </div>

            <div className="bg-white px-5 py-5 sm:px-6">
              <div className="grid gap-4 md:grid-cols-3">
                {admissionGuardianNote.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm font-medium leading-7 text-sage-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-bold text-sage-gray-500 sm:text-[14px] sm:uppercase sm:tracking-wider">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin size={12} className="shrink-0 text-sage-primary" />
                  {admissionGuardianNote.address}
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Phone size={12} className="shrink-0 text-sage-primary" />
                  {admissionGuardianNote.phone}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-28"
          >
            <div className="rounded-lg border border-sage-red-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-black text-sage-secondary">
                ভর্তি করার আগে যা জানা দরকার
              </h2>
              <p className="mt-3 text-sm leading-7 text-sage-gray-700">
                অনলাইনে কয়েকটি জরুরি তথ্য দিলেই আবেদন জমা হবে। চাইলে PDF ফর্ম ডাউনলোড করে হাতে পূরণ করেও আপলোড করতে পারবেন।
              </p>
              <div className="mt-6 space-y-5">
                {admissionHighlights.map((item) => (
                  <AdmissionHighlightItem key={item.title} {...item} />
                ))}
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AdmissionForm />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
