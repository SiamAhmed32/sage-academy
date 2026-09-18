import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const roles = [
  {
    title: "Super Admin",
    details: "Can manage all areas, update user roles, and control sensitive settings.",
  },
  {
    title: "Admin",
    details: "Has access to nearly all admin areas. Can manage admissions, batches, teachers, content, and every user role except super admin.",
  },
  {
    title: "Manager",
    details: "Can follow up on contacts and admissions and update statuses and notes, but cannot delete records or change roles.",
  },
  {
    title: "Student / Guardian",
    details: "Public account with no access to the admin panel.",
  },
];

export default function AdminRolesPage() {
  return (
    <div>
      <AdminPageHeader
        title="Role Guide"
        description="Production access rules for each user role."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <article key={role.title} className="rounded-xl border border-sage-border bg-white p-6">
            <h3 className="text-xl font-bold text-sage-secondary">{role.title}</h3>
            <p className="mt-3 text-sm leading-7 text-sage-gray-700">{role.details}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
