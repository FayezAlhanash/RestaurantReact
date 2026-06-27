import {
  House,
  BookOpen,
  ReceiptText,
  Settings,
  LogOut,
  Headset,
  Globe,
} from "lucide-react";
function RightSidebar() {
    return (
        <div className="w-[90px] bg-white border-l min-h-screen flex flex-col items-center justify-between py-6 font-['raleway']">

            {/* Top Icons */}
            <div className="flex flex-col gap-6">

               <div className="bg-[#7F1D1D] text-white p-5 rounded-2xl cursor-pointer">
                    <House size={32} />
                </div>

                <div className="text-gray-600 p-4 hover:text-[#7F1D1D] cursor-pointer transition">
                    <BookOpen size={32} />
                </div>

                <div className="text-gray-600 p-4 hover:text-[#7F1D1D] cursor-pointer transition">
                    <ReceiptText size={32} />
                </div>

                <div className="text-gray-600 p-4 hover:text-[#7F1D1D] cursor-pointer transition">
                    <Settings size={32} />
                </div>

            </div>
             <div className="flex flex-col items-center gap-4">

                <div className="bg-white border border-gray-300 p-3 rounded-2xl cursor-pointer hover:border-[#7F1D1D] transition">
                    <Headset size={32} className="text-[#7F1D1D]" />
                </div>

                <div className="bg-white border border-gray-300 p-3 rounded-2xl cursor-pointer hover:border-[#7F1D1D] transition">
                    <Globe size={32} className="text-[#7F1D1D]" />
                </div>

            </div>
            {/* Bottom */}
            <div className="text-red-700 cursor-pointer hover:scale-110 transition">
                <LogOut size={32} />
            </div>


        </div>
    )
}

export default RightSidebar