import {
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    UserCog,
    ShieldCheck,
    Table,
    LogOut,
    X
} from "lucide-react";

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../API/axios";
import { clearSession, getStoredUser, storeUser } from "../../utils/auth";
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";

function SideBar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState(() => getUserPermissions());

    const menu = [
        {
            icon: <LayoutDashboard size={20} />,
            title: "Dashboard",
            path: "/dashboard",
        },
        {
            icon: <UtensilsCrossed size={20} />,
            title: "Restaurants",
            path: "/restaurants",
            permissions: ["manage_restaurants"],
        },
        {
            icon: <Users size={20} />,
            title: "Employees",
            path: "/employee",
            permissions: ["manage_users"],
        },
        {
            icon: <UserCog size={20} />,
            title: "User Permissions",
            path: "/user-permissions",
            permissions: ["manage_permissions", "manage_users"],
        },
        {
            icon: <ShieldCheck size={20} />,
            title: "Roles",
            path: "/roles",
            permissions: ["manage_roles", "manage_permissions"],
        },
        {
            icon: <Table size={20} />,
            title: "Tables",
            path: "/tables",
            permissions: ["manage_tables"],
        },
    ];

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    useEffect(() => {
        const refreshPermissions = async () => {
            const user = getStoredUser();

            if (!user) return;

            try {
                const res = await api.get("/profile/permissions");
                const userPermissions = getProfileUserPermissions(res.data);
                const nextPermissions = toPermissionKeys(userPermissions);

                storeUser(user, res.data);
                if (nextPermissions.length) {
                    setPermissions(nextPermissions);
                }
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshPermissions();
    }, []);

    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) =>
            permissions.includes(permission)
        );

    return (
        <>
            {/* overlay */}
            {isOpen && (
                <button
                    aria-label="Close menu"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                />
            )}

            <aside
                className={`
                w-[280px] lg:w-[300px]
                h-dvh
                bg-white
                border-r
                flex flex-col
                fixed lg:sticky
                top-0 left-0 z-50
                transition-transform duration-300
                ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
            >
                {/* close button */}
                <button
                    aria-label="Close menu"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
                >
                    <X size={22} />
                </button>

                {/* header */}
                <div className="p-6 lg:p-8">
                    <h1 className="text-3xl font-bold text-[#7f1d1d]">
                        Big-4
                    </h1>
                    <p className="text-gray-500">
                        Enterprise Admin
                    </p>
                </div>

                {/* menu */}
                <div className="flex flex-col gap-2 px-4">

                    {menu
                        .filter(item => canShow(item.permissions))
                        .map((item, index) => (
                            <NavLink
                                key={index}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `
                                    flex items-center gap-4 p-4 rounded-xl transition-all
                                    ${isActive
                                        ? "bg-red-900 text-white shadow-lg"
                                        : "hover:bg-[#f5efef]"}
                                `
                                }
                            >
                                {item.icon}
                                {item.title}
                            </NavLink>
                        ))}
                </div>

                {/* logout */}
                <div className="p-4 border-t mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default SideBar;
