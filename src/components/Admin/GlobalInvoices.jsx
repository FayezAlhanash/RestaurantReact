import {
    AlertTriangle,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    DollarSign,
    Globe2,
    Loader2,
    ReceiptText,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Store,
    Utensils,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import {
    nonNegativeNumberInputProps,
    toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";

function getList(data) {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.invoices)) return data.invoices;
    if (Array.isArray(data?.data?.invoices)) return data.data.invoices;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data)) return data;

    return [];
}

function getPagination(data, fallbackPage = 1, itemCount = 0) {
    const meta = data?.pagination ?? data?.data?.pagination ?? data?.meta ?? data?.data?.meta ?? data ?? {};
    const links = data?.links ?? data?.data?.links ?? {};
    const currentPage = Number(
        meta.current_page ??
            meta.currentPage ??
            data?.current_page ??
            data?.currentPage ??
            fallbackPage
    );
    const lastPage = Number(
        meta.last_page ??
            meta.lastPage ??
            data?.last_page ??
            data?.lastPage ??
            currentPage
    );
    const totalValue =
        meta.total ??
        data?.total ??
        data?.data?.total ??
        (lastPage <= 1 ? itemCount : null);
    const total = totalValue === null ? null : Number(totalValue);
    const hasNext =
        Boolean(links.next ?? meta.next_page_url ?? data?.next_page_url) ||
        currentPage < lastPage;
    const hasPrevious =
        Boolean(links.prev ?? links.previous ?? meta.prev_page_url ?? data?.prev_page_url) ||
        currentPage > 1;

    return {
        currentPage: Number.isFinite(currentPage) ? currentPage : fallbackPage,
        lastPage: Number.isFinite(lastPage) ? lastPage : fallbackPage,
        total: Number.isFinite(total) ? total : null,
        hasNext,
        hasPrevious,
    };
}

function getRestaurantsList(data) {
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    if (Array.isArray(data?.data?.restaurants)) return data.data.restaurants;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;

    return [];
}

function getDetail(data) {
    return (
        data?.data?.restaurant_invoice ??
        data?.restaurant_invoice ??
        data?.data?.restaurantInvoice ??
        data?.restaurantInvoice ??
        data?.data?.invoice ??
        data?.invoice ??
        data?.data ??
        data
    );
}

function getInvoiceId(invoice = {}) {
    const record = invoice ?? {};

    return record.invoice_id ?? record.invoiceId ?? record.id;
}

function getRestaurantInvoiceId(invoice = {}) {
    const record = invoice ?? {};

    return (
        record.restaurant_invoice_id ??
        record.restaurantInvoiceId ??
        record.restaurant_invoice?.id ??
        record.restaurantInvoice?.id ??
        record.id
    );
}

function getNestedInvoice(invoice = {}) {
    const record = invoice ?? {};

    return (
        record.invoice ??
        record.global_invoice ??
        record.globalInvoice ??
        record.order?.invoice ??
        record.restaurant_order?.invoice ??
        record.restaurantOrder?.invoice ??
        null
    );
}

function getRecordId(invoice = {}, isRestaurantScope = false) {
    return isRestaurantScope ? getRestaurantInvoiceId(invoice) : getInvoiceId(invoice);
}

function getDisplayInvoiceId(invoice = {}, isRestaurantScope = false) {
    if (isRestaurantScope) {
        return getRestaurantInvoiceId(invoice) ?? getInvoiceId(invoice);
    }

    return getInvoiceId(invoice);
}

function getGlobalInvoiceId(invoice = {}) {
    const record = invoice ?? {};
    const nestedInvoice = getNestedInvoice(invoice);

    return (
        record.invoice_id ??
        record.invoiceId ??
        nestedInvoice?.id ??
        nestedInvoice?.invoice_id ??
        nestedInvoice?.invoiceId ??
        null
    );
}

function getOrderId(invoice = {}) {
    const record = invoice ?? {};
    const nestedInvoice = getNestedInvoice(invoice);

    return (
        record.order_id ??
        record.orderId ??
        record.order?.id ??
        record.restaurant_order?.order_id ??
        record.restaurantOrder?.orderId ??
        nestedInvoice?.order_id ??
        nestedInvoice?.orderId ??
        "-"
    );
}

function getFirstValue(sources = [], keys = []) {
    for (const source of sources) {
        if (!source || typeof source !== "object") continue;

        for (const key of keys) {
            const value = source[key];

            if (value !== undefined && value !== null && value !== "") return value;
        }
    }

    return undefined;
}

function getInvoiceTotal(invoice = {}) {
    return getFirstValue([invoice, getNestedInvoice(invoice)], [
        "total",
        "grand_total",
        "grandTotal",
        "amount",
        "total_amount",
        "totalAmount",
    ]);
}

function getOrderStatus(invoice = {}) {
    return getFirstValue([invoice, getNestedInvoice(invoice)], [
        "restaurant_order_status",
        "restaurantOrderStatus",
        "order_status",
        "orderStatus",
        "status",
    ]);
}

function getPaymentStatus(invoice = {}) {
    return getFirstValue([invoice, getNestedInvoice(invoice)], [
        "payment_status",
        "paymentStatus",
        "invoice_status",
        "invoiceStatus",
    ]);
}

function getOrderType(invoice = {}) {
    const record = invoice ?? {};

    return getFirstValue([record, getNestedInvoice(record), record.order], [
        "order_type",
        "orderType",
        "type",
        "service_type",
        "serviceType",
    ]);
}

function getCreatedAt(invoice = {}) {
    return getFirstValue([invoice, getNestedInvoice(invoice)], [
        "created_at",
        "createdAt",
        "issued_at",
        "issuedAt",
    ]);
}

function getUpdatedAt(invoice = {}) {
    return getFirstValue([invoice, getNestedInvoice(invoice)], [
        "updated_at",
        "updatedAt",
        "paid_at",
        "paidAt",
    ]);
}

function getRestaurantName(invoice = {}) {
    const record = invoice ?? {};

    return (
        record.restaurant_name ??
        record.restaurantName ??
        record.restaurant?.name ??
        record.restaurant_order?.restaurant?.name ??
        record.restaurantOrder?.restaurant?.name ??
        "Restaurant"
    );
}

