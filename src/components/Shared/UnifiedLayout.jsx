import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../Admin/SideBar";
import TopBar from "../Admin/TopBar";

export default function UnifiedLayout({ outletContext = {} }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [search, setSearch] = useState("");

    return (
        <div className="app-shell flex min-h-dvh bg-[#101517] font-[Raleway] lg:h-dvh lg:overflow-hidden">
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

                <div className="app-content min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_86%_10%,rgba(127,29,29,0.18),transparent_30%),radial-gradient(circle_at_18%_22%,rgba(255,209,102,0.12),transparent_26%),radial-gradient(circle_at_60%_82%,rgba(52,211,153,0.08),transparent_30%),linear-gradient(145deg,#0D1214_0%,#12191C_52%,#24171A_100%)]">
                    <Outlet context={{ ...outletContext, search }} />
                </div>
            </div>
        </div>
    );
}
