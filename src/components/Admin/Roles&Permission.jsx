import { useEffect, useState } from "react";
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

export default function RolesPermission() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

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
        setRolePermissions((updatedRole.permissions || []).map((p) => p.id));
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
      (role.permissions || [])
        .filter((permission) => canAssignPermissionToRole(role, permission))
        .map((p) => p.id)
    );
  };

  // toggle permission
  const togglePermission = async (permissionId) => {
    if (!selectedRole) return;

    const permission = permissions.find((item) => item.id === permissionId);
    if (!canAssignPermissionToRole(selectedRole, permission)) return;

    const hasPermission = rolePermissions.includes(permissionId);

    if (hasPermission) {
      const res = await api.delete(`/admin/roles/${selectedRole.id}/permissions`, {
        data: {
          permission_id: permissionId,
        },
      });
      const updatedRole = res.data?.role;

      if (updatedRole) {
        setSelectedRole(updatedRole);
        setRolePermissions((updatedRole.permissions || []).map((p) => p.id));

        setRoles((prev) =>
          prev.map((role) =>
            role.id === updatedRole.id ? updatedRole : role
          )
        );
      } else {
        setRolePermissions((prev) =>
          prev.filter((id) => id !== permissionId)
        );

        setRoles((prev) =>
          prev.map((role) =>
            role.id === selectedRole.id
              ? {
                  ...role,
                  permissions: (role.permissions || []).filter(
                    (permission) => permission.id !== permissionId
                  ),
                }
              : role
          )
        );
      }

      await refreshCurrentUserPermissions();
    } else {
      const formData = new FormData();
      formData.append("permission_id", permissionId);

      const res = await api.post(
        `/admin/roles/${selectedRole.id}/permissions`,
        formData
      );
      const updatedRole = res.data?.role;

      if (updatedRole) {
        setSelectedRole(updatedRole);
        setRolePermissions((updatedRole.permissions || []).map((p) => p.id));
        setRoles((prev) =>
          prev.map((role) =>
            role.id === updatedRole.id ? updatedRole : role
          )
        );
      } else {
        setRolePermissions((prev) => [...prev, permissionId]);

        if (permission) {
          setRoles((prev) =>
            prev.map((role) =>
              role.id === selectedRole.id
                ? {
                    ...role,
                    permissions: [
                      ...(role.permissions || []),
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
  };

  return (
    <div className="p-6 grid grid-cols-3 gap-6">
      {/* ROLES */}
      <div className="border p-4 rounded">
        <h2 className="font-bold mb-3">Roles</h2>

        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => handleSelectRole(role)}
            className={`p-2 cursor-pointer rounded mb-2 ${
              selectedRole?.id === role.id
                ? "bg-red-100"
                : "hover:bg-gray-100"
            }`}
          >
            {role.name}
          </div>
        ))}
      </div>

      {/* PERMISSIONS */}
      <div className="col-span-2 border p-4 rounded">
        <h2 className="font-bold mb-3">
          Permissions {selectedRole && `(${selectedRole.name})`}
        </h2>

        {!selectedRole && (
          <p className="text-gray-500">Select a role first</p>
        )}

        {selectedRole && (
          <div className="grid grid-cols-2 gap-2">
            {filterPermissionsForRole(selectedRole, permissions).map((perm) => {
              const checked = rolePermissions.includes(perm.id);

              return (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 border p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePermission(perm.id)}
                  />
                  <span>{perm.key ?? perm.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
