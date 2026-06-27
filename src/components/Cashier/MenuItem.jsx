function MenuItemCard({ item, onOpen }) {
  return (
    <div className="
  bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-md
  hover:shadow-xl hover:-translate-y-1 transition-all duration-300
  flex flex-col font-['raleway'] w-full
">

      <img
        src={item.image}
        alt={item.title}
        className="w-full h-40 sm:h-52 object-cover transition-transform duration-500 hover:scale-105"
      />

      <div className="p-4 sm:p-5 flex flex-col flex-1">

        <div className="flex items-start justify-between mb-3">

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">
              {item.title}
            </h2>

            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {item.description}
            </p>
          </div>

          <span className="text-red-800 font-bold text-xl sm:text-2xl">
            ${item.price}
          </span>

        </div>

        <button
          onClick={onOpen}
          className="
        mt-auto w-full py-3 rounded-xl
        bg-gradient-to-r from-red-600 to-red-900
        text-white font-semibold
        hover:shadow-lg hover:-translate-y-1
        transition-all duration-200
        text-base sm:text-lg
      "
        >
          Add To Order
        </button>

      </div>
    </div>
  );
}

export default MenuItemCard;