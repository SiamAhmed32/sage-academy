import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { updateContactRequestAction } from "@/app/admin/actions";
import { contactStatusOptions } from "@/constants/admin";
import { toast } from "react-toastify";

type ContactDetailModalProps = {
  item: any;
  onClose: () => void;
};

export function ContactDetailModal({ item, onClose }: ContactDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleUpdate(formData: FormData) {
    setIsUpdating(true);
    try {
      await updateContactRequestAction(formData);
      toast.success("তথ্য আপডেট করা হয়েছে");
      onClose();
    } catch (error) {
      toast.error("আপডেট করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-sage-border px-6 py-4">
          <h3 className="text-xl font-bold text-sage-secondary">বার্তার বিস্তারিত</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-sage-gray-400 hover:bg-sage-red-50 hover:text-sage-primary">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sage-gray-500">প্রেরক</p>
              <p className="text-lg font-bold text-sage-secondary">{item.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sage-gray-500">মোবাইল</p>
              <p className="font-semibold text-sage-primary">{item.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sage-gray-500">বার্তা</p>
              <p className="mt-1 text-sm leading-6 text-sage-gray-700 whitespace-pre-wrap">{item.message}</p>
            </div>
            {(item.source ||
              item.utmCampaign ||
              item.utmSource ||
              item.attributionSubmitPath) && (
              <div className="rounded-xl border border-sage-border bg-sage-red-50/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-sage-gray-500">
                  উৎস / ক্যাম্পেইন (ট্র্যাকিং)
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-sage-gray-500">ফর্ম সোর্স</dt>
                    <dd className="font-medium text-sage-secondary">{item.source || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-sage-gray-500">utm_campaign</dt>
                    <dd className="max-w-[55%] text-right font-medium text-sage-secondary break-all">
                      {item.utmCampaign || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-sage-gray-500">utm_source / medium</dt>
                    <dd className="max-w-[55%] text-right text-xs font-medium text-sage-secondary break-all">
                      {[item.utmSource, item.utmMedium].filter(Boolean).join(" / ") || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-sage-gray-500">Submit path</dt>
                    <dd className="max-w-[55%] text-right text-xs font-mono text-sage-secondary break-all">
                      {item.attributionSubmitPath || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <form action={handleUpdate} className="space-y-4 border-t border-sage-border pt-6">
            <input type="hidden" name="id" value={item._id.toString()} />
            <div className="space-y-2">
              <label className="text-sm font-bold text-sage-secondary">স্ট্যাটাস আপডেট করুন</label>
              <select name="status" defaultValue={item.status} className="h-10 w-full rounded-lg border border-sage-border px-3 outline-none focus:ring-1 focus:ring-sage-primary">
                {contactStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-sage-secondary">অ্যাডমিন নোট (ঐচ্ছিক)</label>
              <textarea
                name="adminNote"
                defaultValue={item.adminNote}
                className="min-h-24 w-full rounded-lg border border-sage-border p-3 text-sm outline-none focus:ring-1 focus:ring-sage-primary"
                placeholder="পরবর্তী পদক্ষেপ বা নোট এখানে লিখুন..."
              />
            </div>
            <button 
              disabled={isUpdating}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-sage-primary text-sm font-bold text-white shadow-lg shadow-sage-primary/20 transition hover:bg-sage-secondary active:scale-[0.98] disabled:opacity-70"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  আপডেট হচ্ছে...
                </>
              ) : (
                "আপডেট সেভ করুন"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
