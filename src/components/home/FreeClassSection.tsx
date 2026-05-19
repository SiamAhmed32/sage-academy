"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle2, Gift, GraduationCap, Headphones, Loader2, PenLine, Sparkles, X } from "lucide-react";
import { toast } from "react-toastify";

import { Container } from "@/components/shared/Container";
import { freeClassOptions, freeClassSubjectSuggestions } from "@/constants/free-class";
import { cn } from "@/lib/utils";

type MeUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

function digitsOnly(raw: string, max = 11) {
  return raw.replace(/\D/g, "").slice(0, max);
}

export function FreeClassSection() {
  const [me, setMe] = useState<MeUser | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [classKey, setClassKey] = useState<string>(freeClassOptions[0]?.value ?? "6");
  const [otherClass, setOtherClass] = useState("");
  const [supplementPhone, setSupplementPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [mounted, setMounted] = useState(false);

  const registered = Boolean(me);
  const needsAccountPhone = registered && !me?.phone;
  const sessionReady = me !== undefined;

  const classLabel = useMemo(() => {
    if (classKey === "other") return otherClass.trim();
    const opt = freeClassOptions.find((o) => o.value === classKey);
    return opt?.label ?? "";
  }, [classKey, otherClass]);

  const resetForm = useCallback(() => {
    setGuestName("");
    setGuestPhone("");
    setClassKey(freeClassOptions[0]?.value ?? "6");
    setOtherClass("");
    setSupplementPhone("");
    setSubject("");
    setDone(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const user = json?.data?.user;
        setMe(user ?? null);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) resetForm();
    },
    [resetForm]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (registered) {
        if (classKey === "other" && otherClass.trim().length < 2) {
          toast.error("অন্যান্য শ্রেণী/বিষয়ে লিখুন");
          return;
        }
        const body: Record<string, string> = {
          mode: "registered",
          classLabel,
          subject: subject.trim(),
        };
        if (needsAccountPhone) body.phone = digitsOnly(supplementPhone);
        const res = await fetch("/api/free-class-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.message ?? "জমা দিতে সমস্যা হয়েছে");
          return;
        }
      } else {
        if (classKey === "other" && otherClass.trim().length < 2) {
          toast.error("অন্যান্য শ্রেণী/বিষয়ে লিখুন");
          return;
        }
        const res = await fetch("/api/free-class-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "guest",
            name: guestName.trim(),
            phone: guestPhone,
            classLabel,
            subject: subject.trim(),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.message ?? "জমা দিতে সমস্যা হয়েছে");
          return;
        }
      }
      setDone(true);
      toast.success("আবেদন জমা হয়েছে! শীঘ্রই যোগাযোগ করব।");
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    registered,
    needsAccountPhone,
    guestName,
    guestPhone,
    classKey,
    otherClass,
    classLabel,
    subject,
    supplementPhone,
  ]);

  const guestValid =
    guestName.trim().length >= 2 &&
    digitsOnly(guestPhone).length === 11 &&
    subject.trim().length >= 2 &&
    (classKey !== "other" || otherClass.trim().length >= 2);

  const registeredValid =
    subject.trim().length >= 2 &&
    (classKey !== "other" || otherClass.trim().length >= 2) &&
    (!needsAccountPhone || digitsOnly(supplementPhone).length === 11);

  const canSubmit = registered ? registeredValid : guestValid;

  return (
    <section
      id="free-class"
      className="relative scroll-mt-24 overflow-hidden border-y border-sage-warm-border bg-sage-cream py-14 sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,var(--color-sage-cream)_0%,var(--color-sage-cream-deep)_42%,#fff_42%,#fff_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:radial-gradient(#7a1015_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-28 w-full bg-gradient-to-b from-white/80 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-16 hidden h-44 w-44 rotate-12 rounded-[2rem] border-[18px] border-sage-gold/25 md:block" />
      <div className="pointer-events-none absolute bottom-12 right-8 hidden h-32 w-32 rotate-45 rounded-[2rem] bg-sage-primary/10 lg:block" />

      <Container className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Copy + CTA (left on large screens) */}
          <div className="text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-sage-secondary px-4 py-2 text-sm font-black text-white shadow-lg shadow-sage-primary/20 ring-1 ring-white/50">
              <Sparkles className="h-4 w-4 shrink-0 text-sage-gold" />
              <span>একদিন · সম্পূর্ণ ফ্রি · শিক্ষক যাচাই</span>
            </p>

            <h2 className="mt-7 max-w-3xl text-balance text-[2.6rem] font-black leading-[1.08] tracking-[-0.01em] text-sage-secondary sm:mt-8 sm:text-5xl lg:text-6xl">
              আগে ক্লাসে বসুন,
              <span className="relative mt-2 block w-fit text-sage-primary">
                তারপর সিদ্ধান্ত নিন
                <span className="absolute -bottom-2 left-0 h-3 w-full rounded-full bg-sage-gold/35" />
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-sage-gray-700 sm:text-xl sm:leading-9">
              একজন ভালো শিক্ষক শুধু পড়ান না, শিক্ষার্থীর ভয় কমান, অভ্যাস ঠিক করেন, আর লক্ষ্যটা পরিষ্কার করে দেন। SAGE Academy-তে সেই অভিজ্ঞতাই আগে দেখে নিন।
            </p>

            <div className="mt-7 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-sage-warm-border bg-white shadow-sm">
              {[
                ["লাইভ", "শিক্ষক"],
                ["সিলেবাস", "ম্যাপিং"],
                ["পরিকল্পনা", "পরামর্শ"],
              ].map(([top, bottom]) => (
                <div key={top} className="border-r border-sage-warm-border px-3 py-4 text-center last:border-r-0 sm:px-5">
                  <p className="text-base font-black text-sage-secondary sm:text-xl">{top}</p>
                  <p className="mt-1 text-xs font-bold text-sage-gray-500 sm:text-sm">{bottom}</p>
                </div>
              ))}
            </div>

            <ul className="mt-7 max-w-2xl space-y-3 sm:space-y-4">
              {[
                { t: "প্রথম ক্লাসেই বোঝা যাবে শিক্ষক কীভাবে দুর্বল জায়গা ধরেন", Icon: Headphones },
                { t: "শ্রেণি ও বিষয়ের উপর ভিত্তি করে ছোট কিন্তু স্পষ্ট শেখার পরিকল্পনা", Icon: PenLine },
                { t: "ভর্তি নেওয়ার আগে অভিভাবক ও শিক্ষার্থী দুজনেরই নিশ্চিন্ত সিদ্ধান্ত", Icon: CheckCircle2 },
              ].map(({ t, Icon }, i) => (
                <li
                  key={t}
                  className="group flex gap-3 rounded-2xl border border-sage-warm-border bg-white/95 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sage-gold hover:shadow-md sm:px-5 sm:py-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-gold-soft ring-1 ring-sage-warm-ring transition group-hover:bg-sage-primary group-hover:ring-sage-primary">
                    <Icon className="h-5 w-5 text-sage-primary transition group-hover:text-white" />
                  </span>
                  <span className="pt-1.5 text-sm font-semibold text-sage-secondary sm:text-base">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 sm:mt-9">
              <button
                type="button"
                disabled={!sessionReady}
                onClick={() => sessionReady && setOpen(true)}
                className={cn(
                  "inline-flex h-14 min-h-[3.5rem] w-full max-w-md items-center justify-center gap-2 rounded-2xl px-7 text-base font-black text-white shadow-xl transition sm:w-auto",
                  sessionReady
                    ? "bg-sage-secondary shadow-sage-secondary/25 hover:scale-[1.02] hover:bg-sage-primary active:scale-[0.99]"
                    : "cursor-not-allowed bg-sage-gray-300 shadow-none"
                )}
              >
                {!sessionReady ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    লোড হচ্ছে…
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5 shrink-0" />
                    ফ্রি ক্লাসের জন্য আবেদন করুন
                  </>
                )}
              </button>

              {mounted &&
                createPortal(
                  <AnimatePresence>
                    {open && (
                      <div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
                        role="presentation"
                      >
                        <motion.button
                          type="button"
                          aria-label="মডাল বন্ধ করুন"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 bg-black/45"
                          onClick={() => onOpenChange(false)}
                        />
                        <motion.div
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="free-class-dialog-title"
                          initial={{ opacity: 0, scale: 0.96, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 8 }}
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="relative flex max-h-[min(92dvh,680px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-sage-border bg-white shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sage-secondary shadow ring-1 ring-sage-border transition hover:bg-sage-red-50 hover:text-sage-primary"
                            aria-label="বন্ধ করুন"
                          >
                            <X className="h-5 w-5" />
                          </button>

                          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <div className="shrink-0 border-b border-sage-border bg-sage-red-50/50 px-5 py-4 pr-14 text-left sm:px-6 sm:py-5 sm:pr-16">
                              <h2
                                id="free-class-dialog-title"
                                className="text-lg font-black text-sage-secondary sm:text-xl"
                              >
                                ফ্রি এক্সপেরিয়েন্স ক্লাস
                              </h2>
                              <p className="mt-1 text-sm text-sage-gray-600">
                                {registered
                                  ? "শ্রেণী ও বিষয় লিখে জমা দিন—আমরা শীঘ্রই যোগাযোগ করব।"
                                  : "নাম, মোবাইল, শ্রেণী ও বিষয় দিন—আমরা শীঘ্রই যোগাযোগ করব।"}
                              </p>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
                              {done ? (
                                <div className="space-y-5 py-2 text-center">
                                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="h-9 w-9" />
                                  </div>
                                  <h3 className="text-lg font-black text-sage-secondary">আবেদন গ্রহণ হয়েছে</h3>
                                  <p className="text-sm text-sage-gray-600">
                                    টিম খুব শীঘ্রই WhatsApp বা কলে নিশ্চিত করবে।
                                  </p>
                                </div>
                              ) : registered ? (
                                <div className="space-y-5 text-left">
                                  <div className="rounded-2xl bg-sage-red-50/50 p-4 ring-1 ring-sage-border/60">
                                    <p className="text-xs font-bold uppercase tracking-wider text-sage-gray-500">অ্যাকাউন্ট</p>
                                    <p className="mt-1 font-bold text-sage-secondary">{me!.name}</p>
                                    <p className="mt-1 text-sm text-sage-gray-600">
                                      {me!.phone ? (
                                        <span className="font-mono font-semibold">{maskPhone(me!.phone)}</span>
                                      ) : (
                                        <span className="text-amber-700">
                                          অ্যাকাউন্টে মোবাইল নেই—নম্বর দিন, তারপর নিচের জমা দিন বাটন চাপুন
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {needsAccountPhone && (
                                    <label className="block space-y-2">
                                      <span className="text-sm font-bold text-sage-secondary">
                                        মোবাইল নম্বর <span className="text-red-500">*</span>
                                      </span>
                                      <input
                                        type="tel"
                                        inputMode="numeric"
                                        autoComplete="tel"
                                        placeholder="০১১২৩৪৫৬৭৮৯০"
                                        value={supplementPhone}
                                        onChange={(e) => setSupplementPhone(digitsOnly(e.target.value))}
                                        className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 font-mono text-sm outline-none ring-sage-primary/30 focus:border-sage-primary focus:ring-2"
                                      />
                                      <span className="text-xs text-sage-gray-500">১১ ডিজিট, ০১ দিয়ে শুরু</span>
                                    </label>
                                  )}

                                  <label className="block space-y-2">
                                    <span className="text-sm font-bold text-sage-secondary">
                                      শ্রেণী / বছর <span className="text-red-500">*</span>
                                    </span>
                                    <select
                                      value={classKey}
                                      onChange={(e) => setClassKey(e.target.value)}
                                      className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/25"
                                    >
                                      {freeClassOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  {classKey === "other" && (
                                    <label className="block space-y-2">
                                      <span className="text-sm font-bold text-sage-secondary">উল্লেখ করুন</span>
                                      <input
                                        type="text"
                                        value={otherClass}
                                        onChange={(e) => setOtherClass(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary"
                                        placeholder="যেমন: বৃত্তি পরীক্ষা / ভার্সিটি প্রস্তুতি"
                                      />
                                    </label>
                                  )}

                                  <label className="block space-y-2">
                                    <span className="text-sm font-bold text-sage-secondary">
                                      বিষয় <span className="text-red-500">*</span>
                                    </span>
                                    <input
                                      list="free-class-subjects-reg"
                                      type="text"
                                      placeholder="যে বিষয়ে ফ্রি ক্লাস চান"
                                      value={subject}
                                      onChange={(e) => setSubject(e.target.value)}
                                      className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/25"
                                    />
                                    <datalist id="free-class-subjects-reg">
                                      {freeClassSubjectSuggestions.map((s) => (
                                        <option key={s} value={s} />
                                      ))}
                                    </datalist>
                                  </label>
                                </div>
                              ) : (
                                <div className="space-y-5 text-left">
                                  <label className="block space-y-2">
                                    <span className="text-sm font-bold text-sage-secondary">
                                      পূর্ণ নাম <span className="text-red-500">*</span>
                                    </span>
                                    <input
                                      type="text"
                                      autoComplete="name"
                                      value={guestName}
                                      onChange={(e) => setGuestName(e.target.value)}
                                      className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/25"
                                      placeholder="আপনার নাম"
                                    />
                                  </label>

                                  <label className="block space-y-2">
                                    <span className="text-sm font-bold text-sage-secondary">
                                      মোবাইল নম্বর <span className="text-red-500">*</span>
                                    </span>
                                    <input
                                      type="tel"
                                      inputMode="numeric"
                                      autoComplete="tel"
                                      placeholder="০১১২৩৪৫৬৭৮৯০"
                                      value={guestPhone}
                                      onChange={(e) => setGuestPhone(digitsOnly(e.target.value))}
                                      className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 font-mono text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/25"
                                    />
                                    <span className="text-xs text-sage-gray-500">১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর</span>
                                  </label>

                                  <label className="block space-y-2">
                                    <span className="text-sm font-bold text-sage-secondary">
                                      শ্রেণী / বছর <span className="text-red-500">*</span>
                                    </span>
                                    <select
                                      value={classKey}
                                      onChange={(e) => setClassKey(e.target.value)}
                                      className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/25"
                                    >
                                      {freeClassOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  {classKey === "other" && (
                                    <label className="block space-y-2">
                                      <span className="text-sm font-bold text-sage-secondary">উল্লেখ করুন</span>
                                      <input
                                        type="text"
                                        value={otherClass}
                                        onChange={(e) => setOtherClass(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary"
                                        placeholder="যেমন: বৃত্তি পরীক্ষা / ভার্সিটি প্রস্তুতি"
                                      />
                                    </label>
                                  )}

                                  <label className="block space-y-2">
                                    <span className="text-sm font-bold text-sage-secondary">
                                      বিষয় <span className="text-red-500">*</span>
                                    </span>
                                    <input
                                      list="free-class-subjects-guest"
                                      type="text"
                                      value={subject}
                                      onChange={(e) => setSubject(e.target.value)}
                                      className="h-12 w-full rounded-xl border border-sage-border bg-white px-4 text-sm outline-none focus:border-sage-primary focus:ring-2 focus:ring-sage-primary/25"
                                      placeholder="যে বিষয়ে ফ্রি ক্লাস চান"
                                    />
                                    <datalist id="free-class-subjects-guest">
                                      {freeClassSubjectSuggestions.map((s) => (
                                        <option key={s} value={s} />
                                      ))}
                                    </datalist>
                                  </label>

                                  <p className="text-center text-xs text-sage-gray-500">
                                    ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                                    <a
                                      href="/login"
                                      className="font-bold text-sage-primary underline-offset-2 hover:underline"
                                    >
                                      লগইন করুন
                                    </a>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative z-20 shrink-0 border-t border-sage-border bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:px-6 sm:pt-4">
                            {done ? (
                              <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="h-12 w-full rounded-xl bg-sage-secondary text-sm font-bold text-white transition hover:bg-sage-primary"
                              >
                                বন্ধ করুন
                              </button>
                            ) : (
                              <>
                                {!canSubmit && (
                                  <p className="mb-3 text-center text-sm font-semibold text-amber-800">
                                    {registered
                                      ? needsAccountPhone && digitsOnly(supplementPhone).length !== 11
                                        ? "11 ডিজিটের মোবাইল, তারপর বিষয় লিখে জমা দিন।"
                                        : "বিষয় লিখে জমা দিন।"
                                      : "নাম, ১১ ডিজিটের মোবাইল ও বিষয় পূরণ করুন।"}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  onClick={submit}
                                  disabled={submitting || !canSubmit}
                                  className={cn(
                                    "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-black text-white shadow-md transition",
                                    submitting || !canSubmit
                                      ? "cursor-not-allowed bg-slate-400"
                                      : "bg-sage-secondary shadow-sage-secondary/25 hover:bg-sage-primary"
                                  )}
                                >
                                  {submitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <Gift className="h-5 w-5 shrink-0" />
                                  )}
                                  জমা দিন
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>,
                  document.body
                )}
            </div>
          </div>

          {/* Premium academy visual */}
          <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="absolute -left-5 top-9 hidden h-[82%] w-[72%] -rotate-6 rounded-[2.2rem] bg-sage-secondary lg:block" />
            <div className="absolute -right-4 -top-4 hidden h-28 w-28 rounded-[2rem] bg-sage-gold shadow-lg shadow-sage-gold/20 sm:block" />
            <div className="absolute -bottom-5 left-10 hidden h-24 w-24 rounded-full border-[16px] border-sage-gold/45 sm:block" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-sage-primary p-3 shadow-2xl shadow-sage-secondary/25 sm:p-4">
              <div className="relative overflow-hidden rounded-[1.35rem] bg-sage-secondary">
                <div className="relative aspect-[4/3] w-full sm:aspect-[16/11] lg:aspect-[5/4] lg:min-h-[min(560px,64vh)]">
                  <Image
                    src="/sagePictures/libraryP.jpg"
                    alt="SAGE Academy লাইব্রেরিতে শিক্ষক ও শিক্ষার্থীর গাইডলাইন সেশন"
                    fill
                    className="object-cover object-[48%_center] saturate-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    priority={false}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-sage-secondary/60 via-sage-secondary/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                {/* SAGE LIVE CLASS — dark glass pill */}
                <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-black tracking-wider text-white shadow-lg backdrop-blur-xl sm:left-5 sm:top-5">
                  SAGE LIVE CLASS
                </div>

                {/* Senior teacher note — frosted dark glass card */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-black/35 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-[360px] sm:p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sage-gold">Senior teacher note</p>
                  <p className="mt-2 text-lg font-black leading-snug text-white">
                    “যে ক্লাসে প্রশ্ন করার সাহস বাড়ে, সেই ক্লাসেই শেখা শুরু হয়।”
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Foundation", Icon: BookOpen },
                { label: "Mentorship", Icon: GraduationCap },
                { label: "Confidence", Icon: Sparkles },
              ].map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-lg shadow-sage-secondary/10 backdrop-blur-lg transition hover:bg-white hover:shadow-xl">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-primary text-white shadow-md shadow-sage-primary/25">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-black text-sage-secondary">{label}</span>
                </div>
              ))}
            </div>

            {/* 1:1 floating stat — dark glass */}
            <div className="absolute -right-2 top-28 hidden w-32 overflow-hidden rounded-2xl border border-white/20 bg-black/30 p-3 text-center shadow-2xl shadow-black/20 backdrop-blur-xl xl:block">
              <p className="text-2xl font-black text-white">১:১</p>
              <p className="mt-1 text-xs font-bold leading-4 text-white/75">দুর্বল জায়গা ধরার গাইডলাইন</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function maskPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length !== 11) return p;
  return `${d.slice(0, 5)}••••${d.slice(-3)}`;
}
