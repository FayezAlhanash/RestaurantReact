function MenuItemCard({ item, onOpen }) {
    return (
        <div className="
    bg-white/90
    backdrop-blur-md
    max-w-[260px]
    rounded-[28px]
    overflow-hidden
    border border-white/60
    shadow-[0_8px_30px_rgb(0,0,0,0.06)]
    hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]
    hover:-translate-y-1
    transition-all
    duration-300
    flex flex-col
    font-['lemon']
">            <img
                src={item.image}
                alt="food"
                className="
    w-full
    h-44
    object-cover
    transition duration-500
    hover:scale-105
"
            />

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">

                {/* Title */}
                <div className="flex items-start justify-between mb-2">

                    <div>

                        <h2 className="text-[22px] font-bold text-gray-800 leading-tight">
                            {item.title}
                        </h2>

                       <p className="text-gray-500 text-sm leading-6 mt-2 mb-4">
                            {item.description}
                        </p>

                    </div>

                    <span className="text-[#7F1D1D] font-bold text-2xl">
                        ${item.price}
                    </span>

                </div>



                {/* Button */}
               <button
    onClick={onOpen}
    className="cursor-pointer
        w-full
        mt-auto
        bg-gradient-to-r
        from-[#aa3d3d]
        to-[#530c0c]
       hover:-translate-y-1
        hover:shadow-md
        transition-all
        duration-200
        text-white
        py-3.5
        rounded-2xl
       font-['lemon']
        text-lg
    "
>
    Add To Order
</button>

            </div>

        </div>
    )
}

export default MenuItemCard