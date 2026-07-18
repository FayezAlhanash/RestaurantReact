import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
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
  const { isLight } = useTheme();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [permissionError, setPermissionError] = useState("");
  const [updatingPermissionId, setUpdatingPermissionId] = useState(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [createRoleForm, setCreateRoleForm] = useState({
    name: "",
    description: "",
    requires_restaurant: false,
  });
  const [createRoleError, setCreateRoleError] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);

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

  const handleCreateRoleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setCreateRoleForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setCreateRoleError("");
  };

  const resetCreateRoleForm = () => {
    setCreateRoleForm({
      name: "",
      description: "",
      requires_restaurant: false,
    });
    setCreateRoleError("");
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();

    const roleName = createRoleForm.name.trim();

    if (!roleName) {
      setCreateRoleError("Role name is required.");
      return;
    }

    setIsCreatingRole(true);
    setCreateRoleError("");

    try {
      const formData = new FormData();
      formData.append("name", roleName);
      formData.append("description", createRoleForm.description.trim());
      formData.append(
        "requires_restaurant",
        createRoleForm.requires_restaurant ? "1" : "0"
      );

      const res = await api.post("/admin/roles", formData);
      const createdRole = getResponseRole(res.data);
      const rolesRes = await api.get("/admin/roles");
      const rolesList = getList(rolesRes.data, "roles");

      setRoles(rolesList);

      const nextSelectedRole =
        rolesList.find((role) => role.id === createdRole?.id) ??
        rolesList.find(
          (role) =>
            String(role.name ?? "").toLowerCase() === roleName.toLowerCase()
        ) ??
        createdRole;

      if (nextSelectedRole) {
        handleSelectRole(nextSelectedRole);
      }

      resetCreateRoleForm();
      setShowCreateRole(false);
    } catch (error) {
      setCreateRoleError(
        error.response?.data?.message ||
          "Role could not be created. Please try again."
      );
      console.log(error.response?.data || error);
    } finally {
      setIsCreatingRole(false);
    }
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
  const pageSurface = isLight
    ? "bg-[#FBF6EF] text-[#241815]"
    : "bg-[linear-gradient(145deg,#0A1012_0%,#111A1D_58%,#181316_100%)] text-white";
  const cardSurface = isLight
    ? "border-[#E4CFC3] bg-[#FFF9F2] shadow-[0_18px_44px_rgba(70,45,30,0.10)]"
    : "border-white/10 bg-[linear-gradient(135deg,rgba(28,39,42,0.96)_0%,rgba(24,34,37,0.94)_60%,rgba(37,27,30,0.92)_100%)] shadow-[0_20px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04]";
  const titleText = isLight ? "text-[#241815]" : "text-white";
  const mutedText = isLight ? "text-[#6B5A52]" : "text-white/58";
  const statSurface = isLight
    ? "border-[#E4CFC3] bg-[#FFF4EA] shadow-[0_12px_28px_rgba(70,45,30,0.08)]"
    : "border-white/10 bg-white/[0.055] shadow-[0_16px_34px_rgba(0,0,0,0.16)]";

  return (
    <div className={`min-h-full space-y-6 p-4 sm:p-6 lg:p-8 ${pageSurface}`}>
      <section className={`overflow-hidden rounded-[24px] border ${cardSurface}`}>
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166] shadow-[0_14px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/10">
              <ShieldCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                Access control
              </p>
              <h1 className={`mt-1 text-3xl font-black sm:text-4xl ${titleText}`}>
                Roles & permissions
              </h1>
              <p className={`mt-2 max-w-2xl text-sm font-medium leading-6 ${mutedText}`}>
                Choose a role, then turn allowed permissions on or off. Admin-only
                controls stay hidden from assignment.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
            <div className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/25 ${statSurface}`}>
              <p className={`text-xs font-black uppercase tracking-[0.12em] ${isLight ? "text-[#2E8B61]" : "text-emerald-300"}`}>Roles</p>
              <strong className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}>
                {roles.length}
              </strong>
            </div>
            <div className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-[#FFD166]/25 ${statSurface}`}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD166]">Assignable</p>
              <strong className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}>
                {assignablePermissions.length}
              </strong>
            </div>
            <div className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-[#7F1D1D]/25 ${statSurface}`}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7F1D1D]">Enabled</p>
              <strong className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}>
                {rolePermissions.length}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="overflow-hidden rounded-[24px] border border-white/10 bg-[#1B282C] shadow-[0_20px_50px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.03]">
          <div className="border-b border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-[#FFD166] shadow-sm">
                <Users size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]/80">
                  Select role
                </p>
                <h2 className="text-lg font-black text-white">Roles</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateRole((prev) => !prev);
                  setCreateRoleError("");
                }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D] shadow-sm transition hover:border-[#7F1D1D]/55 hover:bg-[#7F1D1D]/18 active:scale-95"
                aria-label={showCreateRole ? "Close add role form" : "Add role"}
                title={showCreateRole ? "Close" : "Add role"}
              >
                {showCreateRole ? <X size={18} /> : <Plus size={18} />}
              </button>
            </div>

            {showCreateRole && (
              <form
                onSubmit={handleCreateRole}
                className="mt-4 rounded-2xl border border-white/10 bg-[#111A1D] p-3 shadow-sm"
              >
                <div className="grid gap-3">
                  <input
                    name="name"
                    value={createRoleForm.name}
                    onChange={handleCreateRoleChange}
                    placeholder="Role name"
                    className="w-full rounded-xl border border-white/10 bg-[#0D1214] px-3 py-2.5 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                    disabled={isCreatingRole}
                  />
                  <textarea
                    name="description"
                    value={createRoleForm.description}
                    onChange={handleCreateRoleChange}
                    placeholder="Description"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0D1214] px-3 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                    disabled={isCreatingRole}
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-[#FFD166]/20 bg-[#FFD166]/10 px-3 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#FFD166]">
                    <input
                      type="checkbox"
                      name="requires_restaurant"
                      checked={createRoleForm.requires_restaurant}
                      onChange={handleCreateRoleChange}
                      className="h-4 w-4 accent-[#7F1D1D]"
                      disabled={isCreatingRole}
                    />
                    Requires restaurant
                  </label>

                  {createRoleError && (
                    <p className="flex items-start gap-2 rounded-xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-3 py-2 text-xs font-bold text-[#7F1D1D]">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{createRoleError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isCreatingRole}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(127,29,29,0.18)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreatingRole ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Plus size={17} />
                    )}
                    Add role
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0D1214] px-3 py-2.5 shadow-inner">
              <Search size={17} className="shrink-0 text-[#FFD166]" />
              <input
                value={roleSearch}
                onChange={(event) => setRoleSearch(event.target.value)}
                placeholder="Search roles..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="admin-dashboard-scroll max-h-[590px] space-y-2 overflow-y-auto p-3">
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
                  className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                    isActive
                      ? "border-[#FFD166]/35 bg-[#FFD166]/10 text-white shadow-[0_12px_26px_rgba(255,209,102,0.08)] ring-1 ring-[#FFD166]/10"
                      : "border-transparent bg-[#101A1D] text-white/74 hover:border-white/10 hover:bg-[#152226] hover:text-white"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black capitalize">
                      {role.name}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-bold ${
                        isActive ? "text-[#FFD166]" : "text-white/40"
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
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#111A1D] p-6 text-center text-sm font-semibold text-white/45">
                No roles found.
              </div>
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#1B282C] shadow-[0_20px_50px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.03]">
          <div className="border-b border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]/80">
                  Permissions
                </p>
                <h2 className="mt-1 text-3xl font-black text-white">
                  {selectedRole ? selectedRole.name : "Select a role"}
                </h2>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0D1214] px-3 py-2.5 shadow-inner lg:w-[320px]">
                <Search size={17} className="shrink-0 text-[#FFD166]" />
                <input
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder="Search permissions..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                />
              </div>
            </div>

            {permissionError && (
              <p className="mt-4 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
                {permissionError}
              </p>
            )}
          </div>

          {!selectedRole ? (
            <div className="grid min-h-[420px] place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                  <ShieldCheck size={25} />
                </div>
                <h3 className="mt-4 text-xl font-black text-white">
                  Pick a role first
                </h3>
                <p className="mt-2 text-sm font-medium text-white/48">
                  Permissions will appear here after you select a role.
                </p>
              </div>
            </div>
          ) : (
            <div className="admin-dashboard-scroll grid max-h-[620px] gap-3 overflow-y-auto p-4 md:grid-cols-2">
              {visiblePermissions.map((perm) => {
                const checked = rolePermissions.includes(String(perm.id));
                const isUpdating = updatingPermissionId === perm.id;

                return (
                  <label
                    key={perm.id}
                    className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 active:scale-[0.99] ${
                      checked
                        ? "border-[#FFD166]/28 bg-[#FFD166]/10 shadow-[0_10px_24px_rgba(255,209,102,0.06)]"
                        : "border-white/10 bg-[#101A1D] hover:border-white/16 hover:bg-[#142125]"
                    } ${isUpdating ? "opacity-70" : ""}`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                        checked
                          ? "border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]"
                          : "border border-white/10 bg-white/[0.04] text-white/35 group-hover:border-white/18 group-hover:text-white/65"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">
                        {formatPermissionLabel(perm)}
                      </span>
                      <span className="block truncate text-xs font-semibold text-white/42">
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
                <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-[#111A1D] p-10 text-center">
                  <h3 className="text-lg font-black text-white">
                    No permissions found
                  </h3>
                  <p className="mt-2 text-sm font-medium text-white/45">
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
