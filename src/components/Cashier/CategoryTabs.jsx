import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';

function CategoryTabs({ activeCategory, setActiveCategory }) {

    return (
        <div className="flex items-center justify-center gap-4 mb-8 overflow-x-auto font-['raleway']">
            {/* Active */}
            <button
                onClick={() => setActiveCategory("shawarma")}
                className={`cursor-pointer
        px-8 py-4 rounded-2xl flex items-center gap-2 font-semibold min-w-fit transition cursor-pointer
        ${activeCategory === "shawarma"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }
    `}
            >

                <LunchDiningIcon />

                Shawarma

            </button>

            {/* Others */}
            <button
                onClick={() => setActiveCategory("pizza")}
                className={`cursor-pointer
        px-8 py-4 rounded-2xl flex items-center gap-2 font-semibold min-w-fit transition
        ${activeCategory === "pizza"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }
    `}
            >
                <LocalPizzaIcon />

                Pizza

            </button>

            <button
                onClick={() => setActiveCategory("pastries")}
                className={`cursor-pointer
        px-8 py-4 rounded-2xl flex items-center gap-2 font-semibold min-w-fit transition
        ${activeCategory === "pastries"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }
    `}
            >
                <BakeryDiningIcon />

                Pastries

            </button>

            <button
                onClick={() => setActiveCategory("drinks")}
                className={`cursor-pointer
        px-8 py-4 rounded-2xl flex items-center gap-2 font-semibold min-w-fit transition
        ${activeCategory === "drinks"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }
    `}
            >
                <LocalDrinkIcon />

                Drinks

            </button>

        </div>
    )
}

export default CategoryTabs