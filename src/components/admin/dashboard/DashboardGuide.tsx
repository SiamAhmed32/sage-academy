import { HelpCircle } from "lucide-react";

export function DashboardGuide() {
  return (
    <section className="rounded-xl border border-sage-red-100 bg-sage-red-50/60 p-4 text-sm leading-7 text-sage-gray-700 sm:p-5">
      <div className="mb-2 flex items-center gap-2 font-bold text-sage-secondary">
        <HelpCircle className="h-4 w-4 text-sage-primary" />
        আজ এই ড্যাশবোর্ড কীভাবে ব্যবহার করবেন
      </div>
      <p>
        প্রথমে নতুন লিডগুলোতে কল বা WhatsApp করুন। তারপর আজকের ক্লাস আছে কিনা
        দেখুন। শেষে ভর্তি ফানেল ও ভিজিটর অ্যাক্টিভিটি দেখে বুঝুন কোন জায়গায়
        বেশি আগ্রহ তৈরি হচ্ছে।
      </p>
    </section>
  );
}
