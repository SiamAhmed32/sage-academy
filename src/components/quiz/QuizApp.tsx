"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Loader2, Trophy, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";

import { getClassLabel, toBanglaDigits } from "@/constants/class-levels";

type Question = {
  _id: string;
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
};

type Props = {
  user?: { name: string; id: string } | null;
};

export function QuizApp({ user }: Props) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({ 
    name: user?.name || "", 
    phone: "", 
    classLevel: 6 
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // If user is logged in, we still need their phone if it's not in the auth session (it isn't)
  // But we skip name input if we have it

  const startQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !userData.name.trim()) return toast.error("আপনার নাম লিখুন");
    
    // Support +8801..., 8801..., and 01...
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(userData.phone)) {
      return toast.error("সঠিক মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)");
    }
    
    setStep(2);
    try {
      const res = await fetch(`/api/quiz/questions/${userData.classLevel}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "সার্ভারে সমস্যা হয়েছে।");
        setStep(1);
        return;
      }
      const list = Array.isArray(data?.data) ? data.data : [];
      if (list.length > 0) {
        setQuestions(list);
        setStep(3);
      } else {
        toast.error("এই শ্রেণীর জন্য কোনো কুইজ পাওয়া যায়নি।");
        setStep(1);
      }
    } catch (err) {
      console.error("Quiz Fetch Error:", err);
      toast.error("সার্ভারে সমস্যা হয়েছে");
      setStep(1);
    }
  };

  const handleAnswer = (optIndex: number) => {
    const nextAnswers = [...answers, optIndex];
    setAnswers(nextAnswers);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitQuiz(nextAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    setIsSubmitting(true);
    let score = 0;
    const submissionAnswers = finalAnswers.map((ansIdx, i) => {
      const isCorrect = questions[i].options[ansIdx].isCorrect;
      if (isCorrect) score++;
      return {
        question: questions[i]._id,
        selectedOptionIndex: ansIdx,
        isCorrect,
      };
    });

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        body: JSON.stringify({
          name: user?.name || userData.name,
          phone: userData.phone || "Logged In User",
          classLevel: userData.classLevel,
          answers: submissionAnswers,
          score,
          totalQuestions: questions.length,
          whatsappRequested: false,
        }),
      });
      if (res.ok) {
        setFinalScore(score);
        setStep(4);
      }
    } catch {
      toast.error("রেজাল্ট সেভ করা যায়নি");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-sage-secondary">
                {user ? `স্বাগতম, ${user.name}!` : "আপনার প্রস্তুতি যাচাই করুন"}
              </h2>
              <p className="mt-2 text-sage-gray-500 font-medium">কুইজ শুরু করতে নিচের তথ্যগুলো নিশ্চিত করুন</p>
            </div>
            
            <form onSubmit={startQuiz} className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!user && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-sage-secondary ml-1">আপনার নাম *</label>
                    <input 
                      required 
                      value={userData.name} 
                      onChange={e => setUserData({ ...userData, name: e.target.value })} 
                      className="w-full h-14 px-6 rounded-2xl border border-sage-red-100 bg-white outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all font-medium" 
                      placeholder="e.g. আবির আহমেদ" 
                    />
                  </div>
                )}
                
                <div className={`space-y-2 ${user ? 'col-span-2' : ''}`}>
                  <label className="text-sm font-bold text-sage-secondary ml-1">মোবাইল নম্বর *</label>
                  <input 
                    required 
                    type="tel" 
                    value={userData.phone} 
                    onChange={e => setUserData({ ...userData, phone: e.target.value })} 
                    className={`w-full h-14 px-6 rounded-2xl border bg-white outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all font-medium ${
                      userData.phone && !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(userData.phone) 
                        ? 'border-red-500 ring-1 ring-red-500' 
                        : 'border-sage-red-100'
                    }`} 
                    placeholder="017xxxxxxxx" 
                  />
                  {userData.phone && !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(userData.phone) && (
                    <p className="text-[10px] text-red-500 font-bold ml-2">Invalid Mobile Number! Correct: 017XXXXXXXX</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-sage-secondary ml-1">আপনার বর্তমান শ্রেণী *</label>
                <select 
                  value={userData.classLevel} 
                  onChange={e => setUserData({ ...userData, classLevel: parseInt(e.target.value) })} 
                  className="w-full h-14 px-6 rounded-2xl border border-sage-red-100 bg-white outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all font-bold text-sage-primary cursor-pointer"
                >
                  {[5,6,7,8,9,10,11,12].map(l => <option key={l} value={l}>{getClassLabel(l)}</option>)}
                </select>
              </div>
              
              <button 
                type="submit" 
                className="w-full h-16 mt-4 bg-sage-primary text-white rounded-2xl font-black text-lg hover:bg-sage-secondary transition-all flex items-center justify-center gap-2 shadow-xl shadow-sage-primary/10 active:scale-95"
              >
                কুইজ শুরু করুন <ChevronRight size={22} />
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-12 w-12 text-sage-primary animate-spin" />
            <p className="font-bold text-sage-secondary text-lg">আপনার জন্য প্রশ্নগুলো তৈরি করা হচ্ছে...</p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 py-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black text-sage-primary uppercase tracking-widest">Question {toBanglaDigits(currentIdx + 1)} of {toBanglaDigits(questions.length)}</span>
              <div className="h-2 w-40 bg-sage-red-100 rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} className="h-full bg-sage-primary" />
              </div>
            </div>
            
            <div className="space-y-8">
              <h3 className="text-2xl md:text-3xl font-black text-sage-secondary leading-tight text-center md:text-left">
                {questions[currentIdx].questionText}
              </h3>
              
              <div className="grid gap-4">
                {questions[currentIdx].options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(i)} className="w-full text-left p-6 rounded-[1.5rem] border-2 border-sage-red-100 bg-white hover:border-sage-primary hover:bg-sage-red-50/50 transition-all group relative">
                    <div className="flex items-center gap-5">
                      <span className="h-10 w-10 shrink-0 rounded-xl bg-sage-red-50 flex items-center justify-center text-lg font-black text-sage-primary group-hover:bg-sage-primary group-hover:text-white transition-all">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-bold text-lg text-sage-secondary leading-snug">{opt.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 py-6">
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded-[2rem] bg-sage-red-50 flex items-center justify-center text-sage-primary shadow-2xl shadow-sage-red-100">
                <Trophy size={64} className="animate-bounce" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="inline-block px-8 py-3 rounded-2xl bg-sage-primary/10 text-sage-primary font-black text-2xl">
                আপনার স্কোর: {toBanglaDigits(finalScore)}/{toBanglaDigits(questions.length)}
              </div>
              <p className="text-sage-gray-500 font-medium italic">নিচে আপনার উত্তরগুলো এবং সঠিক সমাধান দেখে নিন:</p>
            </div>
            
            <div className="space-y-6 text-left max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, i) => {
                const userAns = answers[i];
                const isCorrect = q.options[userAns].isCorrect;
                return (
                  <div key={q._id} className={`p-6 rounded-3xl border-2 ${isCorrect ? 'border-green-100 bg-green-50/20' : 'border-red-100 bg-red-50/20'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toBanglaDigits(i + 1)}
                      </span>
                      <div className="space-y-3">
                        <p className="font-bold text-sage-secondary leading-snug">{q.questionText}</p>
                        <div className="grid gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className={`text-sm px-3 py-2 rounded-lg flex items-center justify-between ${
                              opt.isCorrect ? 'bg-green-500/10 text-green-700 font-bold border border-green-200' : 
                              (userAns === optIdx && !isCorrect ? 'bg-red-500/10 text-red-700 font-bold border border-red-200' : 'text-sage-gray-400')
                            }`}>
                              <span>{opt.text}</span>
                              {opt.isCorrect && <CheckCircle2 size={14} />}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="mt-3 p-3 rounded-xl bg-white/50 border border-sage-red-50 text-xs text-sage-gray-600 italic">
                            <span className="font-bold text-sage-primary not-italic">ব্যাখ্যা:</span> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-6">
              <button onClick={() => window.location.reload()} className="h-14 px-10 rounded-2xl bg-sage-secondary text-white font-black hover:bg-sage-primary transition-all shadow-xl shadow-sage-secondary/10">
                আবার চেষ্টা করুন
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