function getRestaurantId(invoice = {}) {
    const record = invoice ?? {};

    return (
        record.restaurant_id ??
        record.restaurantId ??
        record.restaurant?.id ??
        record.restaurant_order?.restaurant_id ??
        record.restaurantOrder?.restaurantId ??
        null
    );
}

function getRestaurantItems(invoice = {}) {
    const record = invoice ?? {};

    return getList(
        record.items ??
            record.order_items ??
            record.orderItems ??
            record.restaurant_order_items ??
            record.restaurantOrderItems ??
            record.restaurant_order?.items ??
            record.restaurantOrder?.items ??
            record.order?.items
    );
}

function flattenRestaurantInvoices(invoices = [], restaurantId) {
    return invoices.flatMap((invoice) => {
        const restaurantInvoices = getList(invoice.restaurant_invoices);

        if (!restaurantInvoices.length) {
            return String(getRestaurantId(invoice)) === String(restaurantId)
                ? [invoice]
                : [];
        }

        return restaurantInvoices
            .filter((restaurantInvoice) =>
                String(getRestaurantId(restaurantInvoice)) === String(restaurantId)
            )
            .map((restaurantInvoice) => ({
                ...restaurantInvoice,
                invoice: restaurantInvoice.invoice ?? invoice,
                invoice_id: restaurantInvoice.invoice_id ?? invoice.id,
                order_id: restaurantInvoice.order_id ?? invoice.order_id,
                order_type: restaurantInvoice.order_type ?? invoice.order_type,
                payment_status:
                    restaurantInvoice.payment_status ?? invoice.payment_status,
                created_at: restaurantInvoice.created_at ?? invoice.created_at,
                updated_at: restaurantInvoice.updated_at ?? invoice.updated_at,
            }));
    });
}

function buildSummaryInvoice(invoice = {}, isRestaurantScope = false) {
    const record = invoice ?? {};

    if (!isRestaurantScope) return record;

    const nestedInvoice = getNestedInvoice(record) ?? {};
    const sources = [record, nestedInvoice];

    return {
        ...nestedInvoice,
        ...record,
        subtotal: getFirstValue(sources, ["subtotal", "sub_total", "subTotal"]),
        tax: getFirstValue(sources, ["tax", "tax_amount", "taxAmount"]),
        discount: getFirstValue(sources, ["discount", "discount_amount", "discountAmount"]),
        delivery_fee: getFirstValue(sources, ["delivery_fee", "deliveryFee"]),
        total: getInvoiceTotal(record),
        paid_amount: getFirstValue(sources, ["paid_amount", "paidAmount", "total"]),
        refunded_amount: getFirstValue(sources, ["refunded_amount", "refundedAmount"]),
        pending_refund_amount: getFirstValue(sources, [
            "pending_refund_amount",
            "pendingRefundAmount",
        ]),
        net_paid_amount: getFirstValue(sources, [
            "net_paid_amount",
            "netPaidAmount",
            "paid_amount",
            "paidAmount",
            "total",
        ]),
    };
}

