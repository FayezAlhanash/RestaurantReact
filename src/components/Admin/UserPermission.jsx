import { useEffect, useState } from "react";
import api from "../../API/axios";
import { getStoredUser, storeUser } from "../../utils/auth";
import { canAssignPermissionToUser } from "../../utils/permissionScopes";

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const getUserName = (user) =>
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email ||
    `User #${user.id}`;

export default function UserPermission() {
    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPerms, setUserPerms] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [permissionRestaurantIds, setPermissionRestaurantIds] = useState({});
    const [permissionError, setPermissionError] = useState("");

    const refreshCurrentUserPermissions = async () => {
        const currentUser = getStoredUser();

        if (!currentUser) return;

        const res = await api.get("/profile/permissions");
        storeUser(currentUser, res.data);
    };

    const selectUser = (user) => {
        setSelectedUser(user);

        const directPermissions = user.user_permissions || user.permissions || [];
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
                .filter((permission) =>
                    canAssignPermissionToUser(user, permission)
                )
                .map((p) => p.id)
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
            const updatedUser = usersList.find(
                (user) => user.id === selectedUser.id
            );

            if (updatedUser) {
                selectUser(updatedUser);
            }
        }
    };

    const fetchPermissions = async () => {
        const res = await api.get("/admin/permissions");
        setPermissions(getList(res.data, "permissions"));
    };

    const fetchRestaurants = async () => {
        const res = await api.get("/restaurants");
        setRestaurants(getList(res.data, "restaurants"));
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUsers();
        fetchPermissions();
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

        const permission = permissions.find((item) => item.id === permissionId);
        if (!canAssignPermissionToUser(selectedUser, permission)) return;
        setPermissionError("");

        const exists = userPerms.includes(permissionId);

        if (exists) {
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

            const res = await api.delete(`/admin/users/${selectedUser.id}/permissions`, {
                data: payload,
            });
            const updatedUser = res.data?.user;

            if (updatedUser) {
                selectUser(updatedUser);

                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === updatedUser.id ? updatedUser : user
                    )
                );
            } else {
                setUserPerms(prev => prev.filter(id => id !== permissionId));

                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === selectedUser.id
                            ? {
                                  ...user,
                                  user_permissions: (
                                      user.user_permissions ||
                                      user.permissions ||
                                      []
                                  ).filter(
                                      (permission) =>
                                          permission.id !== permissionId
                                  ),
                              }
                            : user
                    )
                );
            }

            await refreshCurrentUserPermissions();
        } else {
            const restaurantId =
                selectedUser.restaurant_id ||
                permissionRestaurantIds[permissionId] ||
                "";

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
                formData
            );
            const updatedUser = res.data?.user;

            if (updatedUser) {
                selectUser(updatedUser);
                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === updatedUser.id ? updatedUser : user
                    )
                );
            } else {
                setUserPerms(prev => [...prev, permissionId]);

                if (permission) {
                    setUsers((prev) =>
                        prev.map((user) =>
                            user.id === selectedUser.id
                                ? {
                                      ...user,
                                      user_permissions: [
                                          ...(user.user_permissions ||
                                              user.permissions ||
                                              []),
                                          {
                                              ...permission,
                                              pivot: {
                                                  ...(permission.pivot || {}),
                                                  restaurant_id:
                                                      permission.scope ===
                                                      "restaurant"
                                                          ? restaurantId
                                                          : null,
                                              },
                                          },
                                      ],
                                  }
                                : user
                        )
                    );
                }
            }

            await refreshCurrentUserPermissions();
        }
    };

    return (
        <div className="grid grid-cols-3 gap-6 p-6">

            {/* USERS */}
            <div className="border p-4 rounded">
                <h2 className="font-bold mb-3">Users</h2>

                {users.map(user => (
                    <div
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className={`p-2 cursor-pointer rounded mb-2 ${
                            selectedUser?.id === user.id
                                ? "bg-red-100"
                                : "hover:bg-gray-100"
                        }`}
                    >
                        {getUserName(user)} - {user.role?.name}
                    </div>
                ))}
            </div>

            {/* PERMISSIONS */}
            <div className="col-span-2 border p-4 rounded">
                <h2 className="font-bold mb-3">
                    Permissions
                </h2>

                {permissionError && (
                    <p className="mb-3 text-sm text-red-600">
                        {permissionError}
                    </p>
                )}

                {!selectedUser && (
                    <p className="text-gray-500">
                        Select a user
                    </p>
                )}

                {selectedUser && (
                    <div className="grid grid-cols-2 gap-2">
                        {permissions.map((p) => {
                            const checked = userPerms.includes(p.id);
                            const needsRestaurant =
                                p.scope === "restaurant" &&
                                !selectedUser.restaurant_id &&
                                !checked;

                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-2 border p-2 rounded"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => togglePermission(p.id)}
                                    />
                                    <span className="min-w-0 flex-1">
                                        {p.key ?? p.name}
                                    </span>

                                    {needsRestaurant && (
                                        <select
                                            value={
                                                permissionRestaurantIds[p.id] ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                handleRestaurantChange(
                                                    p.id,
                                                    e.target.value
                                                )
                                            }
                                            className="min-w-0 rounded border px-2 py-1 text-sm"
                                        >
                                            <option value="">
                                                Restaurant
                                            </option>
                                            {restaurants.map((restaurant) => (
                                                <option
                                                    key={restaurant.id}
                                                    value={restaurant.id}
                                                >
                                                    {restaurant.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
