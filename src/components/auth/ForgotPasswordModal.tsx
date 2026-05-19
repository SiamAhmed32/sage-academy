"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const resetState = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsPending(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast.error("ইমেইল দিন");

    setIsPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "সমস্যা হয়েছে");

      toast.success(data.message);
      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "সাময়িক সমস্যা হয়েছে";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("৬ ডিজিটের OTP দিন");
    setStep(3);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("পাসওয়ার্ড মেলেনি");
    if (password.length < 8) return toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");

    setIsPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "সমস্যা হয়েছে");

      toast.success(data.message);
      setStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "সাময়িক সমস্যা হয়েছে";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-sage-secondary">পাসওয়ার্ড ভুলে গেছেন?</DialogTitle>
                <DialogDescription className="pt-2">আপনার ইমেইল ঠিকানাটি দিন। আমরা একটি OTP পাঠিয়ে দেব।</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendOTP} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>ইমেইল ঠিকানা</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-sage-gray-500" />
                    <Input type="email" placeholder="example@gmail.com" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="flex justify-end items-center gap-3">
                  <Button type="button" variant="ghost" onClick={handleClose} className="h-11 px-6 font-semibold text-sage-gray-500 hover:text-sage-primary hover:bg-sage-red-50/50 rounded-xl">
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={isPending} className="bg-sage-primary hover:bg-sage-primary-hover h-11 px-6 font-bold rounded-xl shadow-lg shadow-sage-red-100">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight size={18} className="mr-2" />} OTP পাঠান
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-sage-secondary">OTP ভেরিফাই করুন</DialogTitle>
                <DialogDescription className="pt-2">আপনার ইমেইলে ({email}) পাঠানো ৬ ডিজিটের কোডটি দিন।</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleVerifyOTP} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="text-center block">৬ ডিজিটের কোড</Label>
                  <Input type="text" maxLength={6} placeholder="123456" className="h-14 text-center text-2xl font-bold tracking-[0.5em]" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-sage-gray-500 hover:text-sage-primary">ইমেইল পরিবর্তন করুন</button>
                  <Button type="submit" className="bg-sage-primary hover:bg-sage-primary-hover h-11 px-8 font-bold rounded-xl shadow-lg shadow-sage-red-100">এগিয়ে যান</Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-sage-secondary">নতুন পাসওয়ার্ড</DialogTitle>
                <DialogDescription className="pt-2">আপনার নতুন পাসওয়ার্ডটি সেট করুন।</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResetPassword} className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>নতুন পাসওয়ার্ড</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sage-gray-500" />
                    <Input type={showPassword ? "text" : "password"} placeholder="********" className="pl-10 h-11 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-sage-gray-500 hover:text-sage-primary">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>নিশ্চিত করুন</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sage-gray-500" />
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="********" className="pl-10 h-11 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-sage-gray-500 hover:text-sage-primary">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-12 bg-sage-primary hover:bg-sage-primary-hover text-white font-bold rounded-xl shadow-lg shadow-sage-red-100">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "পাসওয়ার্ড আপডেট করুন"}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-sage-success-soft flex items-center justify-center text-sage-success shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-sage-secondary">সফল হয়েছে!</h2>
                <p className="text-sage-gray-500 text-sm">আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে। এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।</p>
              </div>
              <Button onClick={handleClose} className="w-full bg-sage-primary hover:bg-sage-primary/90 h-11">লগইন করুন</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
