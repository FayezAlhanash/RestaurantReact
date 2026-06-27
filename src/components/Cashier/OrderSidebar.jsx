import { Trash2 } from "lucide-react";
function OrderSidebar({ cartItems, setCartItems }) {
    const removeItem = (indexToRemove) => {

        const updatedCart = cartItems.filter(
            (_, index) => index !== indexToRemove
        )

        setCartItems(updatedCart)
    }


    const subtotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    )

    const tax = subtotal * 0.05

    const total = subtotal + tax
    return (

        <div className="bg-white flex flex-col font-['raleway'] h-auto md:h-screen">
            {/* Header */}
            <div className="p-6 border-b">

                <h1 className="text-2xl font-bold text-gray-800">
                    Current Order
                </h1>

                <p className="text-gray-400 mt-1">
                    Order #1029
                </p>

            </div>

            {/* Orders */}
            <div className="flex-1 overflow-y-auto p-4">

                {
                    cartItems.map((item, index) => (

                        <div
                            key={index}
                            className="flex gap-4 mb-5 bg-[#F8F5F1] p-3 rounded-2xl"
                        >

                            {/* Image */}
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-20 h-20 rounded-2xl object-cover"
                            />

                            {/* Info */}
                            <div className="flex-1">

                                <div className="flex items-start justify-between">

                                    <div>

                                        <h2 className="font-bold text-gray-800">
                                            {item.title}
                                        </h2>

                                        <p className="text-sm text-gray-400">
                                            {item.size}
                                        </p>
                                        {
                                            item.notes && (
                                                <p className="text-xs text-gray-500 mt-1 italic">
                                                    "{item.notes}"
                                                </p>
                                            )
                                        }
                                    </div>

                                    <div className="flex flex-col items-end">

                                        <span className="font-bold text-[#7F1D1D]">
                                            ${item.price}
                                        </span>

                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-red-700 hover:text-red-800 transition mt-2"
                                        >
                                            <Trash2 size={18} className="md:w-[22px] md:h-[22px]" />
                                        </button>

                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4">

                                    <span className="font-bold">
                                        x{item.quantity}
                                    </span>

                                </div>

                            </div>

                        </div>

                    ))
                }

            </div>

            {/* Footer */}
            <div className="border-t p-5 sticky bottom-0 bg-white">
                <div className="flex items-center justify-between mb-3">

                    <span className="text-gray-500">
                        Subtotal
                    </span>

                    <span className="font-bold">
                        ${subtotal.toFixed(2)}
                    </span>

                </div>

                <div className="flex items-center justify-between mb-6">

                    <span className="text-gray-500">
                        Tax
                    </span>

                    <span className="font-bold">
                        ${tax.toFixed(2)}
                    </span>

                </div>
                <div className="flex items-center justify-between mb-6">

                    <span className="text-lg font-bold text-gray-800">
                        Total
                    </span>

                    <span className="text-xl font-bold text-[#7F1D1D]">
                        ${total.toFixed(2)}
                    </span>

                </div>

                <button className="cursor-pointer w-full bg-[#7F1D1D] text-white py-4 rounded-2xl font-bold hover:bg-[#6E1414] transition">

                    Place Order

                </button>
                <button
                    onClick={() => setCartItems([])}
                    className="cursor-pointer w-full mt-3 border border-red-300 text-red-600 py-3 rounded-2xl font-bold hover:bg-red-50 transition"
                >

                    Clear Order

                </button>
            </div>

        </div>

    )
}

export default OrderSidebar
