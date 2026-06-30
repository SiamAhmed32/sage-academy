import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserRoleRow } from "@/components/admin/users/UserRoleRow";
import { userRoleOptions } from "@/constants/admin";
import type { AuthRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { canManageUsers, assignableUserRoles, requireAdminPageUser } from "@/lib/rbac";
import User from "@/models/User";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAuthRole(value: string): value is AuthRole {
  return userRoleOptions.some((option) => option.value === value);
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentUser = await requireAdminPageUser();
  await connectDB();

  const q = getParam(params, "q").trim();
  const role = getParam(params, "role", "all");
  const status = getParam(params, "status", "all");
  const sort = getParam(params, "sort", "newest");
  const page = Math.max(1, Number(getParam(params, "page", "1")));

  const query: {
    role?: AuthRole;
    isActive?: boolean;
    $or?: Array<Record<string, { $regex: string; $options: string }>>;
  } = {};

  if (role !== "all" && isAuthRole(role)) {
    query.role = role;
  }
  if (status === "active") {
    query.isActive = true;
  } else if (status === "inactive") {
    query.isActive = false;
  }
  if (q) {
    const safe = escapeRegex(q);
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { phone: { $regex: safe, $options: "i" } },
    ];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  };
  const sortQuery = sortMap[sort] ?? sortMap.newest;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sortQuery)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select("name email phone role isActive createdAt")
      .lean(),
    User.countDocuments(query),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canEditRoles = canManageUsers(currentUser.role);
  const assignableRoles = assignableUserRoles(currentUser.role);
  const roleOptionsForEditor = userRoleOptions
    .filter((option) => assignableRoles.includes(option.value as AuthRole))
    .map((option) => ({
      value: option.value as AuthRole,
      label: option.label,
    }));

  return (
    <div>
      <AdminPageHeader
        title="ইউজার ও রোল"
        description={
          canEditRoles
            ? "Admin ও Super admin user role ও active status পরিবর্তন করতে পারবে। Super admin role শুধু super admin দিতে পারবে।"
            : "Role পরিবর্তনের জন্য admin বা super admin access লাগবে।"
        }
      />

      <div className="mb-5 rounded-xl border border-sage-border bg-white p-4">
        <form className="grid gap-3 lg:grid-cols-12">
          <input
            name="q"
            defaultValue={q}
            placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন"
            className="h-10 rounded-lg border border-sage-border px-3 text-sm lg:col-span-4"
          />
          <select
            name="role"
            defaultValue={role}
            className="h-10 rounded-lg border border-sage-border px-3 text-sm lg:col-span-3"
          >
            <option value="all">সব রোল</option>
            {userRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-lg border border-sage-border px-3 text-sm lg:col-span-2"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-lg border border-sage-border px-3 text-sm lg:col-span-2"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-lg bg-sage-primary px-4 text-sm font-bold text-white lg:col-span-1"
          >
            Filter
          </button>
        </form>

        <div className="mt-3 text-xs text-sage-gray-700">
          মোট ফলাফল: <span className="font-semibold text-sage-secondary">{total}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-sage-border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sage-red-50 text-sage-secondary">
            <tr>
              <th className="p-4">নাম</th>
              <th className="p-4">ইমেইল</th>
              <th className="p-4">ফোন</th>
              <th className="p-4">রোল</th>
              <th className="p-4">Active</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-border">
            {users.map((user) => {
              const userRole = user.role as AuthRole;
              const isProtectedSuperAdmin =
                userRole === "super_admin" && currentUser.role !== "super_admin";

              return (
                <UserRoleRow
                  key={user._id.toString()}
                  user={{
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: userRole,
                    isActive: user.isActive,
                  }}
                  roleOptions={roleOptionsForEditor}
                  isEditable={canEditRoles && !isProtectedSuperAdmin}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-sage-border bg-white px-4 py-3 text-sm">
          <span className="text-sage-gray-700">
            পেজ {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}&page=${Math.max(1, page - 1)}`}
              className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              Previous
            </Link>
            <Link
              href={`?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}&page=${Math.min(totalPages, page + 1)}`}
              className={`rounded-lg border px-3 py-1.5 ${
                page >= totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
