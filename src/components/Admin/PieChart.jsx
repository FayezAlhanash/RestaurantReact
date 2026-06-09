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


function PieChart() {
  const data = {
    labels: ["Shawarma House", "Pizza King", "Burger Zone", "Chicken Town"],
    datasets: [
      {
        label: "Orders Share",
        data: [35, 25, 20, 20],
        backgroundColor: [
          "#7f1d1d",
          "#a83838",
          "#d65c5c",
          "#f0a1a1",
        ],
        borderWidth: 1,
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
            display: true,
            text: "Orders Distribution",
        },
    },
};

  return (
    <div className="h-[300px] flex items-center justify-center">
        <Pie
            data={data}
            options={options}
        />
    </div>
);
}

export default PieChart;