import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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
}) {
  const chartItems = items.length
    ? items
    : [
        { date: "No data", [valueKey]: 0 },
      ];
  const data = {
    labels: chartItems.map((item) => formatDateLabel(item.date)),
    datasets: [
      {
        label,
        data: chartItems.map((item) => item[valueKey]),
        backgroundColor: color,
        borderRadius: 8,
        maxBarThickness: 42,
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
        callbacks: {
          label: (context) =>
            `${valuePrefix}${Number(context.raw ?? 0).toFixed(
              valuePrefix ? 2 : 0
            )}${valueSuffix}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#78716c",
          font: { weight: "bold" },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#eee7df" },
        ticks: { color: "#78716c" },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default WeeklyOrdersChart;
