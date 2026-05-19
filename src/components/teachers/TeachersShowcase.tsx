"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Users, 
  CalendarCheck, 
  BookOpenCheck, 
  Headset, 
  PhoneCall
} from "lucide-react";

import { Container } from "@/components/shared/Container";
import { TeacherProfileCard } from "@/components/teachers/TeacherProfileCard";
import type { Teacher } from "@/types/teacher";

export function TeachersShowcase() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const response = await fetch("/api/teachers");
        const data = await response.json();
        if (data.success) {
          setTeachers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeachers();
  }, []);

  return (
    <main className="bg-background selection:bg-secondary selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
            <div className="w-full md:w-1/2 z-10 text-center md:text-left">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-bold text-sage-primary sm:text-5xl lg:text-6xl leading-tight"
              >
                আমাদের শিক্ষকবৃন্দ
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-lg text-sage-gray-700 sm:text-xl font-medium"
              >
                অভিজ্ঞ ও দায়িত্বশীল শিক্ষকদের গাইডলাইনে নিয়মিত একাডেমিক কেয়ার
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-10 flex flex-wrap justify-center md:justify-start gap-4"
              >
                <button className="bg-sage-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-sage-secondary transition-all hover:scale-105 active:scale-95">
                  ভর্তি আবেদন
                </button>
                <button className="bg-white text-sage-primary border border-sage-primary/20 px-8 py-3.5 rounded-full font-bold hover:bg-sage-red-50 transition-all">
                  যোগাযোগ করুন
                </button>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full md:w-1/2 relative h-[300px] sm:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(109,15,18,0.15)] ring-1 ring-sage-red-100"
            >
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYkaITCX_sF6IcmHGNGDQThf-yTXAvZ7GxOSa0ataUqc90A82GW8WCVC3-GLxt1a4LFuiIXpRMTnKTPagJAG08aZEHbFvlYfPcrfcAMM2RC0KI7A0G-HHDalIXQrvMNaWvjne3yglUe2AhoChg_nkfvS0RwmGWPq6hj2gAA9f7W3irlmXwNgaVqJuZeni4yUqra2Ozu7FfObtUWB4qBxafRJuUrFgZD_kalyPfYmyCkHY9ly1lhGkqci9D5vo-9W0HS1Xlqk346wc"
                alt="SAGE Academy Teachers"
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </div>
        </Container>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-red-100/30 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sage-red-50/50 rounded-full blur-[80px] -ml-40 -mb-40" />
      </section>

      {/* Trust Strip */}
      <section className="bg-white py-8 border-y border-sage-red-100/50">
        <Container>
          <div className="flex flex-wrap justify-center lg:justify-between items-center gap-8 md:gap-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-red-50 text-sage-primary">
                <Users size={20} />
              </div>
              <span className="font-bold text-sage-secondary">১৫+ অভিজ্ঞ শিক্ষক</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-red-50 text-sage-primary">
                <CalendarCheck size={20} />
              </div>
              <span className="font-bold text-sage-secondary">নিয়মিত ক্লাস</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-red-50 text-sage-primary">
                <BookOpenCheck size={20} />
              </div>
              <span className="font-bold text-sage-secondary">সাপ্তাহিক পরীক্ষা</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-red-50 text-sage-primary">
                <Headset size={20} />
              </div>
              <span className="font-bold text-sage-secondary">ডাউট সলভিং সাপোর্ট</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Teacher Grid Section */}
      <section className="py-20 sm:py-24 bg-sage-red-50/30">
        <Container>
          <div className="mb-16 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-sage-primary sm:text-4xl"
            >
              বিশেষ শিক্ষক প্যানেল
            </motion.h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 64 }}
              viewport={{ once: true }}
              className="h-1.5 bg-sage-primary mx-auto mt-4 rounded-full" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
              ))
            ) : teachers.length > 0 ? (
              teachers.map((teacher, index) => (
                <TeacherProfileCard key={teacher._id} teacher={teacher} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-sage-gray-500">
                কোনো শিক্ষক তথ্য পাওয়া যায়নি।
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20 sm:py-24 border-t border-sage-red-100/50">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-sage-primary sm:text-4xl leading-tight"
            >
              আপনার সন্তানের জন্য সঠিক গাইডলাইন খুঁজছেন?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-lg text-sage-gray-700"
            >
              আজই আমাদের অভিজ্ঞ শিক্ষক প্যানেলের সাথে যুক্ত হোন এবং আপনার সন্তানের উজ্জ্বল ভবিষ্যৎ নিশ্চিত করুন।
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <button className="w-full sm:w-auto bg-sage-primary text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-sage-secondary transition-all hover:scale-105">
                ভর্তি আবেদন
              </button>
              <button className="w-full sm:w-auto bg-white text-sage-secondary border border-sage-red-100 px-10 py-4 rounded-full font-bold hover:bg-sage-red-50 transition-all flex items-center justify-center gap-2.5">
                <PhoneCall size={20} />
                কল করুন
              </button>
            </motion.div>
          </div>
        </Container>
      </section>
    </main>
  );
}
