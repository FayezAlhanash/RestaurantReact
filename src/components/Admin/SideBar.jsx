import {
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    ShieldCheck,
    Table,
    Settings,
    LogOut
} from "lucide-react";
import { NavLink } from "react-router-dom";

function SideBar() {
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
        },
        {
            icon: <Users size={20} />,
            title: "Employees",
            path: "/employees",
        },
        {
            icon: <ShieldCheck size={20} />,
            title: "Roles",
            path: "/roles",
        },
        {
            icon: <Table size={20} />,
            title: "Tables",
            path: "/tables",
        },
    ];

    return (
        <div
            className="
w-[260px]
h-screen
bg-white
border-r

flex
flex-col

sticky
top-0
        "
        >
            <div className="p-8">
                <h1 className="text-3xl font-bold text-[#7f1d1d]">
                    Big-4
                </h1>

                <p className="text-gray-500">
                    Enterprise Admin
                </p>
            </div>

            <div className="flex flex-col gap-2 px-4">

                {menu.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        className={({ isActive }) =>
                            `
            flex
            items-center
            gap-4
            p-4
            rounded-xl
            transition-all
            ${isActive
                                ? "bg-red-900 text-white shadow-lg"
                                : "hover:bg-[#f5efef]"
                            }
            `
                        }
                    >
                        {item.icon}
                        {item.title}
                    </NavLink>
                ))}

            </div>

        </div>
    );
}

export default SideBar;