function money(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) return "$0.00";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value || "-";

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateInputValue(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function normalizeText(value) {
    return String(value ?? "")
        .replace(/_/g, " ")
        .trim();
}

function StatusBadge({ value, tone = "neutral" }) {
    const { isLight } = useTheme();
    const tones = {
        paid: isLight
            ? "border-emerald-700/25 bg-emerald-50 text-emerald-700"
            : "border-emerald-300/20 bg-emerald-300/12 text-emerald-300",
        confirmed: isLight
            ? "border-sky-700/25 bg-sky-50 text-sky-700"
            : "border-sky-300/20 bg-sky-300/12 text-sky-300",
        cancelled: isLight
            ? "border-[#8F1D1D]/25 bg-[#F3DCDC] text-[#8F1D1D]"
            : "border-[#7F1D1D]/30 bg-[#7F1D1D]/16 text-red-300",
        neutral: isLight
            ? "border-[#D8B7A8] bg-white text-[#5A4037]"
            : "border-white/12 bg-white/[0.06] text-white/68",
    };
    const status = String(value ?? "").toLowerCase();
    const className = tones[status] ?? tones[tone] ?? tones.neutral;

    return (
        <span className={`inline-flex h-8 items-center rounded-[8px] border px-3 text-xs font-black capitalize ${className}`}>
            {normalizeText(value) || "-"}
        </span>
    );
}

function DetailLine({ label, value }) {
    const { isLight } = useTheme();

    return (
        <div className={`rounded-[10px] border px-4 py-3 ${isLight ? "border-[#8F1D1D]/18 bg-[#FFF8F4]" : "border-white/10 bg-white/[0.045]"}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                {label}
            </p>
            <p className={`mt-1 truncate text-base font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                {value ?? "-"}
            </p>
        </div>
    );
}

function FinanceRow({ label, value, strong = false, tone = "default" }) {
    const { isLight } = useTheme();
    const toneClass = {
        default: isLight ? "text-[#5A4037]" : "text-white/62",
        green: isLight ? "text-emerald-700" : "text-emerald-300",
        red: isLight ? "text-[#8F1D1D]" : "text-red-300",
        gold: isLight ? "text-[#8F1D1D]" : "text-[#FFD166]",
    }[tone];

    return (
        <div className={`flex min-h-10 items-center justify-between gap-4 rounded-[8px] px-3 ${strong ? (isLight ? "bg-[#F8E3DB]" : "bg-[#FFD166]/10") : ""}`}>
            <span className={`text-sm font-black uppercase tracking-[0.12em] ${toneClass}`}>
                {label}
            </span>
            <span className={`shrink-0 text-right tabular-nums ${strong ? "text-xl font-black" : "text-base font-bold"} ${isLight ? "text-[#241815]" : "text-white"}`}>
                {value ?? "-"}
            </span>
        </div>
    );
}

function FinancialSummary({ invoice, showPaymentMovement = true }) {
    const { isLight } = useTheme();
    const sectionClass = isLight
        ? "border-[#8F1D1D]/22 bg-[#FFF2EC] shadow-[inset_4px_0_0_rgba(143,29,29,0.32)]"
        : "border-white/10 bg-black/14";
    const innerClass = isLight
        ? "border-[#8F1D1D]/16 bg-white"
        : "border-white/10 bg-white/[0.045]";

    return (
        <section className={`rounded-[18px] border p-4 ${sectionClass}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`invoice-brand-icon grid h-10 w-10 place-items-center rounded-[10px] ${isLight ? "bg-[#8F1D1D] text-white" : "bg-[#FFD166]/12 text-[#FFD166]"}`}>
                        <ReceiptText size={20} />
                    </div>
                    <div>
                        <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                            Summary
                        </p>
                        <h3 className="text-xl font-black">Financial breakdown</h3>
                    </div>
                </div>
                {showPaymentMovement && (
                    <div className={`rounded-[10px] border px-4 py-2 text-right ${isLight ? "border-emerald-700/25 bg-emerald-50" : "border-emerald-300/22 bg-emerald-300/10"}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>
                            Net paid
                        </p>
                        <p className={`text-2xl font-black tabular-nums ${isLight ? "text-[#241815]" : "text-white"}`}>
                            {money(invoice.net_paid_amount)}
                        </p>
                    </div>
                )}
            </div>

            <div className={`grid gap-4 ${showPaymentMovement ? "xl:grid-cols-2" : ""}`}>
                <div className={`rounded-[14px] border p-3 ${innerClass}`}>
                    <p className={`mb-2 px-3 text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                        Invoice amount
                    </p>
                    <div className="space-y-1">
                        <FinanceRow label="Subtotal" value={money(invoice.subtotal)} />
                        <FinanceRow label="Tax" value={money(invoice.tax)} />
                        <FinanceRow label="Discount" value={money(invoice.discount)} tone="red" />
                        <FinanceRow label="Delivery fee" value={money(invoice.delivery_fee)} />
                        <div className={`my-2 border-t ${isLight ? "border-[#E4CFC3]" : "border-white/10"}`} />
                        <FinanceRow label="Total" value={money(invoice.total)} strong tone="gold" />
                    </div>
                </div>

                {showPaymentMovement && (
                    <div className={`rounded-[14px] border p-3 ${innerClass}`}>
                        <p className={`mb-2 px-3 text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                            Payment movement
                        </p>
                        <div className="space-y-1">
                            <FinanceRow label="Paid" value={money(invoice.paid_amount)} tone="green" />
                            <FinanceRow label="Refunded" value={money(invoice.refunded_amount)} tone="red" />
                            <FinanceRow label="Pending refund" value={money(invoice.pending_refund_amount)} />
                            <div className={`my-2 border-t ${isLight ? "border-[#E4CFC3]" : "border-white/10"}`} />
                            <FinanceRow label="Net paid" value={money(invoice.net_paid_amount)} strong tone="green" />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function EmptyPanel({ icon: Icon, title, text }) {
    const { isLight } = useTheme();

    return (
        <div className={`flex min-h-[280px] flex-col items-center justify-center rounded-[20px] border border-dashed px-6 py-10 text-center ${isLight ? "border-[#D8B7A8] bg-[#FFF7F2]" : "border-white/15 bg-white/[0.04]"}`}>
            <div className={`grid h-14 w-14 place-items-center rounded-[14px] ${isLight ? "bg-[#F3DCDC] text-[#8F1D1D]" : "bg-[#7F1D1D]/18 text-red-300"}`}>
                <Icon size={25} />
            </div>
            <h3 className={`mt-4 text-xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                {title}
            </h3>
            <p className={`mt-2 max-w-md text-sm font-bold leading-6 ${isLight ? "text-[#5A4037]" : "text-white/55"}`}>
                {text}
            </p>
        </div>
    );
}

export default function GlobalInvoices({ scope = "admin" }) {
    const { isLight } = useTheme();
    const isRestaurantScope = scope === "restaurant";
    const isAdminRestaurantScope = scope === "adminRestaurant";
    const isRestaurantInvoiceScope = isRestaurantScope || isAdminRestaurantScope;
    const isGlobalInvoiceScope = !isRestaurantInvoiceScope;
    const listEndpoint = isRestaurantScope
        ? "/restaurant/invoices"
        : isAdminRestaurantScope
            ? "/restaurant/invoices"
            : "/admin/invoices";
    const detailEndpoint = listEndpoint;
    const pageTitle = isRestaurantInvoiceScope ? "Restaurant invoices" : "Global invoices";
    const pageSubtitle = isRestaurantScope
        ? "Invoice ledger for your assigned restaurant."
        : isAdminRestaurantScope
            ? "Restaurant invoice ledger across all restaurants."
            : "Admin invoice ledger across restaurant orders and payments.";
    const loadingListText = isRestaurantInvoiceScope
        ? "Fetching the restaurant invoice ledger."
        : "Fetching the latest global invoice ledger.";
    const loadingDetailText = isRestaurantInvoiceScope
        ? "Fetching invoice details from the restaurant invoice endpoint."
        : "Fetching invoice details from the admin invoice endpoint.";
    const emptySelectionText = isRestaurantInvoiceScope
        ? "Choose an invoice from the list to open its restaurant invoice data."
        : "Choose an invoice from the list to open its full admin invoice data.";
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
    const [isRestaurantMenuOpen, setIsRestaurantMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [isDateFilterFocused, setIsDateFilterFocused] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [restaurantError, setRestaurantError] = useState("");
    const [detailError, setDetailError] = useState("");
    const [invoicePage, setInvoicePage] = useState(1);
    const [invoicePagination, setInvoicePagination] = useState(() =>
        getPagination({}, 1, 0)
    );

    const loadRestaurants = useCallback(async () => {
        if (!isAdminRestaurantScope) return;

        setIsRestaurantsLoading(true);
        setRestaurantError("");

        try {
            const response = await api.get("/restaurants");
            setRestaurants(getRestaurantsList(response.data));
        } catch (error) {
            setRestaurantError(
                error.response?.data?.message ||
                    error.message ||
                    "Restaurants could not be loaded."
            );
        } finally {
            setIsRestaurantsLoading(false);
        }
    }, [isAdminRestaurantScope]);

    const loadInvoices = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");
        setDetailError("");

        if (isAdminRestaurantScope && !selectedRestaurantId) {
            setInvoices([]);
            setInvoicePagination(getPagination({}, 1, 0));
            setSelectedInvoiceId(null);
            setSelectedInvoice(null);
            setIsLoading(false);
            return;
        }

        try {
            const requestConfig = isAdminRestaurantScope
                ? { params: { restaurant_id: selectedRestaurantId, page: invoicePage } }
                : { params: { page: invoicePage } };
            const response = await api.get(listEndpoint, requestConfig);
            const nextInvoices = getList(response.data);

            setInvoices(nextInvoices);
            setInvoicePagination(
                getPagination(response.data, invoicePage, nextInvoices.length)
            );
        } catch (error) {
            if (isAdminRestaurantScope) {
                try {
                    const response = await api.get("/admin/invoices", {
                        params: { restaurant_id: selectedRestaurantId, page: invoicePage },
                    });
                    const adminInvoices = getList(response.data);
                    const flattenedInvoices = flattenRestaurantInvoices(
                        adminInvoices,
                        selectedRestaurantId
                    );

                    if (flattenedInvoices.length || !adminInvoices.length) {
                        setInvoices(flattenedInvoices);
                        setInvoicePagination(
                            getPagination(response.data, invoicePage, flattenedInvoices.length)
                        );
                        return;
                    }

                    const detailedInvoices = await Promise.all(
                        adminInvoices.map(async (invoice) => {
                            const invoiceId = getInvoiceId(invoice);

                            if (!invoiceId) return invoice;

                            try {
                                const detailResponse = await api.get(
                                    `/admin/invoices/${invoiceId}`
                                );

                                return getDetail(detailResponse.data);
                            } catch {
                                return invoice;
                            }
                        })
                    );

                    setInvoices(
                        flattenRestaurantInvoices(detailedInvoices, selectedRestaurantId)
                    );
                    setInvoicePagination(
                        getPagination(response.data, invoicePage, detailedInvoices.length)
                    );
                    return;
                } catch (fallbackError) {
                    setErrorMessage(
                        fallbackError.response?.data?.message ||
                            fallbackError.message ||
                            `${pageTitle} could not be loaded.`
                    );
                }
            } else {
                setErrorMessage(
                    error.response?.data?.message ||
                        error.message ||
                        `${pageTitle} could not be loaded.`
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [invoicePage, isAdminRestaurantScope, listEndpoint, pageTitle, selectedRestaurantId]);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            loadInvoices();
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [loadInvoices]);

    useEffect(() => {
        loadRestaurants();
    }, [loadRestaurants]);

    useEffect(() => {
        setInvoicePage(1);
    }, [dateFilter, maxPrice, minPrice, search]);

    const handleRestaurantSelect = useCallback((restaurantId) => {
        setSelectedRestaurantId(restaurantId);
        setIsRestaurantMenuOpen(false);
        setSelectedInvoiceId(null);
        setSelectedInvoice(null);
        setSearch("");
        setDateFilter("");
        setMinPrice("");
        setMaxPrice("");
        setDetailError("");
        setInvoicePage(1);
    }, []);

    const openInvoice = useCallback(async (invoice) => {
        const invoiceId = getRecordId(invoice, isRestaurantInvoiceScope);

        if (!invoiceId) return;

        setSelectedInvoiceId(invoiceId);
        setSelectedInvoice(null);
        setIsDetailLoading(true);
        setDetailError("");

        try {
            const requestConfig = isAdminRestaurantScope
                ? { params: { restaurant_id: selectedRestaurantId } }
                : undefined;
            const response = await api.get(`${detailEndpoint}/${invoiceId}`, requestConfig);
            const detail = getDetail(response.data);

            setSelectedInvoice(isRestaurantInvoiceScope ? { ...invoice, ...detail } : detail);
        } catch (error) {
            if (isAdminRestaurantScope && getGlobalInvoiceId(invoice)) {
                try {
                    const response = await api.get(
                        `/admin/invoices/${getGlobalInvoiceId(invoice)}`
                    );
                    const adminInvoice = getDetail(response.data);
                    const restaurantInvoice = flattenRestaurantInvoices(
                        [adminInvoice],
                        selectedRestaurantId
                    ).find((item) => String(getRecordId(item, true)) === String(invoiceId));

                    setSelectedInvoice(
                        restaurantInvoice ? { ...invoice, ...restaurantInvoice } : invoice
                    );
                    return;
                } catch (fallbackError) {
                    setDetailError(
                        fallbackError.response?.data?.message ||
                            fallbackError.message ||
                            "Invoice details could not be loaded."
                    );
                }
            } else {
                setDetailError(
                    error.response?.data?.message ||
                        error.message ||
                        "Invoice details could not be loaded."
                );
            }
        } finally {
            setIsDetailLoading(false);
        }
    }, [
        detailEndpoint,
        isAdminRestaurantScope,
        isRestaurantInvoiceScope,
        selectedRestaurantId,
    ]);

    const filteredInvoices = useMemo(() => {
        const query = search.trim();
        const minimumPrice = minPrice === "" ? null : Number(minPrice);
        const maximumPrice = maxPrice === "" ? null : Number(maxPrice);

        return invoices.filter((invoice) => {
                const matchesSearch =
                    !query ||
                    [
                    getInvoiceId(invoice),
                    getRestaurantInvoiceId(invoice),
                    getGlobalInvoiceId(invoice),
                    invoice.order_id,
                    invoice.restaurant_order_id,
                    ]
                        .filter(Boolean)
                        .some((value) => String(value).includes(query));
                const matchesDate =
                    !dateFilter ||
                    formatDateInputValue(getCreatedAt(invoice)) === dateFilter;
                const total = Number(getInvoiceTotal(invoice));
                const matchesMinPrice =
                    minimumPrice === null ||
                    (!Number.isNaN(total) && total >= minimumPrice);
                const matchesMaxPrice =
                    maximumPrice === null ||
                    (!Number.isNaN(total) && total <= maximumPrice);

                return (
                    matchesSearch &&
                    matchesDate &&
                    matchesMinPrice &&
                    matchesMaxPrice
                );
            });
    }, [dateFilter, invoices, maxPrice, minPrice, search]);

    const hasFilters = Boolean(search || dateFilter || minPrice || maxPrice);
    const clearFilters = () => {
        setSearch("");
        setDateFilter("");
        setMinPrice("");
        setMaxPrice("");
        setInvoicePage(1);
    };
    const invoiceCountLabel =
        invoicePagination.total ?? filteredInvoices.length;

    const summaryInvoice = buildSummaryInvoice(selectedInvoice, isRestaurantInvoiceScope);
    const restaurantInvoices = getList(selectedInvoice?.restaurant_invoices);
    const restaurantItems = getRestaurantItems(selectedInvoice);
    const selectedRestaurant = restaurants.find(
        (restaurant) => String(restaurant.id) === String(selectedRestaurantId)
    );
    const shellClass = isLight
        ? "bg-[linear-gradient(145deg,#FFF7F2_0%,#F6E0D9_48%,#EDC6BD_100%)] text-[#241815]"
        : "bg-[linear-gradient(145deg,#101517_0%,#171D20_52%,#26181B_100%)] text-white";
    const panelClass = isLight
        ? "border-[#8F1D1D]/24 bg-[#FFFDF8] shadow-[0_18px_42px_rgba(127,29,29,0.14)]"
        : "border-white/10 bg-[#252A2D] shadow-[0_18px_42px_rgba(0,0,0,0.20)]";
    const pageClass = isGlobalInvoiceScope ? "invoice-global-page" : "invoice-red-page";
    const InvoiceScopeIcon = isGlobalInvoiceScope ? Globe2 : ReceiptText;

    return (
        <div className={`${pageClass} min-h-full p-4 sm:p-6 ${shellClass}`}>
            <section className={`relative z-20 mb-5 overflow-visible rounded-[24px] border p-5 sm:p-6 ${panelClass}`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 ${isLight ? "bg-[#8F1D1D]" : "bg-[#FFD166]"}`} />
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                        <div className={`invoice-scope-badge mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${isLight ? "border-[#8F1D1D]/30 bg-[#F3DCDC] text-[#8F1D1D]" : "border-[#FFD166]/28 bg-[#FFD166]/10 text-[#FFD166]"}`}>
                            <InvoiceScopeIcon size={14} />
                            {isRestaurantInvoiceScope ? "Restaurant Invoice" : "Global Invoice"}
                        </div>
                        <h1 className={`text-[clamp(2rem,1.45rem+1.15vw,3rem)] font-black leading-tight ${isLight ? "text-[#241815]" : "text-white"}`}>
                            {pageTitle}
                        </h1>
                        <p className={`mt-2 max-w-2xl text-sm font-bold leading-6 ${isLight ? "text-[#5A4037]" : "text-white/60"}`}>
                            {pageSubtitle}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {isAdminRestaurantScope && (
                            <div
                                className="relative"
                                onBlur={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) {
                                        setIsRestaurantMenuOpen(false);
                                    }
                                }}
                            >
                                <button
                                    type="button"
                                    title={selectedRestaurant?.name || "Choose restaurant"}
                                    onClick={() =>
                                        setIsRestaurantMenuOpen((isOpen) => !isOpen)
                                    }
                                    className={`restaurant-invoice-filter flex min-h-14 min-w-[300px] items-center gap-3 rounded-[12px] border px-4 py-2.5 text-left shadow-[0_10px_24px_rgba(127,29,29,0.12)] transition hover:-translate-y-0.5 ${
                                        isLight
                                            ? "border-[#8F1D1D]/30 bg-[#FFF8F4] text-[#241815] hover:border-[#8F1D1D]/55 hover:bg-[#FFF2EC]"
                                            : "border-white/10 bg-black/18 text-white hover:border-[#FFD166]/35"
                                    }`}
                                    aria-expanded={isRestaurantMenuOpen}
                                    aria-haspopup="listbox"
                                    disabled={isRestaurantsLoading}
                                >
                                    <span className={`invoice-brand-icon grid h-9 w-9 shrink-0 place-items-center rounded-[8px] ${isLight ? "bg-[#8F1D1D] text-white" : "bg-[#FFD166]/12 text-[#FFD166]"}`}>
                                        <Store size={17} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className={`mb-0.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                            <SlidersHorizontal size={13} />
                                            Restaurant filter
                                        </span>
                                        <span className="block truncate text-sm font-black">
                                            {isRestaurantsLoading
                                                ? "Loading restaurants..."
                                                : selectedRestaurant?.name ||
                                                  "Choose restaurant"}
                                        </span>
                                    </span>
                                    <ChevronDown
                                        size={17}
                                        className={`shrink-0 transition ${isRestaurantMenuOpen ? "rotate-180" : ""} ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}
                                    />
                                </button>

                                {isRestaurantMenuOpen && (
                                    <div
                                        role="listbox"
                                        className={`restaurant-invoice-menu absolute right-0 top-[calc(100%+8px)] z-50 w-full min-w-[300px] overflow-hidden rounded-[12px] border p-1.5 shadow-[0_18px_45px_rgba(127,29,29,0.22)] ${
                                            isLight
                                                ? "border-[#8F1D1D]/24 bg-[#FFFDF8]"
                                                : "border-white/10 bg-[#181D20]"
                                        }`}
                                    >
                                        {restaurants.map((restaurant) => {
                                            const isSelected =
                                                String(restaurant.id) ===
                                                String(selectedRestaurantId);

                                            return (
                                                <button
                                                    key={restaurant.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    onClick={() =>
                                                        handleRestaurantSelect(
                                                            String(restaurant.id)
                                                        )
                                                    }
                                                    className={`flex h-10 w-full items-center gap-2 rounded-[8px] px-3 text-left text-sm font-black transition ${
                                                        isSelected
                                                            ? isLight
                                                                ? "bg-[#8F1D1D] text-white"
                                                                : "bg-[#FFD166] text-[#16120A]"
                                                            : isLight
                                                                ? "text-[#5A4037] hover:bg-[#F3DCDC] hover:text-[#8F1D1D]"
                                                                : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                                                    }`}
                                                >
                                                    <Store size={15} />
                                                    <span className="truncate">
                                                        {restaurant.name ||
                                                            `Restaurant #${restaurant.id}`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={loadInvoices}
                            disabled={isLoading || (isAdminRestaurantScope && !selectedRestaurantId)}
                            className={`invoice-refresh-button inline-flex h-14 items-center justify-center gap-2 rounded-[10px] border px-5 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${isLight ? "border-[#8F1D1D] bg-[#8F1D1D] !text-white hover:bg-[#6F1717]" : "border-[#FFD166]/32 bg-[#FFD166]/12 text-[#FFD166] hover:bg-[#FFD166]/18"}`}
                        >
                            {isLoading ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                            Refresh
                        </button>
                    </div>
                </div>
            </section>

            {errorMessage && (
                <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                    <AlertTriangle size={18} />
                    {errorMessage}
                </div>
            )}

            {restaurantError && (
                <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                    <AlertTriangle size={18} />
                    {restaurantError}
                </div>
            )}

            <section className="grid items-start gap-5 xl:h-[calc(100dvh-190px)] xl:min-h-0 xl:grid-cols-[minmax(320px,0.42fr)_minmax(0,1fr)] xl:overflow-hidden">
                <aside className={`min-h-0 rounded-[24px] border xl:flex xl:max-h-full xl:flex-col xl:overflow-hidden ${panelClass}`}>
                    <div className={`invoice-filter-panel border-b p-4 ${isLight ? "border-[#8F1D1D]/20 bg-[#FFF8F4]" : "border-white/10"}`}>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className={`invoice-filter-mark grid h-9 w-9 shrink-0 place-items-center rounded-[9px] ${isLight ? "bg-[#8F1D1D] text-white" : "bg-[#FFD166]/14 text-[#FFD166]"}`}>
                                        <SlidersHorizontal size={17} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-[0.16em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                            {isGlobalInvoiceScope ? "Global invoice list" : "Invoice filters"}
                                        </p>
                                        <p className={`mt-0.5 truncate text-xs font-bold ${isLight ? "text-[#5A4037]" : "text-white/50"}`}>
                                            Search by number, date, or amount range
                                        </p>
                                    </div>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-sm font-black ${isLight ? "border-[#8F1D1D]/24 bg-[#F3DCDC] text-[#8F1D1D]" : "border-white/10 bg-white/[0.06] text-white/60"}`}>
                                    {invoiceCountLabel}
                                </span>
                            </div>
                            <div className={`rounded-[14px] border p-3 ${isLight ? "border-[#8F1D1D]/16 bg-white/70" : "border-white/10 bg-black/12"}`}>
                                <div className="grid gap-3">
                                    <label className={`invoice-filter-field flex min-h-12 min-w-0 items-center gap-3 rounded-[10px] border px-4 ${isLight ? "border-[#8F1D1D]/22 bg-white text-[#241815] focus-within:border-[#8F1D1D]" : "border-white/10 bg-black/18 text-white"}`}>
                                        <Search size={18} className={isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"} />
                                        <span className="min-w-0 flex-1">
                                            <input
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(event.target.value.replace(/\D/g, ""))
                                                }
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Number"
                                                className="min-w-0 flex-1 bg-transparent text-sm font-black tabular-nums outline-none placeholder:text-current placeholder:opacity-45"
                                            />
                                        </span>
                                    </label>
                                    <label className={`invoice-filter-field flex min-h-12 min-w-0 items-center gap-3 rounded-[10px] border px-4 ${isLight ? "border-[#8F1D1D]/22 bg-white text-[#241815] focus-within:border-[#8F1D1D]" : "border-white/10 bg-black/18 text-white"}`}>
                                        <CalendarDays size={18} className={isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"} />
                                        <span className="min-w-0 flex-1">
                                            <input
                                                type={dateFilter || isDateFilterFocused ? "date" : "text"}
                                                value={dateFilter}
                                                onChange={(event) => setDateFilter(event.target.value)}
                                                onFocus={(event) => {
                                                    setIsDateFilterFocused(true);
                                                    window.requestAnimationFrame(() => {
                                                        event.currentTarget.showPicker?.();
                                                    });
                                                }}
                                                onBlur={() => setIsDateFilterFocused(false)}
                                                placeholder="Date"
                                                aria-label="Filter by invoice date"
                                                className="invoice-date-input min-w-0 flex-1 bg-transparent text-sm font-black tabular-nums outline-none placeholder:text-current placeholder:opacity-45"
                                            />
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <label className={`invoice-filter-field flex min-h-12 min-w-0 items-center gap-2 rounded-[10px] border px-3 ${isLight ? "border-[#8F1D1D]/22 bg-white text-[#241815] focus-within:border-[#8F1D1D]" : "border-white/10 bg-black/18 text-white"}`}>
                                    <DollarSign size={17} className={isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"} />
                                    <span className="min-w-0 flex-1">
                                        <input
                                            type="number"
                                            {...nonNegativeNumberInputProps}
                                            step="0.01"
                                            value={minPrice}
                                            onChange={(event) =>
                                                setMinPrice(toNonNegativeNumberValue(event.target.value))
                                            }
                                            placeholder="Min"
                                            aria-label="Minimum invoice price"
                                            className="min-w-0 flex-1 bg-transparent text-sm font-black tabular-nums outline-none placeholder:text-current placeholder:opacity-45"
                                        />
                                    </span>
                                </label>
                                <label className={`invoice-filter-field flex min-h-12 min-w-0 items-center gap-2 rounded-[10px] border px-3 ${isLight ? "border-[#8F1D1D]/22 bg-white text-[#241815] focus-within:border-[#8F1D1D]" : "border-white/10 bg-black/18 text-white"}`}>
                                    <DollarSign size={17} className={isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"} />
                                    <span className="min-w-0 flex-1">
                                        <input
                                            type="number"
                                            {...nonNegativeNumberInputProps}
                                            step="0.01"
                                            value={maxPrice}
                                            onChange={(event) =>
                                                setMaxPrice(toNonNegativeNumberValue(event.target.value))
                                            }
                                            placeholder="Max"
                                            aria-label="Maximum invoice price"
                                            className="min-w-0 flex-1 bg-transparent text-sm font-black tabular-nums outline-none placeholder:text-current placeholder:opacity-45"
                                        />
                                    </span>
                                </label>
                            </div>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className={`inline-flex h-11 items-center justify-center rounded-[10px] border px-4 text-sm font-black transition active:scale-[0.98] ${isLight ? "border-[#8F1D1D]/28 bg-[#F3DCDC] text-[#8F1D1D] hover:bg-[#EACBCB]" : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/[0.09] hover:text-white"}`}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="cashier-scroll min-h-0 space-y-3 overflow-y-auto p-3 xl:flex-1">
                        {isLoading ? (
                            <EmptyPanel icon={Loader2} title="Loading invoices" text={loadingListText} />
                        ) : isAdminRestaurantScope && !selectedRestaurantId ? (
                            <EmptyPanel icon={Store} title="Choose restaurant" text="Select a restaurant to view its invoices." />
                        ) : filteredInvoices.length ? (
                            filteredInvoices.map((invoice) => {
                                const invoiceId = getRecordId(invoice, isRestaurantInvoiceScope);
                                const displayInvoiceId = getDisplayInvoiceId(invoice, isRestaurantInvoiceScope);
                                const globalInvoiceId = getGlobalInvoiceId(invoice);
                                const isActive = String(selectedInvoiceId) === String(invoiceId);

                                return (
                                    <button
                                        key={invoiceId ?? `${getOrderId(invoice)}-${getCreatedAt(invoice)}`}
                                        type="button"
                                        onClick={() => openInvoice(invoice)}
                                        className={`group w-full rounded-[14px] border p-4 text-left transition active:scale-[0.99] ${
                                            isActive
                                                ? isLight
                                                    ? "border-[#8F1D1D]/55 bg-[#F9E5DE] shadow-[0_14px_30px_rgba(143,29,29,0.14)]"
                                                    : "border-[#FFD166]/55 bg-[#FFD166]/10 shadow-[0_14px_30px_rgba(255,209,102,0.08)]"
                                                : isLight
                                                    ? "border-[#8F1D1D]/18 bg-white hover:border-[#8F1D1D]/45 hover:bg-[#FFF2EC]"
                                                    : "border-white/10 bg-white/[0.045] hover:border-[#FFD166]/35 hover:bg-white/[0.07]"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                                    {isRestaurantInvoiceScope ? "Restaurant invoice" : "Global invoice"} #{displayInvoiceId}
                                                </p>
                                                <h3 className="mt-1 truncate text-xl font-black tabular-nums">
                                                    {money(getInvoiceTotal(invoice))}
                                                </h3>
                                            </div>
                                            <ChevronRight
                                                size={20}
                                                className={`mt-1 shrink-0 transition group-hover:translate-x-0.5 ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <StatusBadge value={getOrderStatus(invoice)} />
                                            <StatusBadge value={getPaymentStatus(invoice)} />
                                        </div>
                                        <div className={`mt-4 grid gap-2 text-sm font-bold ${isLight ? "text-[#5A4037]" : "text-white/55"}`}>
                                            <span className="flex items-center gap-2">
                                                <ClipboardList size={15} />
                                                Order #{getOrderId(invoice)} - {normalizeText(getOrderType(invoice))}
                                            </span>
                                            {isRestaurantInvoiceScope && globalInvoiceId && (
                                                <span className="flex items-center gap-2">
                                                    <ReceiptText size={15} />
                                                    Global invoice #{globalInvoiceId}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-2">
                                                <CalendarDays size={15} />
                                                {formatDate(getCreatedAt(invoice))}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <EmptyPanel icon={ReceiptText} title="No invoices" text={hasFilters ? "There are no invoices matching these filters." : "There are no invoices yet."} />
                        )}
                    </div>
                    {(invoicePagination.hasPrevious || invoicePagination.hasNext || invoicePagination.lastPage > 1) && (
                        <div className={`flex shrink-0 items-center justify-between gap-3 border-t p-3 ${isLight ? "border-[#8F1D1D]/20 bg-[#FFF8F4]" : "border-white/10 bg-black/10"}`}>
                            <button
                                type="button"
                                onClick={() =>
                                    setInvoicePage((page) => Math.max(1, page - 1))
                                }
                                disabled={!invoicePagination.hasPrevious || isLoading}
                                className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
                                    isLight
                                        ? "border-[#8F1D1D]/24 bg-white text-[#8F1D1D] hover:bg-[#FFF2EC]"
                                        : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/[0.09] hover:text-white"
                                }`}
                            >
                                <ChevronLeft size={16} />
                                Prev
                            </button>
                            <span className={`shrink-0 text-sm font-black tabular-nums ${isLight ? "text-[#5A4037]" : "text-white/60"}`}>
                                Page {invoicePagination.currentPage}
                                {invoicePagination.lastPage > 1
                                    ? ` / ${invoicePagination.lastPage}`
                                    : ""}
                            </span>
                            <button
                                type="button"
                                onClick={() => setInvoicePage((page) => page + 1)}
                                disabled={!invoicePagination.hasNext || isLoading}
                                className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
                                    isLight
                                        ? "border-[#8F1D1D]/24 bg-white text-[#8F1D1D] hover:bg-[#FFF2EC]"
                                        : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/[0.09] hover:text-white"
                                }`}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </aside>

                <article className={`min-h-0 min-w-0 rounded-[24px] border xl:flex xl:max-h-full xl:flex-col xl:overflow-hidden ${panelClass}`}>
                    <div className={`border-b p-4 sm:p-5 ${isLight ? "border-[#8F1D1D]/20 bg-[#FFF8F4]" : "border-white/10"}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className={`text-xs font-black uppercase tracking-[0.16em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                    {isGlobalInvoiceScope ? "Global invoice details" : "Invoice details"}
                                </p>
                                <h2 className="mt-1 truncate text-2xl font-black">
                                    {selectedInvoiceId
                                        ? `${isRestaurantInvoiceScope ? "Restaurant invoice" : "Global invoice"} #${selectedInvoiceId}`
                                        : "Select an invoice"}
                                </h2>
                            </div>
                            {selectedInvoice && (
                                <div className="flex flex-wrap gap-2">
                                    <StatusBadge value={getOrderStatus(selectedInvoice)} />
                                    <StatusBadge value={getPaymentStatus(selectedInvoice)} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cashier-scroll min-h-0 overflow-y-auto p-4 sm:p-5 xl:flex-1">
                        {isDetailLoading ? (
                            <EmptyPanel icon={Loader2} title="Loading invoice" text={loadingDetailText} />
                        ) : detailError ? (
                            <EmptyPanel icon={AlertTriangle} title="Invoice unavailable" text={detailError} />
                        ) : selectedInvoice ? (
                            <div className="space-y-5">
                                <FinancialSummary
                                    invoice={summaryInvoice}
                                    showPaymentMovement={!isRestaurantInvoiceScope}
                                />

                                <div className="grid gap-4">
                                    <section className={`rounded-[18px] border p-4 ${isLight ? "border-[#8F1D1D]/18 bg-[#FFF2EC]" : "border-white/10 bg-black/14"}`}>
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className={`invoice-brand-icon grid h-10 w-10 place-items-center rounded-[10px] ${isLight ? "bg-[#8F1D1D] text-white" : "bg-[#7F1D1D]/16 text-red-300"}`}>
                                                <ClipboardList size={20} />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                                    Order
                                                </p>
                                                <h3 className="text-xl font-black">Order #{getOrderId(selectedInvoice)}</h3>
                                            </div>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {isRestaurantInvoiceScope && (
                                                <DetailLine label="Restaurant" value={getRestaurantName(selectedInvoice)} />
                                            )}
                                            <DetailLine label="Type" value={normalizeText(getOrderType(selectedInvoice))} />
                                            <DetailLine label="Status" value={normalizeText(getOrderStatus(selectedInvoice))} />
                                            <DetailLine label="Created" value={formatDate(getCreatedAt(selectedInvoice))} />
                                            <DetailLine label="Updated" value={formatDate(getUpdatedAt(selectedInvoice))} />
                                            {isRestaurantInvoiceScope && getGlobalInvoiceId(selectedInvoice) && (
                                                <DetailLine label="Global invoice" value={`#${getGlobalInvoiceId(selectedInvoice)}`} />
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {isRestaurantInvoiceScope ? (
                                    <section className={`rounded-[18px] border p-4 ${isLight ? "border-[#8F1D1D]/18 bg-[#FFF2EC]" : "border-white/10 bg-black/14"}`}>
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className={`invoice-brand-icon grid h-10 w-10 place-items-center rounded-[10px] ${isLight ? "bg-[#8F1D1D] text-white" : "bg-sky-300/12 text-sky-300"}`}>
                                                <Utensils size={20} />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                                    Restaurant items
                                                </p>
                                                <h3 className="text-xl font-black">{restaurantItems.length} items</h3>
                                            </div>
                                        </div>
                                        <div className="grid gap-3 2xl:grid-cols-2">
                                            {restaurantItems.length ? (
                                                restaurantItems.map((item) => (
                                                    <div key={item.id ?? `${item.food_id}-${item.food_name}`} className={`rounded-[12px] border p-3 ${isLight ? "border-[#8F1D1D]/16 bg-[#FFFDF8]" : "border-white/10 bg-black/16"}`}>
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-base font-black">{item.food_name || item.name || `Food #${item.food_id}`}</p>
                                                                <p className={`mt-1 text-sm font-bold ${isLight ? "text-[#5A4037]" : "text-white/55"}`}>
                                                                    Qty {item.quantity ?? "-"} x {money(item.unit_price ?? item.price)}
                                                                </p>
                                                            </div>
                                                            <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${isLight ? "bg-[#F3DCDC] text-[#8F1D1D]" : "bg-[#FFD166]/12 text-[#FFD166]"}`}>
                                                                <Utensils size={18} />
                                                            </div>
                                                        </div>
                                                        {item.notes && (
                                                            <p className={`mt-3 rounded-[10px] px-3 py-2 text-sm font-bold ${isLight ? "bg-[#FFF7F2] text-[#5A4037]" : "bg-white/[0.05] text-white/60"}`}>
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={`rounded-[12px] border border-dashed p-4 text-sm font-bold ${isLight ? "border-[#D8B7A8] text-[#5A4037]" : "border-white/15 text-white/55"}`}>
                                                    No restaurant items were returned for this invoice.
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                ) : (
                                    <section className={`rounded-[18px] border p-4 ${isLight ? "border-[#D8B7A8] bg-[#FFF7F2]" : "border-white/10 bg-black/14"}`}>
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${isLight ? "bg-sky-50 text-sky-700" : "bg-sky-300/12 text-sky-300"}`}>
                                                <Store size={20} />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>
                                                    Restaurant invoices
                                                </p>
                                                <h3 className="text-xl font-black">{restaurantInvoices.length} restaurants</h3>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 2xl:grid-cols-2">
                                            {restaurantInvoices.map((restaurantInvoice) => (
                                                <div key={restaurantInvoice.restaurant_invoice_id ?? restaurantInvoice.restaurant_id} className={`rounded-[16px] border p-4 ${isLight ? "border-[#D8B7A8] bg-white" : "border-white/10 bg-white/[0.045]"}`}>
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>
                                                                Restaurant #{restaurantInvoice.restaurant_id}
                                                            </p>
                                                            <h4 className="mt-1 truncate text-xl font-black">
                                                                {restaurantInvoice.restaurant_name || "Restaurant"}
                                                            </h4>
                                                        </div>
                                                        <StatusBadge value={restaurantInvoice.restaurant_order_status} />
                                                    </div>
                                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                        <DetailLine label="Subtotal" value={money(restaurantInvoice.subtotal)} />
                                                        <DetailLine label="Tax" value={money(restaurantInvoice.tax)} />
                                                        <DetailLine label="Total" value={money(restaurantInvoice.total)} />
                                                    </div>
                                                    <div className="mt-4 space-y-3">
                                                        {getList(restaurantInvoice.items).map((item) => (
                                                            <div key={item.id} className={`rounded-[12px] border p-3 ${isLight ? "border-[#D8B7A8] bg-[#FFFDF8]" : "border-white/10 bg-black/16"}`}>
                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-base font-black">{item.food_name || `Food #${item.food_id}`}</p>
                                                                        <p className={`mt-1 text-sm font-bold ${isLight ? "text-[#5A4037]" : "text-white/55"}`}>
                                                                            Qty {item.quantity} x {money(item.unit_price)}
                                                                        </p>
                                                                    </div>
                                                                    <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${isLight ? "bg-[#FFF7D8] text-[#8A5700]" : "bg-[#FFD166]/12 text-[#FFD166]"}`}>
                                                                        <Utensils size={18} />
                                                                    </div>
                                                                </div>
                                                                {item.notes && (
                                                                    <p className={`mt-3 rounded-[10px] px-3 py-2 text-sm font-bold ${isLight ? "bg-[#FFF7F2] text-[#5A4037]" : "bg-white/[0.05] text-white/60"}`}>
                                                                        {item.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                            </div>
                        ) : (
                            <EmptyPanel icon={ReceiptText} title="No invoice selected" text={emptySelectionText} />
                        )}
                    </div>
                </article>
            </section>
        </div>
    );
}
