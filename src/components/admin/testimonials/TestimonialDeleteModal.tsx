"use client";

type Props = {
  open: boolean;
  deleting: boolean;
  name?: string;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function TestimonialDeleteModal({ open, deleting, name, error, onClose, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-bold text-sage-secondary">টেস্টিমোনিয়াল ডিলিট করবেন?</h3>
        <p className="mt-2 text-sm text-sage-gray-700">
          {name ? `“${name}”` : "এই testimonial"} ডিলিট করলে এটি স্থায়ীভাবে মুছে যাবে।
        </p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-sage-border px-4 py-2 text-sm font-bold text-sage-secondary disabled:opacity-60"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {deleting ? "ডিলিট হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
