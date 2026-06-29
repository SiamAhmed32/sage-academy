"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, User, Phone } from "lucide-react";
import { toast } from "react-toastify";

import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";
import styles from "@/components/auth/AuthPanel.module.css";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

type Mode = "login" | "signup";

type AuthPanelProps = {
  initialMode?: Mode;
  redirectTo?: string;
};

type ApiAuthJson = {
  success: boolean;
  message: string;
  code?: string;
  data?: { user?: { phone?: string; role?: string } };
};

export function AuthPanel({ initialMode = "login", redirectTo }: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [isPending, setIsPending] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [loginState, setLoginState] = useState({
    identifier: "",
    password: "",
    phone: "",
  });
  const [loginNeedsPhone, setLoginNeedsPhone] = useState(false);

  const [signupState, setSignupState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const isSignup = mode === "signup";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup
        ? signupState
        : {
            identifier: loginState.identifier,
            password: loginState.password,
            ...(loginNeedsPhone && loginState.phone.trim()
              ? { phone: loginState.phone.trim() }
              : {}),
          };

      if (!isSignup && loginNeedsPhone && !loginState.phone.trim()) {
        toast.error("মোবাইল নম্বর দিন");
        setIsPending(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = (await res.json()) as ApiAuthJson;

      if (!res.ok || !data.success) {
        if (data.code === "PHONE_REQUIRED") {
          setLoginNeedsPhone(true);
          toast.error(data.message);
          return;
        }
        throw new Error(data.message || "Authentication failed");
      }

      setLoginNeedsPhone(false);
      toast.success(data.message);

      // Delay redirect slightly for toast visibility
      setTimeout(() => {
        const role = data.data?.user?.role;
        const defaultPath = ["manager", "admin", "super_admin"].includes(String(role)) ? "/admin" : "/student";
        router.push(redirectTo || defaultPath);
        router.refresh();
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "সাময়িক সমস্যা হয়েছে, আবার চেষ্টা করুন";
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-sage-white py-8 sm:py-10">
      <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-sage-red-50 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sage-red-100/70 blur-3xl" />

      <Container className="relative w-full">
        <div className={cn(styles.wrapper, isSignup && styles.toggled)}>
          <div className={styles.shapePrimary} />
          <div className={styles.shapeSecondary} />

          {/* Login Panel */}
          <div className={cn(styles.panel, styles.signinPanel)}>
            <h2 className={cn(styles.slideItem, "text-3xl font-bold text-sage-secondary")}>
              লগইন
            </h2>
            <p className={cn(styles.slideItem, "mt-2 text-sm leading-7 text-sage-gray-700")}>
              ইমেইল অথবা মোবাইল দিয়ে লগইন করুন। মোবাইল ০১… বা +৮৮০১… — দুটোই গ্রহণযোগ্য।
            </p>

            {loginNeedsPhone && (
              <p
                className={cn(
                  styles.slideItem,
                  "mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"
                )}
              >
                আপনার অ্যাকাউন্টে সঠিক মোবাইল নেই। নিচে বাংলাদেশি মোবাইল নম্বর দিন, তারপর আবার লগইন চাপুন।
              </p>
            )}

            <form onSubmit={handleSubmit} className={cn(styles.slideItem, "mt-4 space-y-4")}>
              <div className={styles.field}>
                <Mail size={16} className={styles.icon} />
                <input
                  type="text"
                  value={loginState.identifier}
                  onChange={(e) =>
                    setLoginState((prev) => ({ ...prev, identifier: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="ইমেইল অথবা ফোন নম্বর *"
                  required
                  disabled={loginNeedsPhone}
                  readOnly={loginNeedsPhone}
                  title={loginNeedsPhone ? "প্রথম ধাপে দেওয়া ইমেইল/ফোন" : undefined}
                />
              </div>

              {loginNeedsPhone && (
                <div className={styles.field}>
                  <Phone size={16} className={styles.icon} />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={loginState.phone}
                    onChange={(e) =>
                      setLoginState((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className={styles.input}
                    placeholder="মোবাইল (০১… বা +৮৮০১…) *"
                    required
                  />
                </div>
              )}

              <div className={styles.field}>
                <Lock size={16} className={styles.icon} />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginState.password}
                  onChange={(e) =>
                    setLoginState((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="পাসওয়ার্ড *"
                  required
                  disabled={loginNeedsPhone}
                  readOnly={loginNeedsPhone}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className={styles.eyeButton}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  disabled={loginNeedsPhone}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-sage-primary hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending || isSignup}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sage-primary text-sm font-semibold text-white transition hover:bg-sage-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && !isSignup && <Loader2 size={16} className="animate-spin" />}
                লগইন করুন
              </button>
            </form>

            <p className={cn(styles.slideItem, "mt-5 text-sm text-sage-gray-700")}>
              নতুন এখানে?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setLoginNeedsPhone(false);
                }}
                className={styles.switchLink}
              >
                সাইন আপ করুন
              </button>
            </p>
          </div>

          <div className={cn(styles.welcome, styles.welcomeSignin)}>
            <h3 className={cn(styles.slideItem, "text-4xl font-bold leading-tight")}>
              WELCOME
              <br />
              BACK!
            </h3>
            <p className={cn(styles.slideItem, "mt-4 text-sm leading-7 text-white/90")}>
              আপনার একাডেমিক যাত্রা চালিয়ে যেতে লগইন করুন।
            </p>
          </div>

          {/* Signup Panel */}
          <div className={cn(styles.panel, styles.signupPanel)}>
            <h2 className={cn(styles.slideItem, "text-3xl font-bold text-sage-secondary")}>
              সাইন আপ
            </h2>
            <p className={cn(styles.slideItem, "mt-2 text-sm leading-7 text-sage-gray-700")}>
              নতুন অ্যাকাউন্ট তৈরি করে শুরু করুন।
            </p>

            <form onSubmit={handleSubmit} className={cn(styles.slideItem, "mt-4 space-y-3")}>
              <div className={styles.field}>
                <User size={16} className={styles.icon} />
                <input
                  value={signupState.name}
                  onChange={(e) =>
                    setSignupState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="নাম *"
                  required
                />
              </div>

              <div className={styles.field}>
                <Mail size={16} className={styles.icon} />
                <input
                  type="email"
                  value={signupState.email}
                  onChange={(e) =>
                    setSignupState((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="ইমেইল *"
                  required
                />
              </div>

              <div className={styles.field}>
                <Phone size={16} className={styles.icon} />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={signupState.phone}
                  onChange={(e) =>
                    setSignupState((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="মোবাইল নম্বর (০১… বা +৮৮০১…) *"
                  required
                />
              </div>
              <p className="text-[11px] leading-relaxed text-sage-gray-500">
                শুধু বাংলাদেশি মোবাইল (০১৩–০১৯)। ভুয়া বা অন্য দেশের নম্বর গ্রহণ হবে না।
              </p>

              <div className={styles.field}>
                <Lock size={16} className={styles.icon} />
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupState.password}
                  onChange={(e) =>
                    setSignupState((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className={styles.input}
                  placeholder="পাসওয়ার্ড *"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword((prev) => !prev)}
                  className={styles.eyeButton}
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                >
                  {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending || !isSignup}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sage-primary text-sm font-semibold text-white transition hover:bg-sage-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && isSignup && <Loader2 size={16} className="animate-spin" />}
                অ্যাকাউন্ট তৈরি করুন
              </button>
            </form>

            <p className={cn(styles.slideItem, "mt-5 text-sm text-sage-gray-700")}>
              ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setLoginNeedsPhone(false);
                }}
                className={styles.switchLink}
              >
                লগইন করুন
              </button>
            </p>
          </div>

          <div className={cn(styles.welcome, styles.welcomeSignup)}>
            <h3 className={cn(styles.slideItem, "text-4xl font-bold leading-tight")}>
              WELCOME!
            </h3>
            <p className={cn(styles.slideItem, "mt-4 text-sm leading-7 text-white/90")}>
              নতুন অ্যাকাউন্ট তৈরি করে শেখার যাত্রা শুরু করুন।
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link href="/" className="text-sage-secondary font-medium hover:text-sage-primary transition-colors">
            হোমে ফিরে যান
          </Link>
        </div>
      </Container>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </section>
  );
}
