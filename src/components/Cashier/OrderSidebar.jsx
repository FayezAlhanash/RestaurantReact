import { Minus, Plus, Receipt, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import {
    createCashierOrder,
    fetchKitchenQueue,
    getCreatedOrderId,
    payCashierOrderInvoices,
} from "../../utils/kitchenOrders";

function OrderSidebar({ cartItems, setCartItems }) {
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");

    const removeItem = (indexToRemove) => {
        setCartItems((items) => items.filter((_, index) => index !== indexToRemove));
    };

    const changeQuantity = (indexToChange, amount) => {
        setCartItems((items) =>
            items
                .map((item, index) =>
                    index === indexToChange
                        ? { ...item, quantity: Math.max(0, item.quantity + amount) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const itemCount = cartItems.reduce((totalCount, item) => totalCount + item.quantity, 0);

    const placeOrder = async () => {
        if (!cartItems.length) return;

        setIsSubmitting(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const response = await createCashierOrder(cartItems, "takeaway");
            await payCashierOrderInvoices(response, paymentMethod);
            const orderIds = String(getCreatedOrderId(response) || "")
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);
            let isInKitchenQueue = false;

            try {
                const kitchenQueue = await fetchKitchenQueue();
                isInKitchenQueue =
                    orderIds.length === 0 ||
                    orderIds.every((orderId) =>
                        kitchenQueue.some((order) => String(order.id) === String(orderId))
                    );
            } catch {
                isInKitchenQueue = true;
            }

            setCartItems([]);
            setSuccessMessage(
                isInKitchenQueue
                    ? `${orderIds.length > 1 ? "Orders" : "Order"} #${orderIds.join(", ")} paid and sent to kitchen`
                    : `${orderIds.length > 1 ? "Orders" : "Order"} #${orderIds.join(", ")} paid, but not in kitchen queue`
            );

            window.setTimeout(() => {
                setSuccessMessage("");
            }, 3500);
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat().find(Boolean)
                : "";

            setErrorMessage(
                firstValidationError ||
                error.response?.data?.message ||
                error.message ||
                    "Order was not sent. Check the cashier order API."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-full min-h-[520px] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-[#EEE5E1] px-5 py-5 sm:px-6">
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} className="text-[#7F1D1D]" />
                        <h2 className="text-xl font-extrabold">Current order</h2>
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#94837D]">Takeaway · Order #1029</p>
                </div>
                <span className="rounded-full bg-[#F9ECEC] px-3 py-1.5 text-xs font-bold text-[#7F1D1D]">{itemCount} items</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {cartItems.length === 0 ? (
                    <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
                        <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#F8F3EF] text-[#B29F97]">
                            <Receipt size={28} />
                        </div>
                        <h3 className="mt-4 font-extrabold">Your order is empty</h3>
                        <p className="mt-1 max-w-52 text-sm leading-5 text-[#978780]">Choose an item from the menu to start a new order.</p>
                    </div>
                ) : (
                    cartItems.map((item, index) => (
                        <div key={`${item.id}-${item.size}-${index}`} className="rounded-[20px] border border-[#EEE5E1] bg-[#FCFAF8] p-3">
                            <div className="flex gap-3">
                                <img src={`${item.image}?auto=format&fit=crop&w=180&q=70`} alt={item.title} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-extrabold">{item.title}</h3>
                                            <p className="mt-0.5 text-xs capitalize text-[#9A8982]">{item.size}</p>
                                        </div>
                                        <button onClick={() => removeItem(index)} aria-label={`Remove ${item.title}`} className="text-[#B7A8A2] transition hover:text-[#7F1D1D]">
                                            <Trash2 size={17} />
                                        </button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center rounded-xl border border-[#E5D8D2] bg-white p-0.5">
                                            <button onClick={() => changeQuantity(index, -1)} aria-label="Decrease quantity" className="grid h-7 w-7 place-items-center rounded-lg text-[#7F1D1D] hover:bg-[#F9ECEC]"><Minus size={14} /></button>
                                            <span className="w-7 text-center text-xs font-extrabold">{item.quantity}</span>
                                            <button onClick={() => changeQuantity(index, 1)} aria-label="Increase quantity" className="grid h-7 w-7 place-items-center rounded-lg text-[#7F1D1D] hover:bg-[#F9ECEC]"><Plus size={14} /></button>
                                        </div>
                                        <span className="text-sm font-extrabold text-[#7F1D1D]">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            {item.notes && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs italic text-[#82716B]">“{item.notes}”</p>}
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-[#EEE5E1] bg-white px-5 py-5 sm:px-6">
                <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-[#82716B]"><span>Subtotal</span><span className="font-bold text-[#443936]">${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[#82716B]"><span>Tax (5%)</span><span className="font-bold text-[#443936]">${tax.toFixed(2)}</span></div>
                </div>
                <div className="my-4 border-t border-dashed border-[#DCCFC9]" />
                <div className="mb-5 flex items-end justify-between">
                    <span className="font-extrabold">Total</span>
                    <span className="text-2xl font-black text-[#7F1D1D]">${total.toFixed(2)}</span>
                </div>
                <div className="mb-4">
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#9A8982]">
                        Payment
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#E5D8D2] bg-[#FCFAF8] p-1">
                        {[
                            { id: "cash", label: "Cash" },
                            { id: "stripe", label: "Stripe" },
                        ].map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setPaymentMethod(method.id)}
                                className={`rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${
                                    paymentMethod === method.id
                                        ? "bg-[#7F1D1D] text-white shadow-sm"
                                        : "text-[#8A7972] hover:bg-white"
                                }`}
                            >
                                {method.label}
                            </button>
                        ))}
                    </div>
                </div>
                {successMessage && (
                    <p className="mb-3 rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-extrabold text-green-700">
                        {successMessage}
                    </p>
                )}
                {errorMessage && (
                    <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-extrabold text-red-700">
                        {errorMessage}
                    </p>
                )}
                <button onClick={placeOrder} disabled={!cartItems.length || isSubmitting} className="w-full rounded-2xl bg-[#7F1D1D] py-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(127,29,29,0.18)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:bg-[#C9BAB5] disabled:shadow-none">
                    {isSubmitting ? "Sending..." : `Pay ${paymentMethod === "cash" ? "cash" : "Stripe"} · $${total.toFixed(2)}`}
                </button>
                {cartItems.length > 0 && (
                    <button onClick={() => setCartItems([])} className="mt-2.5 w-full py-2 text-xs font-bold text-[#9A8982] transition hover:text-[#7F1D1D]">Clear order</button>
                )}
            </div>
        </div>
    );
}

export default OrderSidebar;
