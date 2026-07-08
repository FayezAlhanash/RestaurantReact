import SideBar from "./SideBar";
import TopBar from "./TopBar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#ffffff] to-[#c0b29f] font-[Raleway] lg:h-screen">

            <SideBar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="min-w-0 flex-1 flex flex-col lg:overflow-hidden">

                <TopBar onMenu={() => setSidebarOpen(true)} />

                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>

            </div>

        </div>
    );
}

export default AdminLayout;
