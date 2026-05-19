import type { IconType } from "react-icons";

type AdmissionHighlightItemProps = {
  title: string;
  description: string;
  icon: IconType;
};

export function AdmissionHighlightItem({
  title,
  description,
  icon: Icon,
}: AdmissionHighlightItemProps) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-bold text-sage-secondary">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-sage-gray-700">{description}</p>
      </div>
    </div>
  );
}
