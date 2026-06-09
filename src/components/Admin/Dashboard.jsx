import SideBar from "./SideBar";
import TopBar from "./TopBar";
import MainContent from "./MainContent";

function Dashboard() {
    return (
        <div className="flex h-screen bg-[#f8f6f6] font-['lemon']">
            <SideBar />

            <div className="flex-1 flex flex-col">
                <TopBar />
                <MainContent />
            </div>
        </div>
    );
}

export default Dashboard;