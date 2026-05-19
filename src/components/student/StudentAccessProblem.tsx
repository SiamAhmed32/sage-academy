import Link from "next/link";
import { ShieldAlert } from "lucide-react";

const messages: Record<string, string> = {
  "missing-phone": "আপনার অ্যাকাউন্টে মোবাইল নম্বর নেই, তাই ভর্তি রেকর্ডের সাথে মিল করা যাচ্ছে না।",
  "not-found": "আপনার মোবাইল নম্বর দিয়ে কোনো সক্রিয় ভর্তি শিক্ষার্থী পাওয়া যায়নি।",
  multiple: "এই মোবাইল নম্বরের সাথে একাধিক শিক্ষার্থী পাওয়া গেছে। অফিস থেকে সঠিক প্রোফাইল লিংক করতে হবে।",
};

export function StudentAccessProblem({ problem }: { problem: string }) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-sage-border bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-red-50 text-sage-primary">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-black text-sage-secondary">ড্যাশবোর্ড চালু হয়নি</h1>
      <p className="mt-3 text-sm leading-7 text-sage-gray-600">
        {messages[problem] ?? messages["not-found"]} অনুগ্রহ করে অফিসে যোগাযোগ করুন।
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-sage-primary px-6 py-3 text-sm font-bold text-white hover:bg-sage-primary-hover"
      >
        হোমে ফিরুন
      </Link>
    </section>
  );
}
