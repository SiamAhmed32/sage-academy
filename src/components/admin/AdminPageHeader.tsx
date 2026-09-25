type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

// Shared by the older admin pages; uses the same heading as the new workspace.
export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <section className="page-heading">
      <div>
        <span className="eyebrow">Admin workspace</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="heading-actions">{action}</div> : null}
    </section>
  );
}
