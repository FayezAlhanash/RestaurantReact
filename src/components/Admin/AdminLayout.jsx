import SideBar from "./SideBar";
import TopBar from "./TopBar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
    return (
        <div className="flex h-screen bg-gradient-to-br from-[#ffffff] to-[#c0b29f] font-[Raleway] ">

            <SideBar />

            <div className="flex-1 flex flex-col overflow-hidden">

                <TopBar />

                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>

            </div>

        </div>
    );
}

export default AdminLayout;