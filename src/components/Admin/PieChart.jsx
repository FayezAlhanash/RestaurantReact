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


function PieChart({ items = [] }) {
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
          "#7f1d1d",
          "#0f766e",
          "#d97706",
          "#2563eb",
          "#be123c",
          "#57534e",
        ],
        borderColor: "#ffffff",
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
