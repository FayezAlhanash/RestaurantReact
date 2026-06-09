function AddRestaurantCard({ onClick }) {
    return (
        <div
            onClick={onClick}
            className="
               
                border-2
        border-dashed
        border-red-200
        rounded-3xl
        h-[320px]
        flex
        flex-col
        items-center
        justify-center
        cursor-pointer

      hover:scale-[1.03]
        hover:-translate-y-2
        hover:bg-[#fff8f8]
        hover:shadow-[0_20px_40px_rgba(127,29,29,0.15)]

        transition-all
        duration-300
    "
        >
            <div
                className="
                    w-20
                    h-20
                    rounded-full
                    bg-gray-100

                    flex
                    items-center
                    justify-center

                    text-5xl
                    text-red-900
                "
            >
                +
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
                Add Restaurant
            </h2>

            <p className="text-gray-500 mt-2 text-center px-6">
                Click to create a new restaurant
            </p>
        </div>
    );
}

export default AddRestaurantCard;