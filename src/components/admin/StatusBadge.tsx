import { cn } from "@/lib/utils";
import { getAdminStatusLabel } from "@/constants/admin-display";

type StatusBadgeProps = {
  value: string;
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
      {getAdminStatusLabel(value)}
    </span>
  );
}
