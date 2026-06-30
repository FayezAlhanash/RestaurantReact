import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import api from "../../API/axios";

function CategoryTabs({ activeCategory, setActiveCategory }) {
    const [restaurants, setRestaurants] = useState([]);

    useEffect(() => {
       const fetchRestaurants = async () => {
    try {
        const res = await api.get("/restaurants");

        console.log("Restaurants Response:", res.data);

setRestaurants(res.data.restaurants);
    } catch (error) {
        console.log(error);
    }
};

        fetchRestaurants();
    }, []);

    return (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {restaurants.map((restaurant) => {
                const isActive = activeCategory === restaurant.id;

                return (
                    <button
                        key={restaurant.id}
                        onClick={() => setActiveCategory(restaurant.id)}
                        className={`flex min-w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition sm:px-5 ${isActive
                                ? "border-[#F7C948] bg-[#F7C948] text-[#34270D] shadow-[0_8px_20px_rgba(247,201,72,0.25)]"
                                : "border-[#E7DCD6] bg-white text-[#6E5E58] hover:border-[#CDBBB3]"
                            }`}
                    >
                        <Store size={18} />
                        {restaurant.name}
                    </button>
                );
            })}
        </div>
    );
}

export default CategoryTabs;