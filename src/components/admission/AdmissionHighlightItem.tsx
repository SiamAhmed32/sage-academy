type AdmissionHighlightItemProps = {
  number: string;
  title: string;
  description: string;
};

export function AdmissionHighlightItem({
  number,
  title,
  description,
}: AdmissionHighlightItemProps) {
  return (
    <article className="rounded-lg border border-sage-red-100 bg-[#fffafa] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-primary text-sm font-bold text-white">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-sage-secondary">{title}</h3>
          <p className="mt-1.5 text-sm leading-7 text-sage-gray-700">{description}</p>
        </div>
      </div>
    </article>
  );
}
