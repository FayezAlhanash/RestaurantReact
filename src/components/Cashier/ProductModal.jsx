import { useState, useEffect } from "react"
function ProductModal({ isOpen, onClose, item, addToCart }) {
    const [selectedSize, setSelectedSize] = useState("small")
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState("")
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantity(1)
    }, [item])

    if (!isOpen) return null
    return (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 font-['raleway']">

            <div className="w-full max-w-[500px] max-h-[calc(100dvh-1.5rem)] bg-[#d1c5c5] rounded-3xl overflow-y-auto shadow-2xl">

                {/* Image */}
                <img
                    src={item?.image}
                    alt="burger"
                    className="w-full h-40 sm:h-64 object-cover"
                />

                {/* Content */}
                <div className="p-4 sm:p-6">

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        {item?.title}
                    </h1>

                    <p className="text-gray-500 mb-6">
                        {item?.description}
                    </p>

                    {/* Sizes */}
                    <div className="grid grid-cols-2 gap-4 mb-6">

                        <button
                            onClick={() => setSelectedSize("small")}
                            className={`cursor-pointer
        py-3 rounded-2xl font-semibold border-2 transition
        ${selectedSize === "small"
                                    ? "border-[#7F1D1D] bg-red-50 text-[#7F1D1D]"
                                    : "border-gray-200 bg-white text-gray-500"
                                }
    `}
                        >
                            Small
                        </button>

                        <button
                            onClick={() => setSelectedSize("large")}
                            className={`cursor-pointer
        py-3 rounded-2xl font-semibold border-2 transition
        ${selectedSize === "large"
                                    ? "border-[#7F1D1D] bg-red-50 text-[#7F1D1D]"
                                    : "border-gray-200 bg-white text-gray-500"
                                }
    `}
                        >
                            Large
                        </button>

                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between mb-6">

                        <span className="font-semibold text-lg">
                            Quantity
                        </span>

                        <div className="flex items-center gap-4">

                            <button
                                onClick={() => {
                                    if (quantity > 1) {
                                        setQuantity(quantity - 1)
                                    }
                                }}
                                className="cursor-pointer w-10 h-10 rounded-full bg-gray-100 text-xl"
                            >
                                -
                            </button>

                            <span className="text-xl font-bold">
                                {quantity}
                            </span>

                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="cursor-pointer w-10 h-10 rounded-full bg-gray-100 text-xl"
                            >
                                +
                            </button>

                        </div>

                    </div>

                    {/* Notes */}
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes..."
                        className="w-full border border-gray-300 rounded-2xl p-4 outline-none resize-none mb-6"
                        rows={3}
                    />

                    {/* Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">

                        <button
                            onClick={() => {
                                setQuantity(1)
                                onClose()
                                setNotes("")
                            }}
                            className="flex-1 border border-gray-300 py-4 rounded-2xl font-semibold"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={() => {

                                addToCart({
                                    ...item,
                                    quantity,
                                    size: selectedSize,
                                    notes
                                })

                                setQuantity(1)
                                setNotes("")
                                onClose()
                                setSelectedSize("small")
                            }}
                            className="flex-1 bg-[#7F1D1D] text-white py-4 rounded-2xl font-semibold"
                        >
                            Add To Cart
                        </button>

                    </div>

                </div>

            </div>

        </div>

    )
}

export default ProductModal
