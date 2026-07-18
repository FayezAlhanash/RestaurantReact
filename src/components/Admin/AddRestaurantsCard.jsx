import { ImagePlus, Plus, Store } from "lucide-react";

function AddRestaurantCard({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group min-h-[420px] rounded-[24px] border border-dashed border-[#FFD166]/35 bg-[linear-gradient(145deg,rgba(36,49,53,0.92),rgba(25,36,39,0.94))] p-5 text-left shadow-[0_18px_42px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.03] transition duration-200 hover:-translate-y-1 hover:border-[#FFD166]/60 hover:bg-[#243135] hover:shadow-[0_24px_58px_rgba(0,0,0,0.3)]"
        >
            <div className="flex h-full flex-col justify-between rounded-[20px] border border-white/10 bg-[#172124] p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] text-white shadow-[0_12px_24px_rgba(127,29,29,0.22)] transition group-hover:scale-105">
                        <Plus size={22} />
                    </div>
                    <span className="rounded-full border border-[#FFD166]/30 bg-[#FFD166]/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#FFD166]">
                        New branch
                    </span>
                </div>

                <div className="my-10 grid place-items-center">
                    <div className="relative grid h-32 w-32 place-items-center rounded-[28px] border border-white/10 bg-[#0D1214] text-[#7F1D1D] shadow-inner ring-1 ring-white/[0.04]">
                        <Store size={44} />
                        <span className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#FFE184_0%,#FFC142_52%,#C47A00_100%)] text-[#241F1D] shadow-lg">
                            <ImagePlus size={18} />
                        </span>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-black text-white">
                        Add Restaurant
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/50">
                        Create another restaurant with logo images, description,
                        and tax settings.
                    </p>
                </div>
            </div>
        </button>
    );
}

export default AddRestaurantCard;
