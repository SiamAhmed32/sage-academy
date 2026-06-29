export const BKASH_SEND_MONEY_NUMBER = "+8801629106190";
export const BKASH_SEND_MONEY_DISPLAY = "+880 1629-106190";

export const examDeliveryModes = ["online", "offline"] as const;
export const examOfflineTypes = ["weekly", "monthly"] as const;
export const examAccessTypes = ["public", "private"] as const;
export const examProgramStatuses = ["draft", "published", "hidden", "archived"] as const;

export const enrollmentPaymentStatuses = [
  "not_required",
  "pending",
  "submitted",
  "verified",
  "rejected",
] as const;

export const enrollmentStatuses = ["pending", "confirmed", "cancelled"] as const;

export type ExamDeliveryMode = (typeof examDeliveryModes)[number];
export type ExamOfflineType = (typeof examOfflineTypes)[number];
export type ExamAccessType = (typeof examAccessTypes)[number];

export const offlineTypeLabels: Record<ExamOfflineType, string> = {
  weekly: "সাপ্তাহিক পরীক্ষা",
  monthly: "মাসিক পরীক্ষা",
};

export const deliveryModeLabels: Record<ExamDeliveryMode, string> = {
  online: "অনলাইন পরীক্ষা",
  offline: "অফলাইন পরীক্ষা",
};

export const accessTypeLabels: Record<ExamAccessType, string> = {
  public: "পাবলিক",
  private: "প্রাইভেট (পেইড)",
};
