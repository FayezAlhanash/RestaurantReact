import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  ClipboardList,
  DollarSign,
  Layers3,
  Loader2,
  RefreshCw,
  Tags,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import api from "../../API/axios";
import { ensureManagerRestaurantId } from "./managerHelpers";
import { getUserPermissions } from "../../utils/permissions";

const currentYear = new Date().getFullYear();
const defaultFrom = `${currentYear}-01-01`;
const defaultTo = `${currentYear}-12-31`;

const slides = [
  {
    eyebrow: "Category control",
    title: "Build clean sections before service starts.",
    text: "Keep the menu easy to scan with focused categories for cashiers and customers.",
    metric: "12",
    metricLabel: "active categories",
    to: "/manager/add-menu",
    action: "Open categories",
    icon: Tags,
    bg: "from-[#081C15] via-[#123524] to-[#1B4332]",
    accent: "bg-emerald-400 text-emerald-950",
    glow: "shadow-emerald-500/20",
  },
  {
    eyebrow: "Food library",
    title: "Tune dishes, prices, images, and availability.",
    text: "The food workspace supports search, filters, cards, editing, and delete confirmation.",
    metric: "48",
    metricLabel: "food items",
    to: "/manager/add-food",
    action: "Open foods",
    icon: UtensilsCrossed,
    bg: "from-[#111827] via-[#1E3A5F] to-[#0F766E]",
    accent: "bg-sky-300 text-sky-950",
    glow: "shadow-sky-500/20",
  },
  {
    eyebrow: "Modifier groups",
    title: "Prepare flexible choices for every dish.",
    text: "Groups can handle sizes, sauces, toppings, and extra options when the backend is ready.",
    metric: "Next",
    metricLabel: "workflow",
    to: "/manager/add-menu",
    action: "Preview modifiers",
    icon: Layers3,
    bg: "from-[#2A0F1F] via-[#4A1942] to-[#7C2D12]",
    accent: "bg-amber-300 text-amber-950",
    glow: "shadow-amber-500/20",
  },
];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getList(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function StatCard({ title, value, helper, icon: Icon, tone = "red" }) {
  const tones = {
    red: {
      background: "linear-gradient(135deg, #FFF8F7 0%, #FFFFFF 100%)",
      accent: "#7F1D1D",
      border: "#F0D4D0",
      icon: "bg-[#F9ECEC] text-[#7F1D1D]",
      glow: "#F9ECEC",
    },
    green: {
      background: "linear-gradient(135deg, #F1F8F4 0%, #FFFFFF 100%)",
      accent: "#28724F",
      border: "#CFE7D8",
      icon: "bg-emerald-50 text-emerald-700",
      glow: "#E7F5EC",
    },
    blue: {
      background: "linear-gradient(135deg, #F1F7FB 0%, #FFFFFF 100%)",
      accent: "#2E6F8F",
      border: "#CFE3EF",
      icon: "bg-sky-50 text-sky-700",
      glow: "#E6F3F8",
    },
    amber: {
      background: "linear-gradient(135deg, #FFF7EA 0%, #FFFFFF 100%)",
      accent: "#9A5A1B",
      border: "#EAD8B8",
      icon: "bg-amber-50 text-amber-700",
      glow: "#FFF0D6",
    },
  };
  const toneStyle = tones[tone] ?? tones.red;

  return (
    <article
      className="relative min-h-[150px] overflow-hidden rounded-lg border p-5 shadow-sm"
      style={{ background: toneStyle.background, borderColor: toneStyle.border }}
    >
      <div
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full"
        style={{ backgroundColor: toneStyle.glow }}
      />
      <div className="absolute -bottom-12 left-5 h-28 w-28 rounded-full bg-white/70" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">
            {title}
          </p>
          <strong
            className="mt-3 block text-5xl font-black leading-none"
            style={{ color: toneStyle.accent }}
          >
            {value}
          </strong>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-lg backdrop-blur ${toneStyle.icon}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="relative mt-5 text-base font-bold text-stone-500">{helper}</p>
    </article>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-[#E5B7A6] bg-[#FFF8F4] px-5 py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20">
        <BarChart3 size={22} />
      </div>
      <p className="mt-3 text-sm font-black text-stone-700">{text}</p>
    </div>
  );
}

function ReportTable({ columns, rows, emptyText }) {
  if (!rows.length) return <EmptyState text={emptyText} />;

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left text-base">
        <thead className="bg-[#FFF7ED] text-sm font-black uppercase tracking-[0.12em] text-stone-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-4">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, index) => (
            <tr key={row.id ?? row.date ?? row.food_id ?? index} className="transition hover:bg-[#FFF8F4]">
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 text-base font-bold text-stone-700">
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerDashboard() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [restaurant, setRestaurant] = useState(null);
  const [summary, setSummary] = useState(null);
  const [topFoods, setTopFoods] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [dailyOrders, setDailyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const dragStartX = useRef(0);
  const slide = slides[activeSlide];

  const permissions = getUserPermissions();
  const canViewReports = permissions.includes("view_reports");

  const params = useMemo(() => ({ from, to }), [from, to]);

  const goToPreviousSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  };

  const goToNextSlide = () => {
    setActiveSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  };

  const loadReports = async () => {
    if (!canViewReports) {
      setIsLoading(false);
      setErrorMessage("This manager does not have the view_reports permission.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const restaurantId = await ensureManagerRestaurantId();

      if (!restaurantId) {
        throw new Error("Restaurant id was not found for this manager.");
      }

      const [summaryRes, topFoodsRes, revenueRes, ordersRes] = await Promise.all([
        api.get(`/restaurants/${restaurantId}/reports/summary`, { params }),
        api.get(`/restaurants/${restaurantId}/reports/top-foods`, {
          params: { ...params, limit: 5 },
        }),
        api.get(`/restaurants/${restaurantId}/reports/daily-revenue`, { params }),
        api.get(`/restaurants/${restaurantId}/reports/daily-orders`, { params }),
      ]);

      setSummary(summaryRes.data);
      setRestaurant(summaryRes.data?.restaurant ?? { id: restaurantId });
      setTopFoods(getList(topFoodsRes.data));
      setDailyRevenue(getList(revenueRes.data).slice(-7));
      setDailyOrders(getList(ordersRes.data).slice(-7));
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Reports could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isSliderPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) =>
        current === slides.length - 1 ? 0 : current + 1
      );
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isSliderPaused]);

  const handlePointerDown = (event) => {
    if (event.target.closest("a,button")) return;

    setIsSliderPaused(true);
    setIsDragging(true);
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    setDragOffset(event.clientX - dragStartX.current);
  };

  const handlePointerUp = (event) => {
    if (!isDragging) return;

    const distance = event.clientX - dragStartX.current;

    if (distance > 80) {
      goToPreviousSlide();
    } else if (distance < -80) {
      goToNextSlide();
    }

    setDragOffset(0);
    setIsDragging(false);
    setIsSliderPaused(false);
  };

  const orders = summary?.orders ?? {};
  const revenue = summary?.revenue ?? {};

  return (
    <div className="space-y-6">
      <section
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${slide.bg} text-white shadow-2xl ${slide.glow}`}
      >
        <div
          className={`flex cursor-grab select-none ${
            isDragging ? "cursor-grabbing" : "transition-transform duration-700 ease-out"
          }`}
          style={{
            transform: `translate3d(calc(-${activeSlide * 100}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {slides.map((item) => {
            const SlideIcon = item.icon;

            return (
              <div
                key={item.eyebrow}
                className={`grid min-h-[330px] min-w-full gap-6 bg-gradient-to-br ${item.bg} p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8`}
              >
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/80 backdrop-blur">
                      <SlideIcon size={15} />
                      {item.eyebrow}
                    </div>

                    <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">
                      {item.title}
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 md:text-base">
                      {item.text}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      to={item.to}
                      className={`group inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-100 ${item.accent}`}
                    >
                      {item.action}
                      <ArrowUpRight
                        size={17}
                        className="transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>

                    <div className="flex items-center gap-2">
                      {slides.map((dot, index) => (
                        <button
                          key={dot.eyebrow}
                          type="button"
                          onClick={() => setActiveSlide(index)}
                          className={`h-2.5 rounded-full transition duration-200 ${
                            activeSlide === index
                              ? "w-9 bg-white"
                              : "w-2.5 bg-white/35 hover:bg-white/70"
                          }`}
                          aria-label={`Go to ${dot.eyebrow}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-14 w-14 place-items-center rounded-lg ${item.accent}`}>
                      <SlideIcon size={27} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={goToPreviousSlide}
                        className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white transition duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                      >
                        <ChevronLeft size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextSlide}
                        className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white transition duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                      >
                        <ChevronRight size={19} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white/60">Focus</p>
                    <strong className="mt-2 block text-5xl font-black">
                      {item.metric}
                    </strong>
                    <p className="mt-2 text-sm font-bold text-white/70">
                      {item.metricLabel}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-lg border border-[#F2C7B3] bg-gradient-to-br from-[#FFF1E7] via-white to-[#EAF8FF] p-5 shadow-sm">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#F97316]/10" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[#0EA5E9]/10" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F6B79A] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#7F1D1D] shadow-sm">
              <BarChart3 size={14} />
              View Reports
            </div>
            <h1 className="text-3xl font-black text-stone-950">
              Restaurant performance
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-500">
              {restaurant?.name || "This manager's restaurant"}
              {restaurant?.id ? ` · Restaurant #${restaurant.id}` : ""} · live sales,
              orders, and best sellers.
            </p>
          </div>

          <div className="relative flex flex-col gap-3 md:flex-row md:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase text-stone-500">
                From
              </span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase text-stone-500">
                To
              </span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
              />
            </label>
            <button
              type="button"
              onClick={loadReports}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/15 transition hover:-translate-y-0.5 hover:bg-[#681718] disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh
            </button>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertTriangle size={18} />
          {errorMessage}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Revenue"
              value={isLoading ? "..." : money(revenue.total)}
              helper="Paid invoices"
              icon={DollarSign}
              tone="green"
            />
            <StatCard
              title="Orders"
              value={isLoading ? "..." : orders.total ?? 0}
              helper="All orders"
              icon={ClipboardList}
              tone="blue"
            />
            <StatCard
              title="Completed"
              value={isLoading ? "..." : orders.completed ?? 0}
              helper="Finished orders"
              icon={TrendingUp}
              tone="red"
            />
            <StatCard
              title="Active"
              value={isLoading ? "..." : orders.active ?? 0}
              helper="In progress"
              icon={CalendarDays}
              tone="amber"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="overflow-hidden rounded-lg border border-[#F6C8AA] bg-white shadow-sm">
              <div
                className="border-b border-[#E8D8D2] bg-[#FFF8F7] p-5 text-stone-950"
                style={{
                  background:
                    "linear-gradient(90deg, #FFF8F7 0%, #FFFFFF 100%)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7F1D1D]">
                      Daily Revenue
                    </p>
                    <h2 className="mt-1 text-xl font-black text-stone-950">
                      Revenue pulse
                    </h2>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#F9ECEC] text-[#7F1D1D]">
                    <DollarSign size={22} />
                  </div>
                </div>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <EmptyState text="Loading revenue..." />
                ) : dailyRevenue.length ? (
                  <ReportTable
                    rows={dailyRevenue}
                    emptyText="No paid revenue for this range."
                    columns={[
                      {
                        key: "date",
                        label: "Date",
                        render: (row) => (
                          <span className="text-lg font-black text-stone-950">{row.date}</span>
                        ),
                      },
                      {
                        key: "revenue",
                        label: "Revenue",
                        render: (row) => (
                          <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-base font-black text-emerald-700">
                            {money(row.revenue)}
                          </span>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <EmptyState text="No paid revenue for this range." />
                )}
              </div>
            </article>

            <article className="overflow-hidden rounded-lg border border-[#BAE6FD] bg-white shadow-sm">
              <div
                className="border-b border-[#D6E6EF] bg-[#F1F7FB] p-5 text-stone-950"
                style={{
                  background:
                    "linear-gradient(90deg, #F1F7FB 0%, #FFFFFF 100%)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2E6F8F]">
                      Daily Orders
                    </p>
                    <h2 className="mt-1 text-xl font-black text-stone-950">
                      Order flow
                    </h2>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
                    <ClipboardList size={22} />
                  </div>
                </div>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <EmptyState text="Loading orders..." />
                ) : dailyOrders.length ? (
                  <ReportTable
                    rows={dailyOrders}
                    emptyText="No orders for this range."
                    columns={[
                      {
                        key: "date",
                        label: "Date",
                        render: (row) => (
                          <span className="text-lg font-black text-stone-950">{row.date}</span>
                        ),
                      },
                      {
                        key: "total_orders",
                        label: "Total",
                        render: (row) => (
                          <span className="rounded-full bg-sky-50 px-4 py-1.5 text-base font-black text-sky-700">
                            {row.total_orders ?? 0}
                          </span>
                        ),
                      },
                      {
                        key: "completed_orders",
                        label: "Done",
                        render: (row) => (
                          <span className="text-lg font-black text-emerald-700">{row.completed_orders ?? 0}</span>
                        ),
                      },
                      {
                        key: "cancelled_orders",
                        label: "Cancel",
                        render: (row) => (
                          <span className="text-lg font-black text-red-700">{row.cancelled_orders ?? 0}</span>
                        ),
                      },
                      {
                        key: "active_orders",
                        label: "Active",
                        render: (row) => (
                          <span className="text-lg font-black text-amber-700">{row.active_orders ?? 0}</span>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <EmptyState text="No orders for this range." />
                )}
              </div>
            </article>
          </div>
        </div>

        <article className="overflow-hidden rounded-lg border border-[#E9C6BF] bg-white shadow-sm">
          <div
            className="border-b border-[#E8D8D2] bg-[#FFF8F7] p-5 text-stone-950"
            style={{
              background:
                "linear-gradient(90deg, #FFF8F7 0%, #FFFFFF 100%)",
            }}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7F1D1D]">
                  Top Foods
                </p>
                <h2 className="mt-1 text-2xl font-black text-stone-950">
                  Best sellers
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#F9ECEC] text-[#7F1D1D]">
                <ChefHat size={24} />
              </div>
            </div>

            {topFoods[0] && !isLoading ? (
              <div className="rounded-lg border border-[#E8D8D2] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">
                  Leader
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight text-stone-950">
                  {topFoods[0].food_name || `Food #${topFoods[0].food_id}`}
                </h3>
                <p className="mt-2 text-sm font-bold text-stone-500">
                  {Number(topFoods[0].total_sold || 0)} sold in this range
                </p>
              </div>
            ) : null}
          </div>

          <div className="p-4">
            {isLoading ? (
              <EmptyState text="Loading top foods..." />
            ) : topFoods.length ? (
              <ReportTable
                rows={topFoods}
                emptyText="No completed food sales for this range."
                columns={[
                  {
                    key: "rank",
                    label: "#",
                    render: (_row, index) => (
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#7F1D1D] text-base font-black text-white">
                        {index + 1}
                      </span>
                    ),
                  },
                  {
                    key: "food_name",
                    label: "Food",
                    render: (row) => (
                      <span className="text-lg font-black text-stone-950">
                        {row.food_name || `Food #${row.food_id}`}
                      </span>
                    ),
                  },
                  {
                    key: "total_sold",
                    label: "Sold",
                    render: (row) => (
                      <span className="rounded-full bg-[#FFF1E7] px-4 py-1.5 text-base font-black text-[#7F1D1D]">
                        {row.total_sold ?? 0}
                      </span>
                    ),
                  },
                ]}
              />
            ) : (
              <EmptyState text="No completed food sales for this range." />
            )}
          </div>
        </article>
      </section>

    </div>
  );
}
