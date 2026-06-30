import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

function ProductModal({ isOpen, onClose, item, addToCart }) {
    const [selectedSize, setSelectedSize] = useState("small");
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantity(1);
    }, [item]);

    const closeModal = () => {
        setQuantity(1);
        setSelectedSize("small");
        setNotes("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211715]/55 p-3 backdrop-blur-sm sm:p-6">
            <div className="grid max-h-[calc(100dvh-1.5rem)] w-full max-w-[760px] overflow-y-auto rounded-[30px] bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-56 overflow-hidden bg-[#EDE5DF] md:min-h-[560px]">
                    <img src={`${item?.image}?auto=format&fit=crop&w=900&q=85`} alt={item?.title} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute bottom-5 left-5 rounded-full bg-[#F7C948] px-3 py-1.5 text-xs font-extrabold text-[#382B10]">Freshly prepared</span>
                </div>

                <div className="relative flex flex-col p-5 sm:p-7">
                    <button onClick={closeModal} aria-label="Close product" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#F7F2EF] text-[#695A54] transition hover:bg-[#F2E7E3] hover:text-[#7F1D1D]">
                        <X size={20} />
                    </button>

                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A28F87]">Customize item</p>
                    <h2 className="mt-2 pr-12 text-2xl font-black text-[#2D2421] sm:text-3xl">{item?.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#887770]">{item?.description}</p>

                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold">Choose size</h3>
                            <span className="text-xs text-[#A08D85]">Required</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {["small", "large"].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`rounded-2xl border px-4 py-3.5 text-left transition ${selectedSize === size ? "border-[#7F1D1D] bg-[#F9ECEC] text-[#7F1D1D]" : "border-[#E7DCD6] text-[#77665F] hover:border-[#CBB9B1]"}`}
                                >
                                    <span className="block text-sm font-extrabold capitalize">{size}</span>
                                    <span className="mt-0.5 block text-xs opacity-70">{size === "small" ? "Regular serving" : "+ $2.00"}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F8F4F1] p-3">
                        <div>
                            <p className="text-sm font-extrabold">Quantity</p>
                            <p className="text-xs text-[#998780]">How many?</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#7F1D1D] shadow-sm"><Minus size={16} /></button>
                            <span className="w-5 text-center font-black">{quantity}</span>
                            <button onClick={() => setQuantity((value) => value + 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-[#7F1D1D] text-white shadow-sm"><Plus size={16} /></button>
                        </div>
                    </div>

                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Special instructions (optional)" rows={3} className="mt-4 w-full resize-none rounded-2xl border border-[#E7DCD6] bg-white p-4 text-sm outline-none transition placeholder:text-[#AA9A94] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10" />

                    <button
                        onClick={() => {
                            addToCart({
                                ...item,
                                price: item.price + (selectedSize === "large" ? 2 : 0),
                                quantity,
                                size: selectedSize,
                                notes,
                            });
                            closeModal();
                        }}
                        className="mt-5 flex w-full items-center justify-between rounded-2xl bg-[#7F1D1D] px-5 py-4 font-extrabold text-white shadow-[0_10px_24px_rgba(127,29,29,0.2)] transition hover:bg-[#681718] active:scale-[0.99]"
                    >
                        <span className="flex items-center gap-2"><ShoppingBag size={19} /> Add to order</span>
                        <span>${((item?.price + (selectedSize === "large" ? 2 : 0)) * quantity).toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductModal;
