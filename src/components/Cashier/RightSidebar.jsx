import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PublicIcon from '@mui/icons-material/Public';
function RightSidebar() {
    return (
        <div className="w-[90px] bg-white border-l min-h-screen flex flex-col items-center justify-between py-6 font-['raleway']">

            {/* Top Icons */}
            <div className="flex flex-col gap-6">

                <div className="bg-[#7F1D1D] text-white p-5 rounded-2xl cursor-pointer">
                    <HomeIcon sx={{ fontSize: 32 }} />
                </div>

                <div className="text-gray-600 p-4 hover:text-[#7F1D1D] cursor-pointer transition">
                    <MenuBookIcon sx={{ fontSize: 32 }} />
                </div>

                <div className="text-gray-600 p-4 hover:text-[#7F1D1D] cursor-pointer transition">
                    <ReceiptLongIcon sx={{ fontSize: 32 }} />
                </div>

                <div className="text-gray-600 p-4 hover:text-[#7F1D1D] cursor-pointer transition">
                    <SettingsIcon sx={{ fontSize: 32 }} />
                </div>

            </div>
            <div className="flex flex-col items-center gap-4">

                {/* Support */}
                <div className="bg-white border border-gray-300 p-3 rounded-2xl cursor-pointer hover:border-[#7F1D1D] transition">

                    <SupportAgentIcon sx={{ fontSize: 32 }} className="text-[#7F1D1D]" />

                </div>

                {/* Language */}
                <div className="bg-white border border-gray-300 p-3 rounded-2xl cursor-pointer hover:border-[#7F1D1D] transition">

                    <PublicIcon sx={{ fontSize: 32 }} className="text-[#7F1D1D]" />

                </div>

            </div>
            {/* Bottom */}
            <div className="text-red-700 cursor-pointer hover:scale-110 transition">
                <LogoutIcon p-4 sx={{ fontSize: 32, marginBottom: "15px" }} />
            </div>

        </div>
    )
}

export default RightSidebar