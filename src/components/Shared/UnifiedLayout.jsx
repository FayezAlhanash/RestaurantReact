import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../Admin/SideBar";
import TopBar from "../Admin/TopBar";

export default function UnifiedLayout({ outletContext = {} }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [search, setSearch] = useState("");

    return (
        <div className="app-shell flex min-h-dvh bg-[#101010] font-merriweather lg:h-dvh lg:overflow-hidden">
            <SideBar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
                <TopBar
                    onMenu={() => setSidebarOpen(true)}
                    onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
                    isSidebarCollapsed={sidebarCollapsed}
                    search={search}
                    setSearch={setSearch}
                />

                <div className="app-content min-h-0 flex-1 overflow-y-auto bg-[#101010]">
                    <Outlet context={{ ...outletContext, search }} />
                </div>
            </div>
        </div>
    );
}
