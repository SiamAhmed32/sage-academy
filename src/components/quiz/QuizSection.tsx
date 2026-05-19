"use client";

import { useState } from "react";
import { Container } from "@/components/shared/Container";
import { QuizApp } from "./QuizApp";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type Props = {
  user?: { name: string; id: string } | null;
};

export function QuizSection({ user }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      id="quiz"
      style={{
        paddingTop: '120px',
        paddingBottom: '120px',
        backgroundColor: 'white', // Using white for a clean, stable base
        position: 'relative',
        display: 'block',
        width: '100%'
      }}
      className="border-y border-sage-red-100/50"
    >
      <Container>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

          {/* Left Column: Text and Button */}
          <div className="w-full lg:w-3/5 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-sage-secondary leading-tight mb-8">
              বুঝতে পারছেন না কোথা থেকে শুরু করবেন?
            </h2>
            <p className="text-lg md:text-xl text-sage-gray-600 font-medium max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              চিন্তার কিছু নেই! আমাদের কুইজ সেগমেন্ট আপনাকে পৌঁছে দেবে সঠিক সিদ্ধান্তে। মাত্র ৫ মিনিটে নিজের প্রস্তুতির লেভেল যাচাই করুন।
            </p>

            <div className="flex justify-center lg:justify-start">
              <button
                onClick={() => setIsOpen(true)}
                style={{
                  paddingTop: '24px',
                  paddingBottom: '20px',
                  paddingLeft: '60px',
                  paddingRight: '60px',
                  lineHeight: '1'
                }}
                className="rounded-2xl bg-sage-secondary text-white font-black text-xl md:text-2xl hover:bg-sage-primary transition-all shadow-xl shadow-sage-secondary/20 hover:-translate-y-1 active:translate-y-0"
              >
                কুইজ শুরু করুন
              </button>
            </div>
          </div>

          {/* Right Column: Visual Card */}
          <div className="w-full lg:w-2/5 max-w-md">
            <div className="bg-sage-red-50/30 rounded-[3rem] border-2 border-sage-red-100 p-8 md:p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-md text-5xl">
                🎯
              </div>
              <p className="text-xl md:text-2xl font-black text-sage-secondary leading-snug">
                আপনার সঠিক ব্যাচ এবং গাইডলাইন খুঁজে নিন কুইজের মাধ্যমে।
              </p>
            </div>
          </div>

        </div>
      </Container>

      {/* Quiz Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-sage-secondary/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-sage-red-50 text-sage-secondary hover:bg-sage-primary hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-12">
                <QuizApp user={user} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
