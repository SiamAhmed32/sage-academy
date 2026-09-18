"use client";

import { useSyncExternalStore } from "react";
import { HelpCircle, X } from "lucide-react";

const GUIDE_STORAGE_KEY = "sage_admin_guide_dismissed";
const GUIDE_DISMISSED_EVENT = "sage-admin-guide-dismissed";

function subscribeToGuideState(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(GUIDE_DISMISSED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(GUIDE_DISMISSED_EVENT, onStoreChange);
  };
}

function getGuideVisibility() {
  return localStorage.getItem(GUIDE_STORAGE_KEY) === null;
}

function getServerGuideVisibility() {
  return false;
}

export function DashboardGuide() {
  const visible = useSyncExternalStore(
    subscribeToGuideState,
    getGuideVisibility,
    getServerGuideVisibility
  );

  const handleDismiss = () => {
    localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    window.dispatchEvent(new Event(GUIDE_DISMISSED_EVENT));
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
        How to use this dashboard today
      </div>
      <p className="text-xs sm:text-sm text-sage-gray-600 font-medium">
        Start by calling or messaging new leads on WhatsApp. Then review
        today&apos;s classes. Finally, check the admission funnel and visitor
        activity to see where interest is growing.
      </p>
    </section>
  );
}
