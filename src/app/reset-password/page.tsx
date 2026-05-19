"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const [step, setStep] = useState(1); // 1: Enter OTP, 2: New Password, 3: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("পাসওয়ার্ড মেলেনি");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setStep(3);
      toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "কিছু ভুল হয়েছে";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-sage-white flex flex-col items-center justify-center py-12 px-4">
      <Container className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-primary text-white shadow-xl">
            <GraduationCap size={32} />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-sage-red-100 p-8 shadow-2xl shadow-sage-red-100/30">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-sage-secondary">OTP ভেরিফাই করুন</h1>
                <p className="mt-2 text-sm text-sage-gray-500">আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি দিন</p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-sage-secondary ml-1">ইমেইল ঠিকানা</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full h-12 px-4 rounded-xl border border-sage-red-50 bg-sage-red-50/30 focus:outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-sage-secondary ml-1">OTP কোড</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full h-12 px-4 text-center text-2xl tracking-[0.5em] font-bold rounded-xl border border-sage-red-50 bg-sage-red-50/30 focus:outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all"
                  />
                </div>
                <button type="submit" className="w-full h-12 bg-sage-primary text-white rounded-xl font-bold hover:bg-sage-primary-hover transition-all flex items-center justify-center gap-2">
                  এগিয়ে যান <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-sage-secondary">নতুন পাসওয়ার্ড</h1>
                <p className="mt-2 text-sm text-sage-gray-500">আপনার নতুন পাসওয়ার্ডটি সেট করুন</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-sage-secondary ml-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-sage-red-50 bg-sage-red-50/30 focus:outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-sage-secondary ml-1">নিশ্চিত করুন</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-sage-red-50 bg-sage-red-50/30 focus:outline-none focus:ring-2 focus:ring-sage-primary/20 transition-all"
                  />
                </div>
                <button disabled={loading} type="submit" className="w-full h-12 bg-[#00D084] text-white rounded-xl font-bold hover:bg-[#00b875] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100">
                  {loading ? "প্রসেস হচ্ছে..." : "পাসওয়ার্ড আপডেট করুন"}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full text-sm font-semibold text-sage-gray-500 hover:text-sage-primary transition-colors">
                  পিছনে ফিরে যান
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <CheckCircle2 size={48} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-sage-secondary">অভিনন্দন!</h2>
                <p className="mt-2 text-sage-gray-500">আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।</p>
              </div>
              <button onClick={() => router.push("/")} className="w-full h-12 bg-sage-primary text-white rounded-xl font-bold hover:bg-sage-primary-hover transition-all">
                লগইন করুন
              </button>
            </motion.div>
          )}
        </div>
      </Container>
    </main>
  );
}
