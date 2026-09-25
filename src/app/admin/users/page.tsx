import { UsersGrid, type RoleOption } from "@/components/admin/grids/UsersGrid";
import { PageHeading } from "@/components/admin/sa/ui";
import { userRoleOptions } from "@/constants/admin";
import { adminRoleLabels } from "@/constants/admin-display";
import type { AuthRole } from "@/lib/auth";
import { userTiles } from "@/lib/grid/tiles-content";
import { assignableUserRoles, canManageUsers, requireAdminPageUser } from "@/lib/rbac";

export default async function AdminUsersPage() {
  const currentUser = await requireAdminPageUser();
  const tiles = await userTiles();

  const canEditRoles = canManageUsers(currentUser.role);
  const assignableRoles = assignableUserRoles(currentUser.role);
  const roleOptions: RoleOption[] = userRoleOptions
    .filter((option) => assignableRoles.includes(option.value as AuthRole))
    .map((option) => ({
      value: option.value as AuthRole,
      label: adminRoleLabels[option.value] ?? option.label,
    }));

  return (
    <div>
      <PageHeading
        title="Users and Roles"
        description={
          canEditRoles
            ? "Admins and super admins can update user roles and active status. Only a super admin can assign the super admin role."
            : "Admin or super admin access is required to change roles."
        }
      />
      <UsersGrid tiles={tiles} roleOptions={roleOptions} />
    </div>
  );
}
