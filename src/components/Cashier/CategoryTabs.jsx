import { useEffect, useState } from "react";
import api from "../../API/axios";

function CategoryTabs({ activeCategory, setActiveCategory }) {
    const [restaurants, setRestaurants] = useState([]);

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get("/restaurants");
                setRestaurants(res.data.restaurants);
            } catch (error) {
                console.log("Error fetching restaurants:", error);
            }
        };

        fetchRestaurants();
    }, []);

    return (
        <div className="flex items-center justify-start lg:justify-center gap-3 sm:gap-4 mb-8 overflow-x-auto px-4 sm:px-6 pb-2 font-['raleway']">

            {restaurants.map((restaurant) => (
                <button
                    key={restaurant.id}
                    onClick={() => setActiveCategory(restaurant.id)}
                    className={`
                        px-5 sm:px-8 py-3 sm:py-4 rounded-2xl flex items-center gap-2 font-semibold min-w-fit transition
                        ${activeCategory === restaurant.id
                            ? "bg-yellow-400 text-black"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }
                    `}
                >
                    {restaurant.name}
                </button>
            ))}

        </div>
    );
}

export default CategoryTabs;
