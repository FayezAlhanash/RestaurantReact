import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
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
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";
import { useTheme } from "../../context/ThemeContext";

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
    bg: "from-[#101517] via-[#1D2427] to-[#2A171C]",
    accent: "bg-[#FFD166] text-[#151A1D]",
    accentSoft: "bg-[#FFD166]/16 text-[#FFD166]",
    glow: "shadow-[#7F1D1D]/20",
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
    bg: "from-[#101517] via-[#172327] to-[#352027]",
    accent: "bg-[#7F1D1D] text-white",
    accentSoft: "bg-[#7F1D1D]/18 text-[#7F1D1D]",
    glow: "shadow-[#7F1D1D]/20",
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
    bg: "from-[#101517] via-[#26181B] to-[#3A2025]",
    accent: "bg-[#FFD166] text-[#151A1D]",
    accentSoft: "bg-[#FFD166]/16 text-[#FFD166]",
    glow: "shadow-[#FFD166]/20",
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
  const { isLight } = useTheme();
  const tones = {
    red: {
      background: "linear-gradient(135deg, #303539 0%, #252A2D 100%)",
      accent: "#7F1D1D",
      border: "rgba(127,29,29,0.24)",
      icon: "bg-[#7F1D1D]/14 text-[#7F1D1D]",
      glow: "rgba(127,29,29,0.08)",
    },
    green: {
      background: "linear-gradient(135deg, #303539 0%, #252A2D 100%)",
      accent: "#FFD166",
      border: "rgba(255,209,102,0.22)",
      icon: "bg-[#FFD166]/14 text-[#FFD166]",
      glow: "rgba(255,209,102,0.08)",
    },
    blue: {
      background: "linear-gradient(135deg, #303539 0%, #252A2D 100%)",
      accent: "#FFD166",
      border: "rgba(255,255,255,0.14)",
      icon: "bg-[#FFD166]/14 text-[#FFD166]",
      glow: "rgba(255,209,102,0.08)",
    },
    amber: {
      background: "linear-gradient(135deg, #303539 0%, #252A2D 100%)",
      accent: "#FFD166",
      border: "rgba(255,209,102,0.22)",
      icon: "bg-[#FFD166]/14 text-[#FFD166]",
      glow: "rgba(255,209,102,0.08)",
    },
  };
  const toneStyle = tones[tone] ?? tones.red;
  const lightTone = {
    red: { accent: "#7F1D1D", border: "rgba(127,29,29,0.24)", icon: "bg-[#7F1D1D]/12 text-[#7F1D1D]" },
    green: { accent: "#9B6A00", border: "rgba(255,209,102,0.52)", icon: "bg-[#FFD166]/18 text-[#8f5f00]" },
    blue: { accent: "#9B6A00", border: "rgba(127,29,29,0.16)", icon: "bg-[#FFD166]/18 text-[#8f5f00]" },
    amber: { accent: "#9B6A00", border: "rgba(255,209,102,0.52)", icon: "bg-[#FFD166]/18 text-[#8f5f00]" },
  }[tone] ?? { accent: "#7F1D1D", border: "rgba(127,29,29,0.16)", icon: "bg-[#7F1D1D]/12 text-[#7F1D1D]" };

  return (
    <article
      className="relative min-h-[190px] overflow-hidden rounded-[28px] border p-6 shadow-[0_18px_42px_rgba(0,0,0,0.22)]"
      style={{
        background: isLight
          ? "linear-gradient(135deg, #FFF9F2 0%, #F8EFE8 100%)"
          : toneStyle.background,
        borderColor: isLight ? lightTone.border : toneStyle.border,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: isLight ? lightTone.accent : toneStyle.accent }} />
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-xl"
        style={{ backgroundColor: toneStyle.glow }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-black uppercase tracking-[0.16em] ${isLight ? "text-[#7A6A64]" : "text-white/60"}`}>
            {title}
          </p>
          <strong
            className="mt-5 block text-7xl font-black leading-none"
            style={{ color: isLight ? lightTone.accent : toneStyle.accent }}
          >
            {value}
          </strong>
        </div>
        <div className={`grid h-14 w-14 place-items-center rounded-2xl backdrop-blur ${isLight ? lightTone.icon : toneStyle.icon}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className={`relative mt-6 text-xl font-bold ${isLight ? "text-[#6E5E58]" : "text-white/76"}`}>{helper}</p>
    </article>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.05] px-5 py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20">
        <BarChart3 size={22} />
      </div>
      <p className="mt-3 text-sm font-black text-white/70">{text}</p>
    </div>
  );
}

