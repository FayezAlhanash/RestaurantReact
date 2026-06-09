import PieChart from "./PieChart";
import WeeklyOrdersChart from "./WeeklyOrdersChart";
function MainContent() {
    const stats = [
        {
            title: "Total Orders",
            value: "1240",
        },
        {
            title: "Top Restaurant",
            value: "Shawarma House",
        },
        {
            title: "Average Rating",
            value: "4.8 ⭐",
        },
        {
            title: "Total Revenue",
            value: "$15,250",
        },
    ];

    const earnings = [
        {
            restaurant: "Shawarma House",
            revenue: "$5,000",
        },
        {
            restaurant: "Pizza King",
            revenue: "$4,200",
        },
        {
            restaurant: "Burger Zone",
            revenue: "$3,500",
        },
        {
            restaurant: "Chicken Town",
            revenue: "$2,550",
        },
    ];
    const ratings = [
        {
            restaurant: "Shawarma House",
            rating: "4.9 ⭐",
        },
        {
            restaurant: "Pizza King",
            rating: "4.8 ⭐",
        },
        {
            restaurant: "Burger Zone",
            rating: "4.6 ⭐",
        },
        {
            restaurant: "Chicken Town",
            rating: "4.4 ⭐",
        },
    ];

    return (
        <div className="p-8 overflow-y-auto">

            <h1 className="text-5xl font-bold text-[#222]">
                Dashboard Overview
            </h1>

            <p className="text-gray-500 mt-2 mb-8">
                Real-time performance metrics across all restaurants
            </p>



            {/* Stats 1 */}
            <div className="grid grid-cols-4 gap-6 mb-8">

                {stats.map((card, index) => (
                    <div
                        key={index}
                        className="
    bg-white rounded-3xl p-6 border border-gray-100
    hover:-translate-y-2 hover:scale-105
    hover:shadow-[0_20px_40px_rgba(127,29,29,0.15)]
    transition-all duration-300 cursor-pointer
  "
                    >
                        <p className="text-gray-500 uppercase text-sm mb-3">
                            {card.title}
                        </p>

                        <h2 className="text-4xl font-bold">
                            {card.value}
                        </h2>
                    </div>
                ))}

            </div>
            {/* Stats 1 */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <WeeklyOrdersChart />
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <PieChart />
                </div>
            </div>

            {/*STATS 2 */}
            <div className="grid grid-cols-2 gap-8">

                {/* Earnings */}
                <div className="
    bg-white
    rounded-3xl
    p-6
    shadow-sm

    hover:shadow-xl
    hover:scale-[1.02]
    hover:bg-[#fffdfd]

    transition-all
    duration-300
">

                    <h2 className="text-2xl font-bold mb-6">
                        Restaurant Earnings
                    </h2>

                    <div className="space-y-4">

                        {earnings.map((item, index) => (
                            <div
                                key={index}
                                className="
    flex
    justify-between
    items-center
    p-4
    bg-gray-50
    rounded-2xl

    hover:bg-[#fff1f1]
    hover:translate-x-2
hover:-translate-y-2
hover:shadow-[0_20px_40px_rgba(127,29,29,0.15)]
    transition-all
    duration-300
    cursor-pointer
"
                            >
                                <span>{item.restaurant}</span>

                                <span className="font-bold text-green-600">
                                    {item.revenue}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                {/* Ratings */}
                <div className="
    bg-white
    rounded-3xl
    p-6
    shadow-sm
    hover:scale-[1.02]
    hover:bg-[#fffdfd]
hover:-translate-y-2
hover:shadow-[0_20px_40px_rgba(127,29,29,0.15)]
    transition-all
    duration-300
">

                    <h2 className="text-2xl font-bold mb-6">
                        Restaurant Ratings
                    </h2>

                    <div className="space-y-4">

                        {ratings.map((item, index) => (
                            <div
                                key={index}
                                className="
    flex
    justify-between
    items-center
    p-4
    bg-gray-50
    rounded-2xl

    hover:bg-[#fff1f1]
    hover:translate-x-2

    transition-all
    duration-300
    cursor-pointer
"
                            >
                                <span>{item.restaurant}</span>

                                <span className="font-bold">
                                    {item.rating}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

            </div>
            {/*STATS 2 */}


        </div>
    );
}

export default MainContent;