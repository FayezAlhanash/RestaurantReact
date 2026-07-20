import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import { getStoredUser, storeUser } from "../../utils/auth";
import {
  canAssignPermissionToUser,
  filterPermissionsForUser,
} from "../../utils/permissionScopes";

const getList = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
};

const getUserName = (user) =>
  user?.name ||
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.email ||
  `User #${user?.id ?? "unknown"}`;

const getPermissionKey = (permission = {}) => {
  const safePermission = asObject(permission);

  return (
    safePermission.key ??
    safePermission.name ??
    safePermission.slug ??
    safePermission.code ??
    ""
  );
};

const getPermissionId = (permission = {}) => {
  const safePermission = asObject(permission);

  return (
    safePermission.id ??
    safePermission.permission_id ??
    safePermission.permission?.id
  );
};

const getPermissionIdByKey = (permissions, key) =>
  permissions.find((permission) => getPermissionKey(permission) === key)?.id;

const formatPermissionLabel = (permission = {}) =>
  getPermissionKey(permission)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatRoleName = (role) =>
  String(role?.name ?? "No role")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getDirectUserPermissions = (user = {}) => {
  const safeUser = asObject(user);

  return asList(
    safeUser.user_permissions ||
      safeUser.userPermissions ||
      safeUser.direct_permissions ||
      safeUser.directPermissions ||
      safeUser.permissions,
  );
};

const getRevokedUserPermissions = (user = {}) => {
  const safeUser = asObject(user);

  return asList(
    safeUser.revoked_permissions ||
      safeUser.revokedPermissions ||
      safeUser.denied_permissions ||
      safeUser.deniedPermissions ||
      safeUser.excluded_permissions ||
      safeUser.excludedPermissions ||
      safeUser.permission_overrides?.denied ||
      safeUser.permissionOverrides?.denied,
  );
};

const getRolePermissions = (role = {}) => {
  const safeRole = asObject(role);

  return asList(
    safeRole.permissions ||
      safeRole.role_permissions ||
      safeRole.rolePermissions ||
      safeRole.permission,
  );
};

const getUserRoleId = (user = {}) => {
  const safeUser = asObject(user);

  return safeUser.role_id ?? safeUser.role?.id;
};

const getRoleForUser = (user = {}, roles = []) => {
  const safeUser = asObject(user);
  const embeddedRole = asObject(safeUser.role);

  if (getRolePermissions(embeddedRole).length) {
    return embeddedRole;
  }

  return (
    roles.find((role) => String(role.id) === String(getUserRoleId(safeUser))) ||
    embeddedRole
  );
};

const getRolePermissionIds = (user = {}, roles = []) =>
  getRolePermissions(getRoleForUser(user, roles))
    .map(getPermissionId)
    .filter(Boolean)
    .map(String);

const getRevokedPermissionIds = (user = {}) =>
  getRevokedUserPermissions(user)
    .map(getPermissionId)
    .filter(Boolean)
    .map(String);

const addRevokedPermission = (user = {}, permission) => {
  const permissionId = getPermissionId(permission);
  const revokedPermissions = getRevokedUserPermissions(user);
  const alreadyRevoked = revokedPermissions.some(
    (item) => String(getPermissionId(item)) === String(permissionId),
  );

  if (!permissionId || alreadyRevoked) return user;

  return {
    ...user,
    revoked_permissions: [...revokedPermissions, permission],
  };
};

const removeRevokedPermission = (user = {}, permissionId) => ({
  ...user,
  revoked_permissions: getRevokedUserPermissions(user).filter(
    (permission) => String(getPermissionId(permission)) !== String(permissionId),
  ),
});

const getRolePermissionObjects = (user = {}, roles = [], permissions = []) => {
  const rolePermissionIds = getRolePermissionIds(user, roles);
  const rolePermissionKeys = getRolePermissions(getRoleForUser(user, roles))
    .map((permission) => getPermissionKey(permission.permission || permission))
    .filter(Boolean);

  return permissions.filter(
    (permission) =>
      rolePermissionIds.includes(String(permission.id)) ||
      rolePermissionKeys.includes(getPermissionKey(permission)),
  );
};

