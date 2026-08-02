import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  ChefHat,
  ClipboardList,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import api from "../../API/axios";
import { ensureManagerRestaurantId } from "./managerHelpers";
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";
import { useTheme } from "../../context/ThemeContext";

const currentYear = new Date().getFullYear();
const defaultFrom = `${currentYear}-01-01`;
const defaultTo = `${currentYear}-12-31`;

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getList(data) {
  if (Array.isArray(data?.top_foods)) return data.top_foods;
  if (Array.isArray(data?.topFoods)) return data.topFoods;
  if (Array.isArray(data?.foods)) return data.foods;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.top_foods)) return data.data.top_foods;
  if (Array.isArray(data?.data?.topFoods)) return data.data.topFoods;
  if (Array.isArray(data?.data?.foods)) return data.data.foods;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function getFoodName(row) {
  return (
    row?.food_name ||
    row?.foodName ||
    row?.menu_item_name ||
    row?.menuItemName ||
    row?.food?.name ||
    row?.menu_item?.name ||
    row?.menuItem?.name ||
    row?.name ||
    `Food #${row?.food_id ?? row?.foodId ?? row?.id ?? ""}`
  );
}

function getFoodSoldCount(row) {
  return Number(
    row?.total_sold ??
      row?.totalSold ??
      row?.sold ??
      row?.sold_quantity ??
      row?.soldQuantity ??
      row?.quantity_sold ??
      row?.quantitySold ??
      row?.total_quantity ??
      row?.totalQuantity ??
      row?.quantity ??
      row?.qty ??
      row?.count ??
      0
  );
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
    red: { accent: "#8F1D1D", border: "rgba(143,29,29,0.34)", icon: "bg-[#F3DCDC] text-[#8F1D1D]", background: "linear-gradient(135deg,#FFF7F4 0%,#F3DCDC 100%)" },
    green: { accent: "#08764D", border: "rgba(15,139,95,0.35)", icon: "bg-[#D9F2E5] text-[#08764D]", background: "linear-gradient(135deg,#F5FFF9 0%,#D9F2E5 100%)" },
    blue: { accent: "#075985", border: "rgba(2,132,199,0.35)", icon: "bg-[#DDF1FF] text-[#075985]", background: "linear-gradient(135deg,#F7FCFF 0%,#DDF1FF 100%)" },
    amber: { accent: "#8A5700", border: "rgba(193,130,0,0.42)", icon: "bg-[#FFE8A3] text-[#8A5700]", background: "linear-gradient(135deg,#FFFDF5 0%,#FFE8A3 100%)" },
  }[tone] ?? { accent: "#7F1D1D", border: "rgba(127,29,29,0.16)", icon: "bg-[#7F1D1D]/12 text-[#7F1D1D]" };

  return (
    <article
      className="relative min-h-[148px] overflow-hidden rounded-[24px] border p-5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
      style={{
        background: isLight
          ? lightTone.background
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
          <p className={`text-sm font-black uppercase tracking-[0.16em] ${isLight ? "text-[#5A4037]" : "text-white/60"}`}>
            {title}
          </p>
          <strong
            className="mt-4 block text-[clamp(3rem,2.4rem+1.4vw,4.25rem)] font-black leading-none"
            style={{ color: isLight ? lightTone.accent : toneStyle.accent }}
          >
            {value}
          </strong>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl backdrop-blur ${isLight ? lightTone.icon : toneStyle.icon}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className={`relative mt-4 text-base font-bold ${isLight ? "text-[#4F403A]" : "text-white/76"}`}>{helper}</p>
    </article>
  );
}

function EmptyState({ text }) {
  const { isLight } = useTheme();

  return (
    <div className={`flex min-h-[154px] flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center ${
      isLight
        ? "border-[#D8B7A8] bg-[#FFF1E8]"
        : "border-white/15 bg-white/[0.05]"
    }`}>
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20">
        <BarChart3 size={20} />
      </div>
      <p className={`mt-3 text-sm font-black ${isLight ? "text-[#5A4037]" : "text-white/70"}`}>{text}</p>
    </div>
  );
}

function ReportTable({ columns, rows, emptyText }) {
  const { isLight } = useTheme();

  if (!rows.length) return <EmptyState text={emptyText} />;

  return (
    <div className={`cashier-scroll max-w-full overflow-x-auto rounded-2xl border ${
      isLight ? "border-[#D8B7A8] bg-[#FFFDF8]" : "border-white/10 bg-[#12181B]"
    }`}>
      <table className="min-w-full border-collapse text-left text-base">
        <thead className={`text-sm font-black uppercase tracking-[0.12em] ${
          isLight ? "bg-[#EAD2C5] text-[#5A4037]" : "bg-white/[0.06] text-white/48"
        }`}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-4 sm:px-5">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isLight ? "divide-y divide-[#DEC2B5]" : "divide-y divide-white/10"}>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.date ?? row.food_id ?? index} className={`transition ${isLight ? "hover:bg-[#FFF1E8]" : "hover:bg-white/[0.05]"}`}>
              {columns.map((column) => (
                <td key={column.key} className={`whitespace-nowrap px-4 py-4 text-base font-bold sm:px-5 ${isLight ? "text-[#3A2B26]" : "text-white/72"}`}>
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
  const { isLight } = useTheme();
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
      const frameId = window.requestAnimationFrame(() => {
        setIsLoading(false);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    const frameId = window.requestAnimationFrame(() => {
      loadReports();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isAdmin, loadReports, selectedRestaurantId]);

  const orders = summary?.orders ?? {};
  const revenue = summary?.revenue ?? {};
  const reportArticleClass = isLight
    ? "min-w-0 overflow-hidden rounded-[28px] border border-[#D8B7A8] bg-[#FFFDF8] shadow-[0_18px_42px_rgba(127,29,29,0.12)]"
    : "min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#252A2D] shadow-[0_18px_42px_rgba(0,0,0,0.20)]";
  const reportHeaderClass = isLight
    ? "border-b border-[#D8B7A8] bg-[linear-gradient(90deg,#FFF1E8_0%,#F3DCDC_100%)] p-5 text-[#241815]"
    : "border-b border-white/10 p-5 text-white";

  return (
    <div
      className={`min-h-full space-y-6 p-4 sm:p-6 ${
        isLight
          ? "bg-[radial-gradient(circle_at_85%_8%,rgba(143,29,29,0.13),transparent_28%),radial-gradient(circle_at_15%_20%,rgba(216,162,45,0.20),transparent_24%),linear-gradient(145deg,#FFFDF8_0%,#F7E9E0_52%,#EFD4CA_100%)] text-[#241815]"
          : "bg-[radial-gradient(circle_at_85%_8%,rgba(127,29,29,0.18),transparent_28%),radial-gradient(circle_at_15%_20%,rgba(255,209,102,0.12),transparent_24%),linear-gradient(145deg,#101517_0%,#171D20_52%,#26181B_100%)] text-white"
      }`}
    >
      <section
        className={`relative overflow-hidden rounded-[30px] border p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] ${
          isLight
            ? "border-[#D8B7A8] bg-[linear-gradient(135deg,#FFFDF8_0%,#F6E3DA_54%,#EBCAC0_100%)] shadow-[0_24px_60px_rgba(127,29,29,0.13)]"
            : "border-white/10 bg-[#252A2D]"
        }`}
      >
        <div className={`absolute right-0 top-0 h-32 w-32 rounded-bl-full ${isLight ? "bg-[#8F1D1D]/16" : "bg-[#7F1D1D]/14"}`} />
        <div className={`absolute bottom-0 left-0 h-24 w-24 rounded-tr-full ${isLight ? "bg-[#D8A22D]/24" : "bg-[#FFD166]/10"}`} />
        <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(240px,0.9fr)_minmax(280px,1.2fr)_minmax(280px,1fr)] 2xl:items-center">
          <div className="relative min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7F1D1D]/30 bg-[#7F1D1D]/12 px-4 py-1.5 text-sm font-black uppercase tracking-[0.16em] text-[#7F1D1D] shadow-sm">
              <BarChart3 size={14} />
              View Reports
            </div>
            <h1 className={`text-[clamp(2rem,1.45rem+1.15vw,3rem)] font-black leading-tight ${isLight ? "text-[#241815]" : "text-white"}`}>
              Restaurant performance
            </h1>
            <p className={`mt-3 max-w-2xl text-[clamp(0.94rem,0.82rem+0.22vw,1rem)] font-semibold leading-7 ${isLight ? "text-[#5A4037]" : "text-white/68"}`}>
              {restaurant?.name || "This manager's restaurant"}
              {restaurant?.id ? ` · Restaurant #${restaurant.id}` : ""} · live sales,
              orders, and best sellers.
            </p>
          </div>

          {isAdmin && (
            <div
              className={`relative min-w-0 rounded-[24px] border p-4 shadow-[0_18px_38px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04] ${
                isLight
                  ? "border-[#C18200]/35 bg-[#FFF2C7] shadow-[0_18px_38px_rgba(193,130,0,0.14)]"
                  : "border-[#FFD166]/30 bg-[#11181B]/78"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${
                  isLight
                    ? "border-[#B17400]/35 bg-[#FFD166]/40 text-[#8A5700]"
                    : "border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]"
                }`}>
                  <Building2 size={21} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>
                    Admin dashboard view
                  </p>
                  <h3 className={`line-clamp-2 text-[clamp(1rem,0.86rem+0.28vw,1.125rem)] font-black leading-tight ${isLight ? "text-[#241815]" : "text-white"}`}>
                    Open any manager dashboard
                  </h3>
                </div>
              </div>

              {restaurants.length > 0 ? (
                <div className="cashier-scroll mt-4 flex gap-2 overflow-x-auto pb-1">
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
                        className={`shrink-0 rounded-2xl border px-4 py-2 text-[clamp(0.78rem,0.68rem+0.2vw,0.9rem)] font-black transition ${
                          active
                            ? isLight
                              ? "border-[#C18200]/70 bg-[#FFD166]/45 text-[#7A4F00] shadow-[0_12px_26px_rgba(193,130,0,0.16)]"
                              : "border-[#FFD166]/80 bg-[#FFD166]/18 text-[#FFD166] shadow-[0_12px_26px_rgba(255,209,102,0.12)]"
                            : isLight
                              ? "border-[#D8B7A8] bg-white text-[#5A4037] hover:border-[#C18200]/45 hover:bg-[#FFF7D8] hover:text-[#241815]"
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

          <div className={`relative min-w-0 rounded-[24px] border p-4 ${
            isLight
              ? "border-[#D8B7A8] bg-[#FFFDF8]"
              : "border-white/10 bg-black/18"
          }`}>
            <p className={`mb-3 text-sm font-black uppercase tracking-[0.16em] ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>
              Report date range
            </p>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className={`mb-2 block text-sm font-black uppercase ${isLight ? "text-[#3F2A23]" : "text-white/70"}`}>
                  From date
                </span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className={`h-14 w-full min-w-0 rounded-2xl border px-3 text-[0.95rem] font-black outline-none transition focus:border-[#8F1D1D] focus:ring-4 focus:ring-[#8F1D1D]/12 ${
                    isLight
                      ? "border-[#B97863] bg-[#FFF8F2] text-[#160F0C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_8px_18px_rgba(127,29,29,0.08)] [color-scheme:light]"
                      : "border-white/10 bg-white/[0.08] text-white [color-scheme:dark]"
                  }`}
                />
              </label>
              <label className="block min-w-0">
                <span className={`mb-2 block text-sm font-black uppercase ${isLight ? "text-[#3F2A23]" : "text-white/70"}`}>
                  To date
                </span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className={`h-14 w-full min-w-0 rounded-2xl border px-3 text-[0.95rem] font-black outline-none transition focus:border-[#8F1D1D] focus:ring-4 focus:ring-[#8F1D1D]/12 ${
                    isLight
                      ? "border-[#B97863] bg-[#FFF8F2] text-[#160F0C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_8px_18px_rgba(127,29,29,0.08)] [color-scheme:light]"
                      : "border-white/10 bg-white/[0.08] text-white [color-scheme:dark]"
                  }`}
                />
              </label>
              <button
                type="button"
                onClick={loadReports}
                disabled={isLoading}
                className={`inline-flex h-14 min-w-[128px] items-center justify-center gap-2 rounded-2xl border px-5 text-base font-black text-white [color:#fff] shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:[color:#fff] sm:col-span-2 ${
                  isLight
                    ? "border-[#8F1D1D] bg-[#8F1D1D] shadow-[#8F1D1D]/20 hover:bg-[#6F1717] disabled:border-[#8F1D1D]/70 disabled:bg-[#8F1D1D]/80 disabled:opacity-90"
                    : "border-[#7F1D1D] bg-[#7F1D1D] shadow-[#7F1D1D]/20 hover:bg-[#681718] disabled:border-[#7F1D1D]/50 disabled:bg-[#7F1D1D]/55"
                }`}
                style={{ color: "#fff" }}
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

      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)] xl:items-start">
          <article className={`${reportArticleClass} xl:min-h-[386px]`}>
            <div className={reportHeaderClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-sm font-black uppercase tracking-[0.14em] ${isLight ? "text-sky-700" : "text-sky-300"}`}>
                    Daily Orders
                  </p>
                  <h2 className={`mt-1 text-2xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                    Order flow
                  </h2>
                </div>
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${isLight ? "bg-[#DDF1FF] text-sky-700" : "bg-sky-300/14 text-sky-300"}`}>
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
                        <span className={`text-lg font-black ${isLight ? "text-[#241815]" : "text-white"}`}>{row.date}</span>
                      ),
                    },
                    {
                      key: "total_orders",
                      label: "Total",
                      render: (row) => (
                        <span className={`rounded-full px-4 py-1.5 text-base font-black ${
                          isLight
                            ? "border border-sky-600/25 bg-[#DDF1FF] text-sky-700"
                            : "bg-sky-300/12 text-sky-300"
                        }`}>
                          {row.total_orders ?? 0}
                        </span>
                      ),
                    },
                    {
                      key: "completed_orders",
                      label: "Done",
                      render: (row) => (
                        <span className={`text-lg font-black ${isLight ? "text-[#08764D]" : "text-emerald-300"}`}>{row.completed_orders ?? 0}</span>
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
                        <span className={`text-lg font-black ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>{row.active_orders ?? 0}</span>
                      ),
                    },
                  ]}
                />
              ) : (
                <EmptyState text="No orders for this range." />
              )}
            </div>
          </article>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <article className={reportArticleClass}>
              <div className={reportHeaderClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7F1D1D]">
                      Daily Revenue
                    </p>
                    <h2 className={`mt-1 text-2xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                      Revenue pulse
                    </h2>
                  </div>
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl ${isLight ? "bg-[#F3DCDC] text-[#8F1D1D]" : "bg-[#7F1D1D]/18 text-[#7F1D1D]"}`}>
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
                          <span className={`text-lg font-black ${isLight ? "text-[#241815]" : "text-white"}`}>{row.date}</span>
                        ),
                      },
                      {
                        key: "revenue",
                        label: "Revenue",
                        render: (row) => (
                          <span className={`rounded-full px-4 py-1.5 text-base font-black ${
                            isLight
                              ? "border border-[#0F8B5F]/30 bg-[#D9F2E5] text-[#08764D]"
                              : "bg-emerald-400/12 text-emerald-300"
                          }`}>
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

            <article className={reportArticleClass}>
              <div className={reportHeaderClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7F1D1D]">
                      Top Foods
                    </p>
                    <h2 className={`mt-1 text-2xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                      Best sellers
                    </h2>
                  </div>
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl ${isLight ? "bg-[#F3DCDC] text-[#8F1D1D]" : "bg-[#7F1D1D]/18 text-[#7F1D1D]"}`}>
                    <ChefHat size={22} />
                  </div>
                </div>

                {topFoods[0] && !isLoading ? (
                  <div className={`mt-5 rounded-2xl border p-4 ${
                    isLight
                      ? "border-[#C18200]/35 bg-[#FFE8A3]"
                      : "border-white/10 bg-black/16"
                  }`}>
                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>
                      Leader
                    </p>
                    <h3 className={`mt-2 text-2xl font-black leading-tight ${isLight ? "text-[#241815]" : "text-white"}`}>
                      {getFoodName(topFoods[0])}
                    </h3>
                    <p className={`mt-2 text-sm font-bold ${isLight ? "text-[#5A4037]" : "text-white/55"}`}>
                      {getFoodSoldCount(topFoods[0])} sold in this range
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
                          <span className={`text-lg font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                            {getFoodName(row)}
                          </span>
                        ),
                      },
                      {
                        key: "total_sold",
                        label: "Sold",
                        render: (row) => (
                          <span className={`rounded-full px-4 py-1.5 text-base font-black ${
                            isLight
                              ? "border border-[#C18200]/35 bg-[#FFE8A3] text-[#7A4F00]"
                              : "bg-[#FFD166]/14 text-[#FFD166]"
                          }`}>
                            {getFoodSoldCount(row)}
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
          </div>
        </div>
      </section>

    </div>
  );
}
