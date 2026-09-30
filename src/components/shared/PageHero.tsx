type PageHeroProps = {
  badge: string;
  titleStart: string;
  titleAccent?: string;
  description: string;
};

export function PageHero({
  badge,
  titleStart,
  titleAccent,
  description,
}: PageHeroProps) {
  return (
    <div className="max-w-3xl">
      <p className="inline-flex rounded-full bg-sage-white px-4 py-2 text-sm font-semibold text-sage-primary ring-1 ring-sage-red-100">
        {badge}
      </p>
      <h1 className="sage-page-title mt-5">
        {titleStart}
        {titleAccent ? <span className="block text-sage-primary">{titleAccent}</span> : null}
      </h1>
      <p className="sage-lead mt-5 max-w-2xl">
        {description}
      </p>
    </div>
  );
}
