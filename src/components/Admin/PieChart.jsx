import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);
import { Pie } from "react-chartjs-2";


function PieChart({ items = [], theme = "dark" }) {
  const chartItems = items.length
    ? items
    : [
        { restaurant: "No revenue", revenueValue: 1 },
      ];
  const data = {
    labels: chartItems.map((item) => item.restaurant),
    datasets: [
      {
        label: "Revenue",
        data: chartItems.map((item) => Math.max(Number(item.revenueValue), 0.01)),
        backgroundColor: [
          "#7F1D1D",
          "#16A34A",
          "#FFD166",
          "#38BDF8",
          "#D946EF",
          "#94A3B8",
        ],
        borderColor: "#202B2F",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

 const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
        legend: {
            position: "bottom",
            labels: {
                color: theme === "light" ? "#241815" : "rgba(255,255,255,0.68)",
                font: { weight: "bold", size: 14 },
                padding: 18,
            },
        },

        title: {
            display: false,
        },
    },
};

  return (
    <div className="flex h-full items-center justify-center">
        <Pie
            data={data}
            options={options}
        />
    </div>
);
}

export default PieChart;
