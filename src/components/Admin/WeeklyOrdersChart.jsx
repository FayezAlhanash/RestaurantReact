import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

function formatDateLabel(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function WeeklyOrdersChart({
  items = [],
  valueKey = "revenue",
  label = "Revenue",
  valuePrefix = "$",
  valueSuffix = "",
  color = "#7f1d1d",
  variant = "bar",
  theme = "dark",
}) {
  const chartItems = items.length
    ? items
    : [
        { date: "No data", [valueKey]: 0 },
      ];
  const values = chartItems.map((item) => Number(item[valueKey] ?? 0));
  const maxValue = Math.max(...values, 0);
  const peakIndex = values.findIndex((value) => value === maxValue);
  const formatValue = (value) =>
    `${valuePrefix}${Number(value ?? 0).toFixed(valuePrefix ? 2 : 0)}${valueSuffix}`;
  const data = {
    labels: chartItems.map((item) => formatDateLabel(item.date)),
    datasets: [
      variant === "line"
        ? {
            label,
            data: values,
            borderColor: color,
            backgroundColor:
              theme === "light" ? "rgba(20, 184, 166, 0.12)" : "rgba(125, 211, 199, 0.14)",
            fill: true,
            tension: 0.34,
            borderWidth: 3,
            pointRadius: values.map((_, index) => (index === peakIndex ? 5 : 2.8)),
            pointHoverRadius: 6,
            pointBackgroundColor: values.map((_, index) =>
              index === peakIndex ? "#FFFFFF" : color
            ),
            pointBorderColor: color,
            pointBorderWidth: values.map((_, index) => (index === peakIndex ? 3 : 1.5)),
          }
        : {
            label,
            data: values,
            backgroundColor: color,
            borderRadius: 10,
            maxBarThickness: 52,
          },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: theme === "light" ? "#F8FAFC" : "#101A1D",
        titleColor: theme === "light" ? "#0F172A" : "#F8FAFC",
        bodyColor: theme === "light" ? "#0F172A" : "#F8FAFC",
        borderColor: "rgba(125,211,199,0.34)",
        borderWidth: 1,
        padding: 10,
        titleFont: { weight: "bold" },
        bodyFont: { weight: "bold" },
        callbacks: {
          label: (context) => formatValue(context.raw),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme === "light" ? "#6B5A52" : "rgba(255,255,255,0.62)",
          font: { weight: "bold", size: 13 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grace: "14%",
        grid: {
          color:
            variant === "line" && theme === "light"
              ? "rgba(15,23,42,0.08)"
              : "rgba(255,255,255,0.08)",
        },
        border: { display: false },
        ticks: {
          color: theme === "light" ? "#6B5A52" : "rgba(255,255,255,0.56)",
          font: { size: 13, weight: "bold" },
          callback: (value) => (valuePrefix ? `${valuePrefix}${value}` : value),
        },
      },
    },
  };

  return (
    <div className="relative h-full">
      {variant === "line" && peakIndex >= 0 && maxValue > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md bg-[#5AA69D] px-3 py-1 text-xs font-black text-white shadow-[0_10px_26px_rgba(20,184,166,0.22)]">
          {formatValue(maxValue)}
        </div>
      )}
      {variant === "line" ? (
        <Line data={data} options={options} />
      ) : (
        <Bar data={data} options={options} />
      )}
    </div>
  );
}

export default WeeklyOrdersChart;
