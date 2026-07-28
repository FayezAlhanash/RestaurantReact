import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../Admin/SideBar";
import TopBar from "../Admin/TopBar";

const SIDEBAR_WIDTH_KEY = "big4:sidebar-width";
const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 260;
const SIDEBAR_MAX_WIDTH = 460;

const clampSidebarWidth = (width) =>
    Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));

export default function UnifiedLayout({ outletContext = {} }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const savedWidth = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));

        return Number.isFinite(savedWidth)
            ? clampSidebarWidth(savedWidth)
            : SIDEBAR_DEFAULT_WIDTH;
    });
    const [isSidebarResizing, setIsSidebarResizing] = useState(false);
    const [search, setSearch] = useState("");
    const handleSidebarResizeStart = useCallback((event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();
        setIsSidebarResizing(true);

        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;

        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";

        const handlePointerMove = (moveEvent) => {
            const nextWidth = clampSidebarWidth(moveEvent.clientX);

            setSidebarWidth(nextWidth);
            localStorage.setItem(SIDEBAR_WIDTH_KEY, String(nextWidth));
        };

        const stopResize = () => {
            setIsSidebarResizing(false);
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopResize);
            window.removeEventListener("pointercancel", stopResize);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopResize);
        window.addEventListener("pointercancel", stopResize);
    }, []);

    const resetSidebarWidth = useCallback(() => {
        setSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(SIDEBAR_DEFAULT_WIDTH));
    }, []);

    return (
        <div className="app-shell flex min-h-dvh bg-[#101010] font-merriweather lg:h-dvh lg:overflow-hidden">
            <SideBar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                width={sidebarWidth}
                isResizing={isSidebarResizing}
                onResizeStart={handleSidebarResizeStart}
                onResizeReset={resetSidebarWidth}
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
