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
      <h1 className="mt-5 text-3xl font-bold leading-tight text-sage-secondary sm:text-4xl lg:text-5xl">
        {titleStart}
        {titleAccent ? <span className="block text-sage-primary">{titleAccent}</span> : null}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-sage-gray-700 sm:text-lg">
        {description}
      </p>
    </div>
  );
}
