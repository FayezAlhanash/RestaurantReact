import { Minus, Plus, Receipt, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    createCashierOrder,
    fetchCashierOrderDetail,
    fetchKitchenQueue,
    getCreatedOrderId,
    payCashierOrderInvoices,
} from "../../utils/kitchenOrders";
import { createStripeCardElement } from "../../utils/stripePayments";
import { getCartTotals } from "../../utils/tax";
import {
    FOOD_UNAVAILABLE_MESSAGE,
    hasUnavailableCartItems,
    isFoodOrderable,
} from "../../utils/foodAvailability";

function OrderSidebar({ cartItems, setCartItems, canProcessPayments = true }) {
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isStripeReady, setIsStripeReady] = useState(false);
    const [stripeCardMessage, setStripeCardMessage] = useState("");
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const stripeCardContainerRef = useRef(null);
    const stripeCardRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const setStripeState = (ready, message = "") => {
            window.setTimeout(() => {
                if (!isMounted) return;

                setIsStripeReady(ready);
                setStripeCardMessage(message);
            }, 0);
        };

        if (paymentMethod !== "stripe") {
            stripeCardRef.current?.destroy();
            stripeCardRef.current = null;
            setStripeState(false);
            return undefined;
        }

        setStripeState(false, "Loading Stripe...");

        createStripeCardElement(stripeCardContainerRef.current)
            .then((stripeCardSetup) => {
                if (!isMounted || !stripeCardSetup) return;

                stripeCardRef.current = stripeCardSetup.card;
                setStripeState(true);

                stripeCardSetup.card.on("change", (event) => {
                    setStripeCardMessage(event.error?.message || "");
                });
            })
            .catch((error) => {
                if (!isMounted) return;

                setStripeState(false, error.message || "Stripe could not be loaded.");
            });

        return () => {
            isMounted = false;
            stripeCardRef.current?.destroy();
            stripeCardRef.current = null;
        };
    }, [paymentMethod]);

    const removeItem = (indexToRemove) => {
        setCartItems((items) => items.filter((_, index) => index !== indexToRemove));
        setPendingDeleteIndex(null);
    };

    const changeQuantity = (indexToChange, amount) => {
        const item = cartItems[indexToChange];

        if (amount < 0 && Number(item?.quantity ?? 0) <= 1) {
            setPendingDeleteIndex(indexToChange);
            return;
        }

        setPendingDeleteIndex(null);
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

    const { subtotal, tax, total: estimatedTotal } = getCartTotals(cartItems);
    const itemCount = cartItems.reduce((totalCount, item) => totalCount + item.quantity, 0);
    const hasUnavailableOrderItems = hasUnavailableCartItems(cartItems);

    const placeOrder = async () => {
        if (!cartItems.length) return;
        if (hasUnavailableOrderItems) {
            setSuccessMessage("");
            setErrorMessage(FOOD_UNAVAILABLE_MESSAGE);
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            if (!canProcessPayments) {
                throw new Error(
                    "You need Process Payments permission to pay takeaway orders."
                );
            }

            if (paymentMethod === "stripe" && !isStripeReady) {
                throw new Error("Stripe is still loading. Try again in a moment.");
            }

            const response = await createCashierOrder(cartItems, "takeaway");
            const orderIds = String(getCreatedOrderId(response) || "")
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);
            const orderDetails = [];

            for (const orderId of orderIds) {
                const orderDetail = await fetchCashierOrderDetail(orderId);

                if (orderDetail) {
                    orderDetails.push(orderDetail);
                }
            }

            const responseOrders = Array.isArray(response?.orders)
                ? response.orders
                : Array.isArray(response?.data)
                    ? response.data
                    : [];
            const paymentSource = orderDetails.length
                ? { ...response, orders: [...orderDetails, ...responseOrders] }
                : response;

            await payCashierOrderInvoices(
                paymentSource,
                paymentMethod,
                stripeCardRef.current
            );
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
            const orderLabel = orderIds.length
                ? `${orderIds.length > 1 ? "Orders" : "Order"} #${orderIds.join(", ")}`
                : "Order";

            setSuccessMessage(
                isInKitchenQueue
                    ? `${orderLabel} paid and sent to kitchen`
                    : `${orderLabel} paid, but not in kitchen queue`
            );
            window.dispatchEvent(new CustomEvent("big4:orders-updated"));
            window.dispatchEvent(new CustomEvent("big4:poll-notifications-now"));
            window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent("big4:orders-updated"));
                window.dispatchEvent(new CustomEvent("big4:poll-notifications-now"));
            }, 1200);

            window.setTimeout(() => {
                setSuccessMessage("");
            }, 3500);
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat().find(Boolean)
                : "";
            const status = error.response?.status;
            const message = error.response?.data?.message;
            const errorText = JSON.stringify(error.response?.data || error.message || "");
            const isMissingPreparationSnapshotColumn =
                errorText.includes("preparation_batch_size_snapshot") ||
                errorText.includes("preparation_time_snapshot");

            setErrorMessage(
                isMissingPreparationSnapshotColumn
                    ? "Order could not be saved. The backend database needs the latest order-items migration."
                    :
                firstValidationError ||
                (status === 401 || status === 403 || message === "Unauthorized."
                    ? "You need Process Payments permission to pay takeaway orders."
                    : message) ||
                    error.message ||
                    "Order was not sent. Check the cashier order API."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-full min-h-[520px] flex-col bg-[#0F1517] text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#11191B]/88 px-4 py-3.5 sm:px-5">
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} className="text-[#7F1D1D]" />
                        <h2 className="text-xl font-black tracking-tight">Current order</h2>
                    </div>
                    <p className="mt-1 text-sm font-medium text-white/45">Takeaway · New order</p>
                </div>
                <span className="rounded-full border border-[#FF6B6B]/30 bg-[#7F1D1D]/28 px-2.5 py-1 text-xs font-black text-[#FFB3B3]">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
            </div>

            <div className="cashier-scroll flex-1 space-y-3 overflow-y-auto px-3.5 py-3 sm:px-4">
                {cartItems.length === 0 ? (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                        <div className="grid h-[52px] w-[52px] place-items-center rounded-[18px] border border-white/10 bg-white/[0.07] text-[#FFD166]">
                            <Receipt size={24} />
                        </div>
                        <h3 className="mt-3 font-extrabold">Your order is empty</h3>
                        <p className="mt-1 max-w-52 text-sm leading-5 text-white/48">Choose an item from the menu to start a new order.</p>
                    </div>
                ) : (
                    cartItems.map((item, index) => {
                        const isDeletePending = pendingDeleteIndex === index;
                        const canOrder = isFoodOrderable(item);

                        return (
                        <div key={`${item.id}-${item.size}-${index}`} className={`rounded-[22px] border p-3 shadow-[0_12px_26px_rgba(0,0,0,0.16)] ${
                            isDeletePending
                                ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/18"
                                : !canOrder
                                    ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/16"
                                : "border-white/[0.08] bg-[#1B2225]/95"
                        }`}>
                            <div className="flex gap-3">
                                <img src={`${item.image}?auto=format&fit=crop&w=180&q=70`} alt={item.title} className="h-[70px] w-[70px] shrink-0 rounded-[18px] object-cover ring-1 ring-white/10" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-extrabold">{item.title}</h3>
                                            <p className="mt-0.5 text-sm capitalize text-white/50">{item.size}</p>
                                            {!canOrder && (
                                                <p className="mt-1 text-xs font-black text-[#FFB3B3]">
                                                    Unavailable
                                                </p>
                                            )}
                                        </div>
                                        {isDeletePending ? (
                                            <div className="flex shrink-0 gap-1.5">
                                                <button onClick={() => removeItem(index)} aria-label={`Confirm remove ${item.title}`} className="grid h-8 w-8 place-items-center rounded-xl border border-[#FF6B6B]/60 bg-[#9B1C1F] text-white transition hover:bg-[#C81E2A] active:scale-95">
                                                    <Trash2 size={16} className="text-white [stroke:white]" />
                                                </button>
                                                <button onClick={() => setPendingDeleteIndex(null)} aria-label="Cancel remove" className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/65 transition hover:bg-white/10 hover:text-white active:scale-95">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setPendingDeleteIndex(index)} aria-label={`Remove ${item.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#FF6B6B]/30 bg-[#9B1C1F] text-white shadow-[0_8px_18px_rgba(155,28,31,0.20)] transition hover:border-[#FF8A8A]/55 hover:bg-[#C81E2A] active:scale-95">
                                                <Trash2 size={17} className="text-white [stroke:white]" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0F1517] p-0.5">
                                            <button onClick={() => changeQuantity(index, -1)} aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center rounded-lg text-[#FFD166] hover:bg-white/10"><Minus size={15} /></button>
                                            <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                                            <button onClick={() => changeQuantity(index, 1)} aria-label="Increase quantity" className="grid h-8 w-8 place-items-center rounded-lg text-[#FFD166] hover:bg-white/10"><Plus size={15} /></button>
                                        </div>
                                        <span className="text-base font-black text-[#FFD166]">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            {item.notes && <p className="mt-2 rounded-2xl bg-[#0F1517] px-3 py-2 text-sm italic leading-5 text-white/66">"{item.notes}"</p>}
                            {isDeletePending && (
                                <p className="mt-2 rounded-xl border border-[#7F1D1D]/45 bg-[#7F1D1D]/12 px-3 py-2 text-xs font-black !text-[#7F1D1D]">
                                    Delete this item? Press the red button to confirm.
                                </p>
                            )}
                        </div>
                        );
                    })
                )}
            </div>

            <div className="border-t border-white/[0.08] bg-[linear-gradient(180deg,#11191B_0%,#0D1214_100%)] px-4 py-3 shadow-[0_-18px_36px_rgba(0,0,0,0.26)] sm:px-5">
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-white/55"><span>Estimated subtotal</span><span className="font-bold text-white">${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-white/55"><span>Estimated tax</span><span className="font-bold text-white">${tax.toFixed(2)}</span></div>
                </div>
                <div className="my-2 border-t border-dashed border-white/15" />
                <div className="mb-2.5 flex items-end justify-between">
                    <span className="text-base font-black">Estimated total</span>
                    <span className="text-2xl font-black text-[#FFD166]">${estimatedTotal.toFixed(2)}</span>
                </div>
                <div className="mb-2.5">
                    <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-white/45">
                        Payment
                    </p>
                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.055] p-1">
                        {[
                            { id: "cash", label: "Cash" },
                            { id: "stripe", label: "Stripe" },
                        ].map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setPaymentMethod(method.id)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-extrabold transition ${
                                    paymentMethod === method.id
                                        ? "bg-[#7F1D1D] text-white shadow-[0_8px_18px_rgba(127,29,29,0.18)]"
                                        : "text-white/58 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {method.label}
                            </button>
                        ))}
                    </div>
                </div>
                {paymentMethod === "stripe" && (
                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-white/45">
                            Card
                        </p>
                        <div
                            ref={stripeCardContainerRef}
                            className="rounded-xl border border-white/10 bg-white px-3 py-3"
                        />
                        {stripeCardMessage && (
                            <p className="mt-2 text-xs font-bold text-red-700">
                                {stripeCardMessage}
                            </p>
                        )}
                    </div>
                )}
                {successMessage && (
                    <p className="mb-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-center text-sm font-extrabold text-emerald-300">
                        {successMessage}
                    </p>
                )}
                {errorMessage && (
                    <p className="mb-2 rounded-2xl border border-[#FF6B6B]/35 bg-[#7F1D1D]/24 px-4 py-2.5 text-center text-sm font-extrabold leading-5 text-[#FFB3B3]">
                        {errorMessage}
                    </p>
                )}
                {hasUnavailableOrderItems && !errorMessage && (
                    <p className="mb-2 rounded-2xl border border-[#FF6B6B]/35 bg-[#7F1D1D]/24 px-4 py-2.5 text-center text-sm font-extrabold leading-5 text-[#FFB3B3]">
                        {FOOD_UNAVAILABLE_MESSAGE}
                    </p>
                )}
                {!canProcessPayments && (
                    <p className="mb-2 rounded-2xl border border-[#FF6B6B]/35 bg-[#7F1D1D]/24 px-4 py-2.5 text-center text-sm font-extrabold leading-5 text-[#FFB3B3]">
                        You need Process Payments permission to pay takeaway orders.
                    </p>
                )}
                <button onClick={placeOrder} disabled={!cartItems.length || hasUnavailableOrderItems || isSubmitting || !canProcessPayments || (paymentMethod === "stripe" && !isStripeReady)} className="w-full rounded-2xl bg-[#7F1D1D] py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(127,29,29,0.24)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-100 disabled:shadow-none">
                    {isSubmitting ? "Sending..." : `Pay ${paymentMethod === "cash" ? "cash" : "Stripe"} · est. $${estimatedTotal.toFixed(2)}`}
                </button>
                {cartItems.length > 0 && (
                    <button onClick={() => setCartItems([])} className="mt-1.5 w-full py-1 text-sm font-bold text-white/45 transition hover:text-[#7F1D1D]">Clear order</button>
                )}
            </div>
        </div>
    );
}

export default OrderSidebar;
