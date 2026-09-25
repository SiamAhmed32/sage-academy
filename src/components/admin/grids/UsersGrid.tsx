"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { UserCheck, UserX } from "lucide-react";
import { toast } from "react-toastify";

import { updateUserRoleAction } from "@/app/admin/actions/user-roles";
import { SaDataGrid, type GridContext, type SaDataGridHandle } from "@/components/admin/grid/SaDataGrid";
import type { GridTile } from "@/components/admin/grid/GridTiles";
import { ActionIcons, IconAction, Muted, Pill, TitleCell, dateCol, setCol, textCol } from "@/components/admin/grid/cells";
import { adminRoleLabels } from "@/constants/admin-display";
import type { AuthRole } from "@/lib/auth";
import { ConfirmDialog, yesNoOptions, type ConfirmRequest } from "./shared";

const SOURCE = "users";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AuthRole;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  isSelf: boolean;
  editable: boolean;
};

export type RoleOption = { value: AuthRole; label: string };

async function saveUser(row: Row, role: AuthRole, isActive: boolean) {
  const formData = new FormData();
  formData.append("id", row.id);
  formData.append("role", role);
  if (isActive) formData.append("isActive", "on");
  return updateUserRoleAction(formData);
}

function RoleCell({ data, context, roleOptions }: ICellRendererParams<Row, AuthRole, GridContext> & { roleOptions: RoleOption[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<AuthRole | null>(null);
  const saving = pending !== null;
  if (!data) return null;
  const label = adminRoleLabels[data.role] ?? data.role;
  if (!data.editable) return <span>{label}</span>;
  const options = roleOptions.some((option) => option.value === data.role) ? roleOptions : [{ value: data.role, label }, ...roleOptions];

  return (
    <select
      className="input sm"
      aria-label={`Role for ${data.name}`}
      value={pending ?? data.role}
      disabled={saving}
      style={{ height: 30, minWidth: 130 }}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={async (event) => {
        const next = event.target.value as AuthRole;
        if (next === data.role) return;
        setPending(next);
        try {
          const result = await saveUser(data, next, data.isActive);
          if (result.ok) {
            toast.success(`Role saved for ${data.name}.`);
            router.refresh();
          } else {
            toast.error(result.message || "The changes could not be saved.");
          }
        } catch {
          toast.error("A server error occurred.");
        } finally {
          setPending(null);
          context.refresh(false);
        }
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function UsersGrid({ tiles, roleOptions }: { tiles: GridTile[]; roleOptions: RoleOption[] }) {
  const router = useRouter();
  const gridRef = useRef<SaDataGridHandle>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const setActive = useCallback(
    async (row: Row, isActive: boolean) => {
      try {
        const result = await saveUser(row, row.role, isActive);
        if (result.ok) {
          toast.success(isActive ? `${row.name} can sign in again.` : `${row.name} has been deactivated.`);
          gridRef.current?.refresh(false);
          router.refresh();
        } else {
          toast.error(result.message || "The changes could not be saved.");
        }
      } catch {
        toast.error("A server error occurred.");
      }
    },
    [router]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "name",
        headerName: "User",
        minWidth: 230,
        flex: 1.3,
        ...textCol(),
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? <TitleCell avatar={data.name} title={data.isSelf ? `${data.name} (you)` : data.name} sub={data.email} /> : null,
      },
      { field: "email", headerName: "Email", minWidth: 200, flex: 1, hide: true, ...textCol() },
      {
        field: "phone",
        headerName: "Phone",
        width: 150,
        ...textCol(),
        cellRenderer: ({ value }: { value?: string }) => (value ? value : <Muted>N/A</Muted>),
      },
      {
        field: "role",
        headerName: "Role",
        width: 170,
        ...setCol(Object.entries(adminRoleLabels).map(([value, label]) => ({ value, label }))),
        cellRenderer: RoleCell,
        cellRendererParams: { roleOptions },
        context: { exportValue: (row: Row) => adminRoleLabels[row.role] ?? row.role },
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 120,
        ...setCol(yesNoOptions("Active", "Inactive")),
        cellRenderer: ({ value }: { value?: boolean }) => (value ? <Pill tone="success">Active</Pill> : <Pill tone="neutral">Inactive</Pill>),
        context: { exportValue: (row: Row) => (row.isActive ? "Active" : "Inactive") },
      },
      { field: "lastLoginAt", headerName: "Last sign-in", width: 140, ...dateCol() },
      { field: "createdAt", headerName: "Joined", width: 130, ...dateCol() },
      {
        colId: "actions",
        headerName: "",
        width: 80,
        cellRenderer: ({ data }: { data?: Row }) =>
          data ? (
            <ActionIcons>
              {data.isActive ? (
                <IconAction
                  icon={UserX}
                  label={data.editable ? "Deactivate" : "You cannot change this user"}
                  tone="danger"
                  disabled={!data.editable}
                  onClick={() =>
                    setConfirm({
                      title: "Deactivate this user?",
                      description: `${data.name} will not be able to sign in until the account is activated again.`,
                      confirmLabel: "Deactivate",
                      danger: true,
                      run: () => setActive(data, false),
                    })
                  }
                />
              ) : (
                <IconAction
                  icon={UserCheck}
                  label={data.editable ? "Activate" : "You cannot change this user"}
                  tone="success"
                  disabled={!data.editable}
                  onClick={() => setActive(data, true)}
                />
              )}
            </ActionIcons>
          ) : null,
      },
    ],
    [roleOptions, setActive]
  );

  return (
    <>
      <SaDataGrid<Row>
        ref={gridRef}
        source={SOURCE}
        gridId={SOURCE}
        columnDefs={columnDefs}
        getRowId={(row) => row.id}
        tiles={tiles}
        searchPlaceholder="Search name, email or phone…"
        emptyTitle="No users found"
        emptyDescription="Clear the search or filters."
        exportName="sage-users"
      />
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}