function ReportTable({ columns, rows, emptyText }) {
  if (!rows.length) return <EmptyState text={emptyText} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12181B]">
      <table className="w-full border-collapse text-left text-base">
        <thead className="bg-white/[0.06] text-sm font-black uppercase tracking-[0.12em] text-white/48">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-4">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row, index) => (
            <tr key={row.id ?? row.date ?? row.food_id ?? index} className="transition hover:bg-white/[0.05]">
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 text-base font-bold text-white/72">
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
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [summary, setSummary] = useState(null);
  const [topFoods, setTopFoods] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [dailyOrders, setDailyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const dragStartX = useRef(0);
  const slide = slides[activeSlide];

  const permissions = getUserPermissions();
  const user = getStoredUser();
  const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
  const canViewReports =
    permissions.includes("view_reports") || permissions.includes("view_global_reports");

  const params = useMemo(() => ({ from, to }), [from, to]);

  const getActiveRestaurantId = useCallback(async () => {
    if (isAdmin) return selectedRestaurantId || null;

    return ensureManagerRestaurantId();
  }, [isAdmin, selectedRestaurantId]);

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

  const loadReports = useCallback(async () => {
    if (!canViewReports) {
      setIsLoading(false);
      setErrorMessage("This manager does not have the view_reports permission.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const restaurantId = await getActiveRestaurantId();

      if (!restaurantId) {
        throw new Error(
          isAdmin
            ? "Choose a restaurant dashboard first."
            : "Restaurant id was not found for this manager."
        );
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
  }, [canViewReports, getActiveRestaurantId, isAdmin, params]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const fetchRestaurants = async () => {
      try {
        const res = await api.get("/restaurants");
        const restaurantList = res.data.restaurants || res.data.data || [];

        setRestaurants(restaurantList);
        setSelectedRestaurantId((current) => current || restaurantList[0]?.id || "");
      } catch (error) {
        console.log(error.response?.data || error);
        setErrorMessage("Restaurants could not be loaded for admin reports.");
      }
    };

    fetchRestaurants();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && !selectedRestaurantId) {
      setIsLoading(false);
      return;
    }

    loadReports();
  }, [isAdmin, loadReports, selectedRestaurantId]);

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
    <div className="min-h-full space-y-6 bg-[radial-gradient(circle_at_85%_8%,rgba(127,29,29,0.18),transparent_28%),radial-gradient(circle_at_15%_20%,rgba(255,209,102,0.12),transparent_24%),linear-gradient(145deg,#101517_0%,#171D20_52%,#26181B_100%)] p-4 text-white sm:p-6">
      <section
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br ${slide.bg} text-white shadow-2xl ${slide.glow}`}
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
                    <div className={`mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur ${item.accentSoft}`}>
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
                      className={`group inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-100 ${item.accent}`}
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

                <div className="flex flex-col justify-between rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl ${item.accent}`}>
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

      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#252A2D] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#7F1D1D]/14" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-[#FFD166]/10" />
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7F1D1D]/30 bg-[#7F1D1D]/12 px-4 py-1.5 text-sm font-black uppercase tracking-[0.16em] text-[#7F1D1D] shadow-sm">
              <BarChart3 size={14} />
              View Reports
            </div>
            <h1 className="text-4xl font-black leading-tight text-white">
              Restaurant performance
            </h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/68">
              {restaurant?.name || "This manager's restaurant"}
              {restaurant?.id ? ` · Restaurant #${restaurant.id}` : ""} · live sales,
              orders, and best sellers.
            </p>
          </div>

          {isAdmin && (
            <div className="relative min-w-[min(100%,520px)] rounded-[24px] border border-[#FFD166]/30 bg-[#11181B]/78 p-4 shadow-[0_18px_38px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                  <Building2 size={21} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                    Admin dashboard view
                  </p>
                  <h3 className="text-lg font-black text-white">
                    Open any manager dashboard
                  </h3>
                </div>
              </div>

              {restaurants.length > 0 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {restaurants.map((item) => {
                    const active = String(selectedRestaurantId) === String(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedRestaurantId(item.id);
                          setRestaurant(item);
                          setSummary(null);
                          setTopFoods([]);
                          setDailyRevenue([]);
                          setDailyOrders([]);
                        }}
                        className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                          active
                            ? "border-[#FFD166]/80 bg-[#FFD166]/18 text-[#FFD166] shadow-[0_12px_26px_rgba(255,209,102,0.12)]"
                            : "border-white/12 bg-[#0D1214]/70 text-white/68 hover:border-[#FFD166]/40 hover:bg-[#FFD166]/10 hover:text-white"
                        }`}
                      >
                        #{item.id} {item.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-white/10 bg-black/16 px-4 py-3 text-sm font-bold text-white/55">
                  Loading restaurants...
                </p>
              )}
            </div>
          )}

          <div className="relative rounded-[24px] border border-white/10 bg-black/18 p-4">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#FFD166]">
              Report date range
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-black uppercase text-white/70">
                From date
              </span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-base font-black text-white outline-none [color-scheme:dark] focus:border-[#FFD166] focus:ring-4 focus:ring-[#FFD166]/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black uppercase text-white/70">
                To date
              </span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-base font-black text-white outline-none [color-scheme:dark] focus:border-[#FFD166] focus:ring-4 focus:ring-[#FFD166]/10"
              />
            </label>
            <button
              type="button"
              onClick={loadReports}
              disabled={isLoading}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-base font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition hover:-translate-y-0.5 hover:bg-[#681718] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
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
        </div>
      </section>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertTriangle size={18} />
          {errorMessage}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
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

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#252A2D] shadow-[0_18px_42px_rgba(0,0,0,0.20)]">
              <div
                className="border-b border-white/10 p-5 text-white"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7F1D1D]">
                      Daily Revenue
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      Revenue pulse
                    </h2>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7F1D1D]/18 text-[#7F1D1D]">
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
                          <span className="text-lg font-black text-white">{row.date}</span>
                        ),
                      },
                      {
                        key: "revenue",
                        label: "Revenue",
                        render: (row) => (
                          <span className="rounded-full bg-emerald-400/12 px-4 py-1.5 text-base font-black text-emerald-300">
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

            <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#252A2D] shadow-[0_18px_42px_rgba(0,0,0,0.20)]">
              <div
                className="border-b border-white/10 p-5 text-white"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-sky-300">
                      Daily Orders
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      Order flow
                    </h2>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-300/14 text-sky-300">
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
                          <span className="text-lg font-black text-white">{row.date}</span>
                        ),
                      },
                      {
                        key: "total_orders",
                        label: "Total",
                        render: (row) => (
                          <span className="rounded-full bg-sky-300/12 px-4 py-1.5 text-base font-black text-sky-300">
                            {row.total_orders ?? 0}
                          </span>
                        ),
                      },
                      {
                        key: "completed_orders",
                        label: "Done",
                        render: (row) => (
                          <span className="text-lg font-black text-emerald-300">{row.completed_orders ?? 0}</span>
                        ),
                      },
                      {
                        key: "cancelled_orders",
                        label: "Cancel",
                        render: (row) => (
                          <span className="text-lg font-black text-[#7F1D1D]">{row.cancelled_orders ?? 0}</span>
                        ),
                      },
                      {
                        key: "active_orders",
                        label: "Active",
                        render: (row) => (
                          <span className="text-lg font-black text-[#FFD166]">{row.active_orders ?? 0}</span>
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

        <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#252A2D] shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
          <div
            className="border-b border-white/10 p-5 text-white"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7F1D1D]">
                  Top Foods
                </p>
                <h2 className="mt-1 text-3xl font-black text-white">
                  Best sellers
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D]/18 text-[#7F1D1D]">
                <ChefHat size={24} />
              </div>
            </div>

            {topFoods[0] && !isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-black/16 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]">
                  Leader
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight text-white">
                  {topFoods[0].food_name || `Food #${topFoods[0].food_id}`}
                </h3>
                <p className="mt-2 text-sm font-bold text-white/55">
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
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#7F1D1D] text-base font-black text-white">
                        {index + 1}
                      </span>
                    ),
                  },
                  {
                    key: "food_name",
                    label: "Food",
                    render: (row) => (
                      <span className="text-lg font-black text-white">
                        {row.food_name || `Food #${row.food_id}`}
                      </span>
                    ),
                  },
                  {
                    key: "total_sold",
                    label: "Sold",
                    render: (row) => (
                      <span className="rounded-full bg-[#FFD166]/14 px-4 py-1.5 text-base font-black text-[#FFD166]">
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
