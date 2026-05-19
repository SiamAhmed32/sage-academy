import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  value: string;
};

const labels: Record<string, string> = {
  new: "নতুন",
  contacted: "যোগাযোগ হয়েছে",
  qualified: "যোগ্য",
  closed: "বন্ধ",
  spam: "স্প্যাম",
};

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        value === "new" && "bg-sage-red-50 text-sage-primary",
        value === "contacted" && "bg-blue-50 text-blue-700",
        value === "qualified" && "bg-emerald-50 text-emerald-700",
        value === "closed" && "bg-gray-100 text-gray-700",
        value === "spam" && "bg-orange-50 text-orange-700"
      )}
    >
      {labels[value] ?? value}
    </span>
  );
}
