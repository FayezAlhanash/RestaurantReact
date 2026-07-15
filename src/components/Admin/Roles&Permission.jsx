import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import api from "../../API/axios";
import { getStoredUser, storeUser } from "../../utils/auth";
import {
  canAssignPermissionToRole,
  filterPermissionsForRole,
} from "../../utils/permissionScopes";

const getList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getRolePermissionList = (role = {}) => {
  if (Array.isArray(role.permissions)) return role.permissions;
  if (Array.isArray(role.role_permissions)) return role.role_permissions;
  if (Array.isArray(role.permission)) return role.permission;
  return [];
};

const getRolePermissionIds = (role = {}) =>
  getRolePermissionList(role).map((permission) => String(permission.id));

const getResponseRole = (data) =>
  data?.role ?? data?.data?.role ?? data?.data ?? null;

const getPermissionKey = (permission = {}) =>
  permission.key ?? permission.name ?? permission.slug ?? permission.code ?? "";

const getPermissionIdByKey = (permissions, key) =>
  permissions.find((permission) => getPermissionKey(permission) === key)?.id;

const formatPermissionLabel = (permission = {}) =>
  getPermissionKey(permission)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function RolesPermission() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [permissionError, setPermissionError] = useState("");
  const [updatingPermissionId, setUpdatingPermissionId] = useState(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const refreshCurrentUserPermissions = async () => {
    const currentUser = getStoredUser();

    if (!currentUser) return;

    const res = await api.get("/profile/permissions");
    storeUser(currentUser, res.data);
  };

  const fetchRoles = async () => {
    const res = await api.get("/admin/roles");
    const rolesList = getList(res.data, "roles");

    setRoles(rolesList);

    if (selectedRole) {
      const updatedRole = rolesList.find((role) => role.id === selectedRole.id);

      if (updatedRole) {
        setSelectedRole(updatedRole);
        setRolePermissions(getRolePermissionIds(updatedRole));
      }
    }
  };

  const fetchPermissions = async () => {
    const res = await api.get("/admin/permissions");
    setPermissions(getList(res.data, "permissions"));
  };

  // load roles + permissions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when selecting role
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setRolePermissions(
      getRolePermissionList(role)
        .filter((permission) => canAssignPermissionToRole(role, permission))
        .map((p) => String(p.id))
    );
    setPermissionError("");
  };

  // toggle permission
  const togglePermission = async (permissionId) => {
    if (!selectedRole) return;

    const permission = permissions.find((item) => item.id === permissionId);
    if (!canAssignPermissionToRole(selectedRole, permission)) return;

    const selectedPermissionKey = getPermissionKey(permission);
    const monitorInventoryId = getPermissionIdByKey(
      permissions,
      "monitor_inventory"
    );
    const manageInventoryId = getPermissionIdByKey(
      permissions,
      "manage_inventory"
    );
    const viewRecipesId = getPermissionIdByKey(permissions, "view_recipes");
    const manageRecipesId = getPermissionIdByKey(permissions, "manage_recipes");
    const permissionKey = String(permissionId);
    const hasPermission = rolePermissions.includes(permissionKey);

    setPermissionError("");
    setUpdatingPermissionId(permissionId);

    try {
      if (hasPermission) {
      if (
        selectedPermissionKey === "monitor_inventory" &&
        manageInventoryId &&
        rolePermissions.includes(String(manageInventoryId))
      ) {
        setPermissionError(
          "Remove manage_inventory before removing monitor_inventory."
        );
        return;
      }

      if (
        selectedPermissionKey === "view_recipes" &&
        manageRecipesId &&
        rolePermissions.includes(String(manageRecipesId))
      ) {
        setPermissionError(
          "Remove manage_recipes before removing view_recipes."
        );
        return;
      }

      const res = await api.delete(`/admin/roles/${selectedRole.id}/permissions`, {
        data: {
          permission_id: permissionId,
        },
      });
      const updatedRole = getResponseRole(res.data);

      if (updatedRole) {
        setSelectedRole(updatedRole);
        setRolePermissions(getRolePermissionIds(updatedRole));

        setRoles((prev) =>
          prev.map((role) =>
            role.id === updatedRole.id ? updatedRole : role
          )
        );
      } else {
        setRolePermissions((prev) =>
          prev.filter((id) => id !== permissionKey)
        );

        setRoles((prev) =>
          prev.map((role) =>
            role.id === selectedRole.id
              ? {
                  ...role,
                  permissions: getRolePermissionList(role).filter(
                    (permission) => String(permission.id) !== permissionKey
                  ),
                }
              : role
          )
        );
      }

      await refreshCurrentUserPermissions();
    } else {
      if (
        selectedPermissionKey === "manage_inventory" &&
        monitorInventoryId &&
        !rolePermissions.includes(String(monitorInventoryId))
      ) {
        const monitorFormData = new FormData();
        monitorFormData.append("permission_id", monitorInventoryId);
        await api.post(
          `/admin/roles/${selectedRole.id}/permissions`,
          monitorFormData
        );
        setRolePermissions((prev) => [
          ...new Set([...prev, String(monitorInventoryId)]),
        ]);
      }

      if (
        selectedPermissionKey === "manage_recipes" &&
        viewRecipesId &&
        !rolePermissions.includes(String(viewRecipesId))
      ) {
        const viewRecipesFormData = new FormData();
        viewRecipesFormData.append("permission_id", viewRecipesId);
        await api.post(
          `/admin/roles/${selectedRole.id}/permissions`,
          viewRecipesFormData
        );
        setRolePermissions((prev) => [
          ...new Set([...prev, String(viewRecipesId)]),
        ]);
      }

      const formData = new FormData();
      formData.append("permission_id", permissionId);

      const res = await api.post(
        `/admin/roles/${selectedRole.id}/permissions`,
        formData
      );
      const updatedRole = getResponseRole(res.data);

      if (updatedRole) {
        setSelectedRole(updatedRole);
        setRolePermissions(getRolePermissionIds(updatedRole));
        setRoles((prev) =>
          prev.map((role) =>
            role.id === updatedRole.id ? updatedRole : role
          )
        );
      } else {
        setRolePermissions((prev) => [...prev, permissionKey]);

        if (permission) {
          setRoles((prev) =>
            prev.map((role) =>
              role.id === selectedRole.id
                ? {
                  ...role,
                  permissions: [
                      ...getRolePermissionList(role),
                      permission,
                    ],
                  }
                : role
            )
          );
        }
      }

      await refreshCurrentUserPermissions();
    }
      await fetchRoles();
    } catch (error) {
      setPermissionError(
        error.response?.data?.message ||
          "Permission could not be updated. Please try again."
      );
      console.log(error.response?.data || error);
    } finally {
      setUpdatingPermissionId(null);
    }
  };

  const normalizedRoleSearch = roleSearch.trim().toLowerCase();
  const normalizedPermissionSearch = permissionSearch.trim().toLowerCase();
  const filteredRoles = roles.filter((role) =>
    String(role.name ?? "").toLowerCase() !== "customer" &&
    String(role.name ?? "").toLowerCase().includes(normalizedRoleSearch)
  );
  const assignablePermissions = selectedRole
    ? filterPermissionsForRole(selectedRole, permissions)
    : [];
  const visiblePermissions = assignablePermissions.filter((permission) =>
    getPermissionKey(permission)
      .toLowerCase()
      .includes(normalizedPermissionSearch)
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl border border-[#E8DCD4] bg-[#FFFDFB] shadow-[0_18px_45px_rgba(70,45,30,0.08)]">
        <div className="flex flex-col gap-5 border-b border-[#EFE3DD] bg-gradient-to-r from-[#FFF7F2] via-white to-[#F8F1EC] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_30px_rgba(127,29,29,0.18)]">
              <ShieldCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7A70]">
                Access control
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#241F1D] sm:text-3xl">
                Roles & permissions
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#7A6A64]">
                Choose a role, then turn allowed permissions on or off. Admin-only
                controls stay hidden from assignment.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
            <div className="rounded-xl border border-[#EADBD3] bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase text-[#9A7A70]">Roles</p>
              <strong className="mt-2 block text-3xl font-black text-[#241F1D]">
                {roles.length}
              </strong>
            </div>
            <div className="rounded-xl border border-[#EADBD3] bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase text-[#9A7A70]">Assignable</p>
              <strong className="mt-2 block text-3xl font-black text-[#241F1D]">
                {assignablePermissions.length}
              </strong>
            </div>
            <div className="rounded-xl border border-[#EBCBCB] bg-[#F9ECEC] p-4 shadow-sm">
              <p className="text-xs font-black uppercase text-[#7F1D1D]">Enabled</p>
              <strong className="mt-2 block text-3xl font-black text-[#7F1D1D]">
                {rolePermissions.length}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-[#E8DCD4] bg-[#FFFDFB] shadow-[0_16px_38px_rgba(70,45,30,0.06)]">
          <div className="border-b border-[#EFE3DD] bg-[#F8F3EF] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#7F1D1D] shadow-sm">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A08980]">
                  Select role
                </p>
                <h2 className="text-lg font-black text-[#241F1D]">Roles</h2>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E4D6CF] bg-white px-3 py-2.5 shadow-sm">
              <Search size={17} className="shrink-0 text-[#A08980]" />
              <input
                value={roleSearch}
                onChange={(event) => setRoleSearch(event.target.value)}
                placeholder="Search roles..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#241F1D] outline-none placeholder:text-[#A08980]"
              />
            </div>
          </div>

          <div className="max-h-[590px] space-y-2 overflow-y-auto p-3">
            {filteredRoles.map((role) => {
              const isActive = selectedRole?.id === role.id;
              const assignedCount = getRolePermissionList(role).filter((permission) =>
                canAssignPermissionToRole(role, permission)
              ).length;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[#EBCBCB] bg-[#F9ECEC] text-[#7F1D1D] shadow-sm"
                      : "border-transparent bg-white text-[#4A403D] hover:border-[#E8DCD4] hover:bg-[#FDF7F4]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black capitalize">
                      {role.name}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-bold ${
                        isActive ? "text-[#9A3333]" : "text-[#A08980]"
                      }`}
                    >
                      {assignedCount} enabled
                    </span>
                  </span>
                  {isActive && <CheckCircle2 size={18} className="shrink-0" />}
                </button>
              );
            })}

            {!filteredRoles.length && (
              <div className="rounded-xl border border-dashed border-[#E4D6CF] p-6 text-center text-sm font-semibold text-[#8C7B74]">
                No roles found.
              </div>
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-[#E8DCD4] bg-[#FFFDFB] shadow-[0_16px_38px_rgba(70,45,30,0.06)]">
          <div className="border-b border-[#EFE3DD] bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A08980]">
                  Permissions
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#241F1D]">
                  {selectedRole ? selectedRole.name : "Select a role"}
                </h2>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E4D6CF] bg-[#F8F3EF] px-3 py-2.5 shadow-sm lg:w-[320px]">
                <Search size={17} className="shrink-0 text-[#A08980]" />
                <input
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder="Search permissions..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#241F1D] outline-none placeholder:text-[#A08980]"
                />
              </div>
            </div>

            {permissionError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {permissionError}
              </p>
            )}
          </div>

          {!selectedRole ? (
            <div className="grid min-h-[420px] place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F9ECEC] text-[#7F1D1D]">
                  <ShieldCheck size={25} />
                </div>
                <h3 className="mt-4 text-xl font-black text-[#241F1D]">
                  Pick a role first
                </h3>
                <p className="mt-2 text-sm font-medium text-[#8C7B74]">
                  Permissions will appear here after you select a role.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {visiblePermissions.map((perm) => {
                const checked = rolePermissions.includes(String(perm.id));
                const isUpdating = updatingPermissionId === perm.id;

                return (
                  <label
                    key={perm.id}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-[#EBCBCB] bg-[#F9ECEC] shadow-sm"
                        : "border-[#E8DCD4] bg-white hover:border-[#DEC8BE] hover:bg-[#FDF7F4]"
                    } ${isUpdating ? "opacity-70" : ""}`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                        checked
                          ? "bg-[#7F1D1D] text-white"
                          : "bg-[#F8F3EF] text-[#8A7972] group-hover:text-[#7F1D1D]"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#241F1D]">
                        {formatPermissionLabel(perm)}
                      </span>
                      <span className="block truncate text-xs font-semibold text-[#9A7A70]">
                        {getPermissionKey(perm)}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isUpdating}
                      onChange={() => togglePermission(perm.id)}
                      className="h-5 w-5 shrink-0 accent-[#7F1D1D]"
                    />
                  </label>
                );
              })}

              {!visiblePermissions.length && (
                <div className="col-span-full rounded-xl border border-dashed border-[#E4D6CF] p-10 text-center">
                  <h3 className="text-lg font-black text-[#241F1D]">
                    No permissions found
                  </h3>
                  <p className="mt-2 text-sm font-medium text-[#8C7B74]">
                    Try another search term or select a different role.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
