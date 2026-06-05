"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";

export function DashboardGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("sage_admin_guide_dismissed");
    if (!isDismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("sage_admin_guide_dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <section className="relative rounded-2xl border border-sage-red-100 bg-sage-red-50/40 p-4 pr-10 text-sm leading-7 text-sage-gray-700 sm:p-5 sm:pr-12 shadow-sm">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-sage-gray-400 hover:bg-sage-red-100 hover:text-sage-primary transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="mb-2 flex items-center gap-2 font-extrabold text-sage-secondary">
        <HelpCircle className="h-4 w-4 text-sage-primary" />
        আজ এই ড্যাশবোর্ড কীভাবে ব্যবহার করবেন
      </div>
      <p className="text-xs sm:text-sm text-sage-gray-600 font-medium">
        প্রথমে নতুন লিডগুলোতে কল বা WhatsApp করুন। তারপর আজকের ক্লাস আছে কিনা
        দেখুন। শেষে ভর্তি ফানেল ও ভিজিটর অ্যাক্টিভিটি দেখে বুঝুন কোন জায়গায়
        বেশি আগ্রহ তৈরি হচ্ছে।
      </p>
    </section>
  );
}
