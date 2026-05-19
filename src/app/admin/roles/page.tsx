import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const roles = [
  {
    title: "Super Admin",
    details: "সবকিছু manage করবে, user role পরিবর্তন করবে, sensitive settings নিয়ন্ত্রণ করবে।",
  },
  {
    title: "Admin",
    details: "Admission, contact, batch, teacher, testimonial এবং website content manage করবে।",
  },
  {
    title: "Manager",
    details: "Contact/admission follow-up করবে, status ও note update করবে, delete বা role change করবে না।",
  },
  {
    title: "Student / Guardian",
    details: "Public account. Admin panel access থাকবে না।",
  },
];

export default function AdminRolesPage() {
  return (
    <div>
      <AdminPageHeader
        title="রোল গাইড"
        description="কোন user কতটুকু access পাবে তার production-safe rule."
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
