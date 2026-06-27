import { useState, useEffect } from "react";
import api from "../../API/axios";
import RestaurantModal from "./RestaurantsModal";
import AddRestaurantsCard from "./AddRestaurantsCard";
import RestaurantsCard from "./RestaurantCard";
function RestaurantsManagements() {

    const [isOpen, setIsOpen] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    useEffect(() => {

        const getRestaurants = async () => {

            try {

                const response = await api.get(
                    "/restaurants"
                );

                console.log(response.data);

                setRestaurants(
                    response.data.restaurants
                );

            } catch (error) {

                console.log(error);

            }

        };

        getRestaurants();

    }, []);

    const handleDelete = async (id) => {

        try {

            await api.delete(
                `/restaurants/${id}`
            );

            setRestaurants(
                restaurants.filter(
                    (restaurant) =>
                        restaurant.id !== id
                )
            );

        } catch (error) {

            console.log(error.response?.data);

        }
    };
    return (
        <div className="p-4 sm:p-6 lg:p-8">

            <h1 className="text-3xl sm:text-4xl font-bold mb-8">
                Restaurants
            </h1>



            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-8">

                {restaurants.map((restaurant) => (
                    <RestaurantsCard
                        key={restaurant.id}
                        restaurant={restaurant}

                        onDelete={handleDelete}

                        onEdit={(restaurant) => {
                            setSelectedRestaurant(restaurant);
                            setIsOpen(true);
                        }}
                    />
                ))}

                {Array.from({
                    length: 4 - restaurants.length
                }).map((_, index) => (
                    <AddRestaurantsCard
                        key={index}
                        onClick={() => {
                            setSelectedRestaurant(null);
                            setIsOpen(true);
                        }}
                    />
                ))}

            </div>


            <RestaurantModal
                isOpen={isOpen}
                restaurant={selectedRestaurant}
                onClose={() => {
                    setIsOpen(false);
                    setSelectedRestaurant(null);
                }}
                onSave={(updatedRestaurant) => {
                    setRestaurants((prev) => {
                        const exists = prev.some((r) => r.id === updatedRestaurant.id);

                        if (exists) {
                            return prev.map((r) =>
                                r.id === updatedRestaurant.id ? updatedRestaurant : r
                            );
                        }

                        return [...prev, updatedRestaurant];
                    });
                }}
            />
        </div>
    );
}

export default RestaurantsManagements;