export default function UserPermission() {
  const { isLight } = useTheme();
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [roles, setRoles] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [permissionRestaurantIds, setPermissionRestaurantIds] = useState({});
  const [permissionError, setPermissionError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [updatingPermissionId, setUpdatingPermissionId] = useState(null);

  const refreshCurrentUserPermissions = async () => {
    const currentUser = getStoredUser();

    if (!currentUser) return;

    const res = await api.get("/profile/permissions");
    storeUser(currentUser, res.data);
  };

  const selectUser = (user) => {
    setSelectedUser(user);

    const directPermissions = getDirectUserPermissions(user);
    const revokedPermissionIds = new Set(getRevokedPermissionIds(user));
    const restaurantIds = {};

    directPermissions.forEach((permission) => {
      const restaurantId =
        permission.pivot?.restaurant_id ||
        permission.restaurant_id ||
        user.restaurant_id ||
        "";

      if (restaurantId) {
        restaurantIds[permission.id] = String(restaurantId);
      }
    });

    setUserPerms(
      directPermissions
        .filter((permission) => canAssignPermissionToUser(user, permission))
        .map(getPermissionId)
        .filter(Boolean)
        .map(String)
        .filter((permissionId) => !revokedPermissionIds.has(permissionId)),
    );
    setPermissionRestaurantIds(restaurantIds);
    setPermissionError("");
  };

  const fetchUsers = async () => {
    let res;

    try {
      res = await api.get("/admin/users");
    } catch (error) {
      if (error.response?.status !== 404) throw error;

      res = await api.get("/admin/staff-users");
    }

    const usersList = getList(res.data, "users");

    setUsers(usersList);

    if (selectedUser) {
      const updatedUser = usersList.find((user) => user.id === selectedUser.id);

      if (updatedUser) {
        selectUser(updatedUser);
      }
    }
  };

  const fetchPermissions = async () => {
    const res = await api.get("/admin/permissions");
    setPermissions(getList(res.data, "permissions"));
  };

  const fetchRoles = async () => {
    const res = await api.get("/admin/roles");
    setRoles(getList(res.data, "roles"));
  };

  const fetchRestaurants = async () => {
    const res = await api.get("/restaurants");
    setRestaurants(getList(res.data, "restaurants"));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    fetchPermissions();
    fetchRoles();
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestaurantChange = (permissionId, restaurantId) => {
    setPermissionRestaurantIds((prev) => ({
      ...prev,
      [permissionId]: restaurantId,
    }));
    setPermissionError("");
  };

  const togglePermission = async (permissionId) => {
    if (!selectedUser) return;

    const permissionKey = String(permissionId);
    const rawInheritedPermissionIds = getRolePermissionIds(selectedUser, roles);
    const revokedPermissionIds = getRevokedPermissionIds(selectedUser);
    const inheritedPermissionIds = rawInheritedPermissionIds.filter(
      (id) => !revokedPermissionIds.includes(id),
    );
    const isInheritedPermission = rawInheritedPermissionIds.includes(permissionKey);
    const isDirectPermission = userPerms.includes(permissionKey);
    const exists = isDirectPermission || inheritedPermissionIds.includes(permissionKey);

    const permission = permissions.find((item) => item.id === permissionId);
    if (!canAssignPermissionToUser(selectedUser, permission)) return;
    setPermissionError("");

    const selectedPermissionKey = getPermissionKey(permission);
    const monitorInventoryId = getPermissionIdByKey(
      permissions,
      "monitor_inventory",
    );
    const manageInventoryId = getPermissionIdByKey(
      permissions,
      "manage_inventory",
    );
    const viewRecipesId = getPermissionIdByKey(permissions, "view_recipes");
    const manageRecipesId = getPermissionIdByKey(permissions, "manage_recipes");
    setUpdatingPermissionId(permissionId);

    try {
      if (exists) {
        if (
          selectedPermissionKey === "monitor_inventory" &&
          manageInventoryId &&
          userPerms.includes(String(manageInventoryId))
        ) {
          setPermissionError(
            "Remove manage_inventory before removing monitor_inventory",
          );
          return;
        }

        if (
          selectedPermissionKey === "view_recipes" &&
          manageRecipesId &&
          userPerms.includes(String(manageRecipesId))
        ) {
          setPermissionError(
            "Remove manage_recipes before removing view_recipes",
          );
          return;
        }

        const restaurantId =
          selectedUser.restaurant_id ||
          permissionRestaurantIds[permissionId] ||
          "";
        const payload = {
          permission_id: permissionId,
        };

        if (permission?.scope === "restaurant" && restaurantId) {
          payload.restaurant_id = restaurantId;
        }

        const res = await api.delete(
          `/admin/users/${selectedUser.id}/permissions`,
          {
            data: payload,
          },
        );
        const updatedUser = res.data?.user;

        if (updatedUser) {
          const nextUser = isInheritedPermission
            ? addRevokedPermission(updatedUser, permission)
            : updatedUser;

          selectUser(nextUser);

          setUsers((prev) =>
            prev.map((user) =>
              user.id === nextUser.id ? nextUser : user,
            ),
          );
        } else {
          if (isDirectPermission) {
            setUserPerms((prev) =>
              prev.filter((id) => String(id) !== permissionKey),
            );
          }

          setUsers((prev) =>
            prev.map((user) =>
              user.id === selectedUser.id
                ? isInheritedPermission
                  ? addRevokedPermission(
                      {
                        ...user,
                        user_permissions: (
                          user.user_permissions ||
                          user.permissions ||
                          []
                        ).filter((permission) => permission.id !== permissionId),
                      },
                      permission,
                    )
                  : {
                      ...user,
                      user_permissions: (
                        user.user_permissions ||
                        user.permissions ||
                        []
                      ).filter((permission) => permission.id !== permissionId),
                    }
                : user,
            ),
          );

          if (isInheritedPermission) {
            setSelectedUser((currentUser) =>
              addRevokedPermission(
                {
                  ...currentUser,
                  user_permissions: (
                    currentUser?.user_permissions ||
                    currentUser?.permissions ||
                    []
                  ).filter((permission) => permission.id !== permissionId),
                },
                permission,
              ),
            );
          }
        }

        await refreshCurrentUserPermissions();
      } else {
        const restaurantId =
          selectedUser.restaurant_id ||
          permissionRestaurantIds[permissionId] ||
          "";

        if (
          selectedPermissionKey === "manage_inventory" &&
          monitorInventoryId &&
          !userPerms.includes(String(monitorInventoryId))
        ) {
          const monitorPermission = permissions.find(
            (item) => item.id === monitorInventoryId,
          );

          if (monitorPermission?.scope === "restaurant" && !restaurantId) {
            setPermissionError("Select restaurant for restaurant permission");
            return;
          }

          const monitorFormData = new FormData();
          monitorFormData.append("permission_id", monitorInventoryId);

          if (monitorPermission?.scope === "restaurant") {
            monitorFormData.append("restaurant_id", restaurantId);
          }

          await api.post(
            `/admin/users/${selectedUser.id}/permissions`,
            monitorFormData,
          );
          setUserPerms((prev) => [
            ...new Set([...prev, String(monitorInventoryId)]),
          ]);
        }

        if (
          selectedPermissionKey === "manage_recipes" &&
          viewRecipesId &&
          !userPerms.includes(String(viewRecipesId))
        ) {
          const viewRecipesPermission = permissions.find(
            (item) => item.id === viewRecipesId,
          );

          if (viewRecipesPermission?.scope === "restaurant" && !restaurantId) {
            setPermissionError("Select restaurant for restaurant permission");
            return;
          }

          const viewRecipesFormData = new FormData();
          viewRecipesFormData.append("permission_id", viewRecipesId);

          if (viewRecipesPermission?.scope === "restaurant") {
            viewRecipesFormData.append("restaurant_id", restaurantId);
          }

          await api.post(
            `/admin/users/${selectedUser.id}/permissions`,
            viewRecipesFormData,
          );
          setUserPerms((prev) => [
            ...new Set([...prev, String(viewRecipesId)]),
          ]);
        }

        if (permission?.scope === "restaurant" && !restaurantId) {
          setPermissionError("Select restaurant for restaurant permission");
          return;
        }

        const formData = new FormData();
        formData.append("permission_id", permissionId);

        if (permission?.scope === "restaurant") {
          formData.append("restaurant_id", restaurantId);
        }

        const res = await api.post(
          `/admin/users/${selectedUser.id}/permissions`,
          formData,
        );
        const updatedUser = res.data?.user;

        if (updatedUser) {
          const nextUser = removeRevokedPermission(updatedUser, permissionId);

          selectUser(nextUser);
          setUsers((prev) =>
            prev.map((user) =>
              user.id === nextUser.id ? nextUser : user,
            ),
          );
        } else {
          setUserPerms((prev) => [...new Set([...prev, permissionKey])]);

          if (permission) {
            setUsers((prev) =>
              prev.map((user) =>
                user.id === selectedUser.id
                  ? removeRevokedPermission({
                      ...user,
                      user_permissions: [
                        ...(user.user_permissions || user.permissions || []),
                        {
                          ...permission,
                          pivot: {
                            ...(permission.pivot || {}),
                            restaurant_id:
                              permission.scope === "restaurant"
                                ? restaurantId
                                : null,
                          },
                        },
                      ],
                    }, permissionId)
                  : user,
              ),
            );
            setSelectedUser((currentUser) =>
              removeRevokedPermission(currentUser, permissionId),
            );
          }
        }

        await refreshCurrentUserPermissions();
      }
    } catch (error) {
      setPermissionError(
        error.response?.data?.message ||
          "User permission could not be updated. Please try again.",
      );
      console.log(error.response?.data || error);
    } finally {
      setUpdatingPermissionId(null);
    }
  };

  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const normalizedPermissionSearch = permissionSearch.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    `${getUserName(user)} ${formatRoleName(user.role)} ${user.email || ""}`
      .toLowerCase()
      .includes(normalizedUserSearch),
  );
  const assignablePermissions = selectedUser
    ? filterPermissionsForUser(selectedUser, permissions)
    : [];
  const inheritedPermissionIds = selectedUser
    ? getRolePermissionIds(selectedUser, roles).filter(
        (id) => !getRevokedPermissionIds(selectedUser).includes(id),
      )
    : [];
  const effectivePermissionIds = [
    ...new Set([...userPerms, ...inheritedPermissionIds]),
  ];
  const permissionMap = new Map();

  assignablePermissions.forEach((permission) =>
    permissionMap.set(String(permission.id), permission),
  );
  getRolePermissionObjects(selectedUser, roles, permissions).forEach(
    (permission) => permissionMap.set(String(permission.id), permission),
  );

  const visiblePermissions = [...permissionMap.values()].filter((permission) =>
    `${formatPermissionLabel(permission)} ${getPermissionKey(permission)}`
      .toLowerCase()
      .includes(normalizedPermissionSearch),
  );
  const selectedUserName = selectedUser
    ? getUserName(selectedUser)
    : "Select a user";
  const cardSurface = isLight
    ? "border-[#E4CFC3] bg-[#FFF9F2] shadow-[0_18px_44px_rgba(70,45,30,0.10)]"
    : "border-white/10 bg-[linear-gradient(135deg,rgba(28,39,42,0.96)_0%,rgba(24,34,37,0.94)_60%,rgba(37,27,30,0.92)_100%)] shadow-[0_20px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04]";
  const pageSurface = isLight
    ? "bg-[#FBF6EF] text-[#241815]"
    : "bg-[linear-gradient(145deg,#0A1012_0%,#111A1D_58%,#181316_100%)] text-white";
  const titleText = isLight ? "text-[#241815]" : "text-white";
  const mutedText = isLight ? "text-[#6B5A52]" : "text-white/58";

  return (
    <div className={`min-h-full space-y-6 p-4 sm:p-6 lg:p-8 ${pageSurface}`}>
      <section
        className={`overflow-hidden rounded-[24px] border ${cardSurface}`}
      >
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166] shadow-[0_14px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/10">
              <UserCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                Direct user tasks
              </p>
              <h1
                className={`mt-1 text-3xl font-black sm:text-4xl ${titleText}`}
              >
                User permissions
              </h1>
              <p
                className={`mt-2 max-w-2xl text-sm font-medium leading-6 ${mutedText}`}
              >
                Assign a task to one employee without changing the whole role.
                Two cashiers can have different permissions.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">
                Users
              </p>
              <strong
                className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}
              >
                {users.length}
              </strong>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD166]">
                Assignable
              </p>
              <strong
                className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}
              >
                {assignablePermissions.length}
              </strong>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7F1D1D]">
                Active
              </p>
              <strong
                className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}
              >
                {effectivePermissionIds.length}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="overflow-hidden rounded-[24px] border border-white/10 bg-[#1B282C] shadow-[0_20px_50px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.03]">
          <div className="border-b border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-[#FFD166] shadow-sm">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]/80">
                  Select employee
                </p>
                <h2 className="text-lg font-black text-white">Users</h2>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0D1214] px-3 py-2.5 shadow-inner">
              <Search size={17} className="shrink-0 text-[#FFD166]" />
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="admin-dashboard-scroll max-h-[650px] space-y-2 overflow-y-auto p-3">
            {filteredUsers.map((user) => {
              const isActive = selectedUser?.id === user.id;
              const directIds = getDirectUserPermissions(user)
                .filter((permission) =>
                  canAssignPermissionToUser(user, permission),
                )
                .map(getPermissionId)
                .filter(Boolean)
                .map(String);
              const activeCount = [
                ...new Set([
                  ...directIds,
                  ...getRolePermissionIds(user, roles).filter(
                    (id) => !getRevokedPermissionIds(user).includes(id),
                  ),
                ]),
              ].length;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectUser(user)}
                  className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                    isActive
                      ? "border-[#FFD166]/35 bg-[#FFD166]/10 text-white shadow-[0_12px_26px_rgba(255,209,102,0.08)] ring-1 ring-[#FFD166]/10"
                      : "border-transparent bg-[#101A1D] text-white/74 hover:border-white/10 hover:bg-[#152226] hover:text-white"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-black leading-tight text-white">
                      {getUserName(user)}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-bold ${isActive ? "text-[#FFD166]" : "text-white/40"}`}
                    >
                      {formatRoleName(user.role)} · {activeCount} active
                    </span>
                  </span>
                  {isActive && <CheckCircle2 size={18} className="shrink-0" />}
                </button>
              );
            })}

            {!filteredUsers.length && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#111A1D] p-6 text-center text-sm font-semibold text-white/45">
                No users found.
              </div>
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#1B282C] shadow-[0_20px_50px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.03]">
          <div className="border-b border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]/80">
                  Direct permissions
                </p>
                <h2 className="mt-1 text-3xl font-black text-white">
                  {selectedUserName}
                </h2>
                {selectedUser && (
                  <p className="mt-1 text-sm font-bold text-white/45">
                    Role tasks appear here too. Direct tasks can be changed for
                    this user only.
                  </p>
                )}
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
              <p className="mt-4 flex items-start gap-2 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{permissionError}</span>
              </p>
            )}
          </div>

          {!selectedUser ? (
            <div className="grid min-h-[420px] place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                  <UserCheck size={25} />
                </div>
                <h3 className="mt-4 text-xl font-black text-white">
                  Pick a user first
                </h3>
                <p className="mt-2 text-sm font-medium text-white/48">
                  Direct tasks will appear after you select an employee.
                </p>
              </div>
            </div>
          ) : (
            <div className="admin-dashboard-scroll grid max-h-[650px] gap-3 overflow-y-auto p-4 2xl:grid-cols-2">
              {visiblePermissions.map((p) => {
                const permissionKey = String(p.id);
                const revokedPermissionIds = getRevokedPermissionIds(selectedUser);
                const rawInheritedPermissionIds = getRolePermissionIds(
                  selectedUser,
                  roles,
                );
                const isDirect = userPerms.includes(permissionKey);
                const isRevoked = revokedPermissionIds.includes(permissionKey);
                const isInherited = rawInheritedPermissionIds.includes(permissionKey);
                const isActiveInherited = isInherited && !isRevoked;
                const checked = isDirect || isActiveInherited;
                const isUpdating = updatingPermissionId === p.id;
                const needsRestaurant =
                  p.scope === "restaurant" &&
                  !selectedUser.restaurant_id &&
                  !checked;

                return (
                  <label
                    key={p.id}
                    className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 active:scale-[0.99] ${
                      checked
                        ? "border-[#FFD166]/28 bg-[#FFD166]/10 shadow-[0_10px_24px_rgba(255,209,102,0.06)]"
                        : "border-white/10 bg-[#101A1D] hover:border-white/16 hover:bg-[#142125]"
                    } ${isUpdating ? "opacity-70" : ""} cursor-pointer`}
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
                      <span className="line-clamp-2 text-sm font-black leading-tight text-white">
                        {formatPermissionLabel(p)}
                      </span>
                      <span className="mt-1 line-clamp-2 break-words text-xs font-semibold leading-tight text-white/42">
                        {getPermissionKey(p)}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2">
                        {isInherited && (
                          <span className="rounded-full border border-[#FFD166]/25 bg-[#FFD166]/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#FFD166]">
                            Role
                          </span>
                        )}
                        {isRevoked && (
                          <span className="rounded-full border border-[#7F1D1D]/25 bg-[#7F1D1D]/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#7F1D1D]">
                            Removed
                          </span>
                        )}
                        {isDirect && (
                          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-200">
                            Direct
                          </span>
                        )}
                      </span>
                    </span>

                    {needsRestaurant && (
                      <select
                        value={permissionRestaurantIds[p.id] || ""}
                        onChange={(e) =>
                          handleRestaurantChange(p.id, e.target.value)
                        }
                        className="min-w-0 rounded-xl border border-white/10 bg-[#0D1214] px-2 py-2 text-xs font-bold text-white outline-none focus:border-[#FFD166]/70"
                      >
                        <option value="">Restaurant</option>
                        {restaurants.map((restaurant) => (
                          <option key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isUpdating}
                      onChange={() => togglePermission(p.id)}
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
                    Try another search term or select a different user.
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
