type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-2 text-sm font-semibold text-sage-primary">
          Admin Panel
        </p>
        <h2 className="text-3xl font-bold text-sage-secondary">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-sage-gray-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
