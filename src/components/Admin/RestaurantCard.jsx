function RestaurantCard({
    restaurant,
    onDelete,
    onEdit
}) {
    console.log(
        "http://46.101.112.67:8000/" + restaurant.front_image
    );
    console.log(restaurant);
    return (
        <div
            className="
                bg-white
                rounded-3xl
                p-6
                border
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
            "
        >
          <img
  src={
    restaurant.front_image?.startsWith("http")
      ? restaurant.front_image.replace("https://", "http://")
      : `http://46.101.112.67:8000/storage/${restaurant.front_image}`
  }
  alt=""
  className="
    w-full
    h-48
    object-cover
    rounded-2xl
    mb-5
  "
/>

            <h2 className="text-2xl font-bold text-red-900">
                {restaurant.name}
            </h2>

            <p className="text-gray-500 mt-2">
                {restaurant.description}
            </p>

            <p className="mt-4 font-semibold">
                Tax: {restaurant.tax_percentage}%
            </p>
            <div className="flex gap-3 mt-5">

                <button
                    onClick={() => onEdit(restaurant)}
                    className="
            flex-1
            py-2
            bg-blue-900
            text-white
            rounded-xl
            hover:bg-blue-950
            transition
            cursor-pointer
        "
                >
                    Edit
                </button>

                <button
                    onClick={() => onDelete(restaurant.id)}
                    className="
            flex-1
            py-2
            bg-red-900
            text-white
            rounded-xl
            hover:bg-red-950
            transition
            cursor-pointer
        "
                >
                    Delete
                </button>

            </div>
        </div>
    );
}

export default RestaurantCard;