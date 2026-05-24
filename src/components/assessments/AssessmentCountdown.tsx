"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  targetDate: string | Date;
  theme?: "light" | "dark";
};

export function AssessmentCountdown({ targetDate, theme = "light" }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) return null;

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const tick = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(tick);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black ring-1 ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' : 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>রেজিস্ট্রেশন চলছে ও পরীক্ষা চলমান!</span>
      </div>
    );
  }

  const formatNum = (n: number) => String(n).padStart(2, '0');
  const formatBangla = (n: number) => formatNum(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

  const textColor = theme === 'dark' ? 'text-white' : 'text-sage-secondary';
  const labelColor = theme === 'dark' ? 'text-sage-gold' : 'text-sage-primary';
  const bgColor = theme === 'dark' ? 'bg-white/10 border-white/20' : 'bg-sage-primary/5 border-sage-primary/10';

  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl px-5 py-2.5 border ${bgColor} backdrop-blur-md shadow-lg`}>
      <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${labelColor}`}>
        <Clock className="h-4 w-4 animate-pulse" />
        শুরু হতে বাকি:
      </span>
      <div className={`flex items-center gap-1.5 text-base font-black tracking-tight ${textColor}`}>
        <span className="flex flex-col items-center leading-none">
          {formatBangla(timeLeft.days)}
          <span className="text-[10px] font-bold opacity-80 mt-0.5">দিন</span>
        </span>
        <span className="opacity-40 font-bold mb-3">:</span>
        <span className="flex flex-col items-center leading-none">
          {formatBangla(timeLeft.hours)}
          <span className="text-[10px] font-bold opacity-80 mt-0.5">ঘণ্টা</span>
        </span>
        <span className="opacity-40 font-bold mb-3">:</span>
        <span className="flex flex-col items-center leading-none">
          {formatBangla(timeLeft.minutes)}
          <span className="text-[10px] font-bold opacity-80 mt-0.5">মিনিট</span>
        </span>
        <span className="opacity-40 font-bold mb-3">:</span>
        <span className="flex flex-col items-center leading-none text-[#e11d48]">
          {formatBangla(timeLeft.seconds)}
          <span className="text-[10px] font-bold opacity-80 mt-0.5">সেকেন্ড</span>
        </span>
      </div>
    </div>
  );
}
