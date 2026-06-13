function MenuItemCard({ item, onOpen }) {
  return (
    <div className="
      bg-white
      rounded-3xl
      overflow-hidden
      border border-gray-200
      shadow-md
      hover:shadow-xl
      hover:-translate-y-1
      transition-all duration-300
      flex flex-col
   font-['raleway']
      max-w-[260px]
    ">
      <img
        src={item.image}
        alt={item.title}
        className="
          w-full
          h-44
          object-cover
          transition-transform duration-500
          hover:scale-105
        "
      />

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">

        {/* Title & Price */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {item.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {item.description}
            </p>
          </div>
          <span className="text-red-800 font-bold text-2xl">
            ${item.price}
          </span>
        </div>

        {/* Button */}
        <button
          onClick={onOpen}
          className="
            mt-auto
            w-full
            py-3
            rounded-xl
            bg-gradient-to-r from-red-600 to-red-900
            text-white
            text-lg
            font-semibold
            hover:shadow-lg
            hover:-translate-y-1
            transition-all duration-200
          "
        >
          Add To Order
        </button>
      </div>
    </div>
  );
}

export default MenuItemCard;